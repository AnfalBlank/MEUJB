import { NextResponse } from "next/server";
import { client, ensureTablesAndSeed, insertAuditLog } from "@/db";

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

    // 1. Check in Turso database
    let dbUser: any = null;
    try {
      const res = await client.execute({
        sql: "SELECT * FROM users WHERE LOWER(username) = ? OR LOWER(name) = ?",
        args: [cleanUser, cleanUser],
      });
      if (res.rows.length > 0) {
        dbUser = res.rows[0];
      }
    } catch (dbErr) {
      console.warn("DB query failed in login, checking fallback", dbErr);
    }

    // 2. Validate password
    let matched = false;
    let authPayload: any = null;

    if (dbUser) {
      if (dbUser.password === cleanPass) {
        matched = true;
        authPayload = {
          id: String(dbUser.id),
          username: String(dbUser.username),
          name: String(dbUser.name),
          role: String(dbUser.role).toLowerCase(),
          isRoot: Boolean(dbUser.is_root) || cleanUser === "admin" || cleanUser === "root",
          loggedInAt: new Date().toISOString(),
        };
      }
    } else {
      // Fallback for default initial credentials if DB was offline or not yet populated
      if (cleanUser === "admin" && cleanPass === "password") {
        matched = true;
        authPayload = {
          id: "usr-admin-root",
          username: "admin",
          name: "Administrator Teknik",
          role: "superadmin",
          isRoot: true,
          loggedInAt: new Date().toISOString(),
        };
      } else if (cleanUser === "prinof" && cleanPass === "password") {
        matched = true;
        authPayload = {
          id: "usr-prinof",
          username: "prinof",
          name: "Prinof",
          role: "manager",
          isRoot: false,
          loggedInAt: new Date().toISOString(),
        };
      }
    }

    if (!matched || !authPayload) {
      // Log failed login attempt
      await insertAuditLog({
        username: cleanUser,
        userName: cleanUser,
        userRole: "unauthenticated",
        action: "LOGIN_FAILED",
        category: "AUTH",
        details: `Percobaan login gagal untuk username: "${cleanUser}"`,
        ipAddress: ip,
        userAgent,
      });

      return NextResponse.json(
        { success: false, error: "Username atau password salah. Silakan periksa kembali." },
        { status: 401 }
      );
    }

    // 3. Update last login & create audit log
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
      details: `User ${authPayload.name} (@${authPayload.username}) berhasil login ke sistem`,
      ipAddress: ip,
      userAgent,
    });

    return NextResponse.json({
      success: true,
      user: authPayload,
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
