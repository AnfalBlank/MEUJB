import { NextResponse } from "next/server";
import { client, ensureTablesAndSeed, insertAuditLog } from "@/db";
import { hashPassword, verifyPassword, createSessionToken } from "@/utils/auth";

export async function POST(req: Request) {
  try {
    await ensureTablesAndSeed();
    const body = await req.json();
    const cleanUser = String(body.username || "").trim().toLowerCase();
    const cleanPass = String(body.password || "").trim();

    if (!cleanUser || !cleanPass) {
      return NextResponse.json(
        { success: false, error: "Username dan password wajib diisi." },
        { status: 400 }
      );
    }

    const ip = req.headers.get("x-forwarded-for") || req.headers.get("x-real-ip") || "127.0.0.1";
    const userAgent = req.headers.get("user-agent") || "Browser";

    // 1. Cari user di DB
    let dbUser: any = null;
    try {
      const res = await client.execute({
        sql: "SELECT * FROM users WHERE LOWER(username) = ?",
        args: [cleanUser],
      });
      if (res.rows.length > 0) dbUser = res.rows[0];
    } catch (dbErr) {
      console.warn("DB query failed in login", dbErr);
    }

    // 2. Fallback hardcoded jika DB offline (hanya untuk initial setup)
    if (!dbUser) {
      await insertAuditLog({
        username: cleanUser,
        userName: cleanUser,
        userRole: "unauthenticated",
        action: "LOGIN_FAILED",
        category: "AUTH",
        details: `Percobaan login gagal - user tidak ditemukan: "${cleanUser}"`,
        ipAddress: ip,
        userAgent,
      });
      return NextResponse.json(
        { success: false, error: "Username atau password salah." },
        { status: 401 }
      );
    }

    // 3. Verifikasi password (support bcrypt & plaintext lama)
    const passwordMatch = await verifyPassword(cleanPass, String(dbUser.password));

    if (!passwordMatch) {
      await insertAuditLog({
        username: cleanUser,
        userName: String(dbUser.name),
        userRole: String(dbUser.role),
        action: "LOGIN_FAILED",
        category: "AUTH",
        details: `Percobaan login gagal - password salah untuk user: "${cleanUser}"`,
        ipAddress: ip,
        userAgent,
      });
      return NextResponse.json(
        { success: false, error: "Username atau password salah." },
        { status: 401 }
      );
    }

    // 4. Jika password masih plaintext, upgrade ke bcrypt sekarang
    if (!String(dbUser.password).startsWith("$2")) {
      try {
        const hashed = await hashPassword(cleanPass);
        await client.execute({
          sql: "UPDATE users SET password = ?, updated_at = ? WHERE id = ?",
          args: [hashed, new Date().toISOString(), dbUser.id],
        });
      } catch (upgradeErr) {
        console.warn("Password upgrade to bcrypt failed:", upgradeErr);
      }
    }

    const isRoot =
      Boolean(dbUser.is_root) ||
      cleanUser === "admin" ||
      cleanUser === "root";

    const authPayload = {
      id: String(dbUser.id),
      username: String(dbUser.username),
      name: String(dbUser.name),
      role: String(dbUser.role).toLowerCase(),
      isRoot,
      loggedInAt: new Date().toISOString(),
    };

    // 5. Buat session token
    const sessionToken = createSessionToken({
      userId: authPayload.id,
      username: authPayload.username,
      name: authPayload.name,
      role: authPayload.role,
      isRoot: authPayload.isRoot,
    });

    // 6. Update last login
    const now = new Date().toISOString();
    try {
      await client.execute({
        sql: "UPDATE users SET last_login_at = ? WHERE id = ?",
        args: [now, authPayload.id],
      });
    } catch {}

    await insertAuditLog({
      userId: authPayload.id,
      username: authPayload.username,
      userName: authPayload.name,
      userRole: authPayload.role,
      action: "LOGIN",
      category: "AUTH",
      details: `User ${authPayload.name} (@${authPayload.username}) berhasil login`,
      ipAddress: ip,
      userAgent,
    });

    return NextResponse.json({
      success: true,
      user: authPayload,
      sessionToken,
      message: "Login berhasil",
    });
  } catch (error: any) {
    console.error("API POST /api/auth/login error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Terjadi kesalahan internal server" },
      { status: 500 }
    );
  }
}
