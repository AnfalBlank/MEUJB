import { NextResponse } from "next/server";
import { client, ensureTablesAndSeed, insertAuditLog } from "@/db";
import { requireAuth } from "@/utils/apiMiddleware";
import { hashPassword, verifyPassword } from "@/utils/auth";

export async function PUT(req: Request) {
  const auth = requireAuth(req);
  if (!auth.ok) return auth.response;

  try {
    await ensureTablesAndSeed();
    const body = await req.json();
    const cleanUser = String(body.username || "").trim().toLowerCase();
    const newName = String(body.name || "").trim();
    const currentPassword = String(body.currentPassword || "").trim();
    const newPassword = String(body.newPassword || "").trim();

    if (!cleanUser)
      return NextResponse.json({ success: false, error: "Username tidak ditemukan." }, { status: 400 });
    if (!newName)
      return NextResponse.json({ success: false, error: "Nama tidak boleh kosong." }, { status: 400 });

    // User hanya bisa update profil diri sendiri
    if (cleanUser !== auth.session.username) {
      return NextResponse.json(
        { success: false, error: "Anda hanya dapat mengubah profil sendiri." },
        { status: 403 }
      );
    }

    const res = await client.execute({
      sql: "SELECT * FROM users WHERE LOWER(username) = ?",
      args: [cleanUser],
    });
    if (res.rows.length === 0)
      return NextResponse.json({ success: false, error: "Akun tidak ditemukan." }, { status: 404 });

    const user = res.rows[0];
    let willUpdatePassword = false;

    if (newPassword) {
      if (newPassword.length < 6)
        return NextResponse.json({ success: false, error: "Password baru minimal 6 karakter." }, { status: 400 });
      if (!currentPassword)
        return NextResponse.json({ success: false, error: "Masukkan password saat ini untuk konfirmasi." }, { status: 400 });

      const passwordMatch = await verifyPassword(currentPassword, String(user.password));
      if (!passwordMatch)
        return NextResponse.json({ success: false, error: "Password saat ini tidak cocok." }, { status: 400 });

      willUpdatePassword = true;
    }

    const now = new Date().toISOString();
    if (willUpdatePassword) {
      const hashedNew = await hashPassword(newPassword);
      await client.execute({
        sql: "UPDATE users SET name = ?, password = ?, updated_at = ? WHERE id = ?",
        args: [newName, hashedNew, now, user.id],
      });
    } else {
      await client.execute({
        sql: "UPDATE users SET name = ?, updated_at = ? WHERE id = ?",
        args: [newName, now, user.id],
      });
    }

    const ip = req.headers.get("x-forwarded-for") || "127.0.0.1";
    const userAgent = req.headers.get("user-agent") || "Browser";
    await insertAuditLog({
      userId: String(user.id),
      username: cleanUser,
      userName: newName,
      userRole: String(user.role),
      action: "UPDATE_PROFILE",
      category: "USER_MANAGEMENT",
      details: willUpdatePassword
        ? `@${cleanUser} mengubah nama menjadi "${newName}" dan mereset password`
        : `@${cleanUser} mengubah nama menjadi "${newName}"`,
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
      message: "Profil berhasil diperbarui.",
    });
  } catch (error: any) {
    console.error("API PUT /api/users/profile error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
