import { NextResponse } from "next/server";
import { client, ensureTablesAndSeed, insertAuditLog } from "@/db";

export async function PUT(req: Request) {
  try {
    await ensureTablesAndSeed();
    const body = await req.json();
    const cleanUser = String(body.username || "").trim().toLowerCase();
    const newName = String(body.name || "").trim();
    const currentPassword = String(body.currentPassword || "").trim();
    const newPassword = String(body.newPassword || "").trim();

    if (!cleanUser) {
      return NextResponse.json(
        { success: false, error: "Username tidak ditemukan." },
        { status: 400 }
      );
    }

    if (!newName) {
      return NextResponse.json(
        { success: false, error: "Nama tampilan (Display Name) tidak boleh kosong." },
        { status: 400 }
      );
    }

    // 1. Fetch user from DB
    const res = await client.execute({
      sql: "SELECT * FROM users WHERE LOWER(username) = ?",
      args: [cleanUser],
    });

    if (res.rows.length === 0) {
      return NextResponse.json(
        { success: false, error: "Akun user tidak ditemukan di database." },
        { status: 404 }
      );
    }

    const user = res.rows[0];

    // 2. If changing password, verify current password
    let willUpdatePassword = false;
    if (newPassword) {
      if (newPassword.length < 5) {
        return NextResponse.json(
          { success: false, error: "Kata sandi baru minimal 5 karakter." },
          { status: 400 }
        );
      }

      if (!currentPassword) {
        return NextResponse.json(
          { success: false, error: "Silakan masukkan kata sandi saat ini untuk konfirmasi." },
          { status: 400 }
        );
      }

      if (user.password !== currentPassword) {
        return NextResponse.json(
          { success: false, error: "Kata sandi saat ini tidak cocok." },
          { status: 400 }
        );
      }

      willUpdatePassword = true;
    }

    // 3. Update in Turso
    const now = new Date().toISOString();
    if (willUpdatePassword) {
      await client.execute({
        sql: "UPDATE users SET name = ?, password = ?, updated_at = ? WHERE id = ?",
        args: [newName, newPassword, now, user.id],
      });
    } else {
      await client.execute({
        sql: "UPDATE users SET name = ?, updated_at = ? WHERE id = ?",
        args: [newName, now, user.id],
      });
    }

    // 4. Insert Audit Log
    const ip = req.headers.get("x-forwarded-for") || req.headers.get("x-real-ip") || "127.0.0.1";
    const userAgent = req.headers.get("user-agent") || "Browser";

    const detailMsg = willUpdatePassword
      ? `User @${cleanUser} memperbarui profil: ganti nama menjadi "${newName}" dan memperbarui kata sandi`
      : `User @${cleanUser} memperbarui display name menjadi "${newName}"`;

    await insertAuditLog({
      userId: String(user.id),
      username: cleanUser,
      userName: newName,
      userRole: String(user.role),
      action: "UPDATE_PROFILE",
      category: "USER_MANAGEMENT",
      details: detailMsg,
      ipAddress: ip,
      userAgent,
    });

    return NextResponse.json({
      success: true,
      user: {
        id: String(user.id),
        username: cleanUser,
        name: newName,
        role: String(user.role),
        isRoot: Boolean(user.is_root) || cleanUser === "admin" || cleanUser === "root",
      },
      message: "Profil dan kata sandi berhasil diperbarui.",
    });
  } catch (error: any) {
    console.error("API PUT /api/users/profile error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Gagal memperbarui profil" },
      { status: 500 }
    );
  }
}
