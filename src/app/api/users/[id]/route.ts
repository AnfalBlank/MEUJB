import { NextResponse } from "next/server";
import { client, insertAuditLog } from "@/db";
import { UserRole } from "@/types";
import { requireSuperAdmin } from "@/utils/apiMiddleware";
import { hashPassword } from "@/utils/auth";

const ALLOWED_ROLES: UserRole[] = ["superadmin", "admin", "manager"];

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = requireSuperAdmin(req);
  if (!auth.ok) return auth.response;

  try {
    const { id } = await params;
    const body = await req.json();

    const name = String(body.name || "").trim();
    const role = String(body.role || "").trim().toLowerCase() as UserRole;
    const password = body.password ? String(body.password).trim() : null;

    if (!name || !role)
      return NextResponse.json({ success: false, error: "Nama dan Role wajib diisi." }, { status: 400 });
    if (!ALLOWED_ROLES.includes(role))
      return NextResponse.json({ success: false, error: "Role tidak valid." }, { status: 400 });
    if (password && password.length < 6)
      return NextResponse.json({ success: false, error: "Password minimal 6 karakter." }, { status: 400 });

    const existing = await client.execute({ sql: "SELECT * FROM users WHERE id = ?", args: [id] });
    if (existing.rows.length === 0)
      return NextResponse.json({ success: false, error: "User tidak ditemukan." }, { status: 404 });

    const currentTarget = existing.rows[0];
    const now = new Date().toISOString();
    const isRootUser = Boolean(currentTarget.is_root) || currentTarget.username === "admin" || currentTarget.username === "root";
    const finalUsername = isRootUser ? String(currentTarget.username) : (
      body.username ? String(body.username).trim().toLowerCase() : String(currentTarget.username)
    );

    if (!isRootUser && finalUsername !== currentTarget.username) {
      if (finalUsername.length < 3)
        return NextResponse.json({ success: false, error: "Username minimal 3 karakter." }, { status: 400 });
      const dup = await client.execute({
        sql: "SELECT id FROM users WHERE LOWER(username) = ? AND id != ?",
        args: [finalUsername, id],
      });
      if (dup.rows.length > 0)
        return NextResponse.json({ success: false, error: `Username "${finalUsername}" sudah digunakan.` }, { status: 409 });
    }

    if (password) {
      const hashedPassword = await hashPassword(password);
      await client.execute({
        sql: "UPDATE users SET username = ?, name = ?, role = ?, password = ?, updated_at = ? WHERE id = ?",
        args: [finalUsername, name, role, hashedPassword, now, id],
      });
    } else {
      await client.execute({
        sql: "UPDATE users SET username = ?, name = ?, role = ?, updated_at = ? WHERE id = ?",
        args: [finalUsername, name, role, now, id],
      });
    }

    const ip = req.headers.get("x-forwarded-for") || "127.0.0.1";
    const userAgent = req.headers.get("user-agent") || "Browser";
    await insertAuditLog({
      userId: auth.session.userId,
      username: auth.session.username,
      userName: auth.session.name,
      userRole: auth.session.role,
      action: "UPDATE_USER",
      category: "USER_MANAGEMENT",
      details: `${auth.session.name} memperbarui user @${currentTarget.username}: nama "${name}", role [${role}]${password ? " (password direset)" : ""}`,
      ipAddress: ip,
      userAgent,
    });

    return NextResponse.json({ success: true, message: `User @${currentTarget.username} berhasil diperbarui.` });
  } catch (error: any) {
    console.error("API PUT /api/users/[id] error:", error);
    insertAuditLog({
      username: "system",
      userName: "System",
      userRole: "system",
      action: "SYSTEM_ERROR",
      category: "SYSTEM",
      details: `API PUT /api/users/[id] error: ${error?.message || String(error)}`,
    }).catch(() => {});
    
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = requireSuperAdmin(req);
  if (!auth.ok) return auth.response;

  try {
    const { id } = await params;

    const existing = await client.execute({ sql: "SELECT * FROM users WHERE id = ?", args: [id] });
    if (existing.rows.length === 0)
      return NextResponse.json({ success: false, error: "User tidak ditemukan." }, { status: 404 });

    const targetUser = existing.rows[0];

    if (targetUser.is_root || targetUser.username === "admin" || targetUser.username === "root")
      return NextResponse.json({ success: false, error: "Akun root tidak boleh dihapus." }, { status: 403 });

    if (String(targetUser.username).toLowerCase() === auth.session.username.toLowerCase())
      return NextResponse.json({ success: false, error: "Tidak bisa menghapus akun sendiri." }, { status: 400 });

    await client.execute({ sql: "DELETE FROM users WHERE id = ?", args: [id] });

    const ip = req.headers.get("x-forwarded-for") || "127.0.0.1";
    const userAgent = req.headers.get("user-agent") || "Browser";
    await insertAuditLog({
      userId: auth.session.userId,
      username: auth.session.username,
      userName: auth.session.name,
      userRole: auth.session.role,
      action: "DELETE_USER",
      category: "USER_MANAGEMENT",
      details: `${auth.session.name} menghapus user: ${targetUser.name} (@${targetUser.username})`,
      ipAddress: ip,
      userAgent,
    });

    return NextResponse.json({ success: true, message: `User @${targetUser.username} berhasil dihapus.` });
  } catch (error: any) {
    console.error("API DELETE /api/users/[id] error:", error);
    insertAuditLog({
      username: "system",
      userName: "System",
      userRole: "system",
      action: "SYSTEM_ERROR",
      category: "SYSTEM",
      details: `API DELETE /api/users/[id] error: ${error?.message || String(error)}`,
    }).catch(() => {});
    
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
