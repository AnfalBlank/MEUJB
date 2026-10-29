import { NextResponse } from "next/server";
import { client, insertAuditLog } from "@/db";
import { UserRole } from "@/types";

const ALLOWED_ROLES: UserRole[] = ["superadmin", "admin", "manager"];

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await req.json();

    const name = String(body.name || "").trim();
    const role = String(body.role || "").trim().toLowerCase() as UserRole;
    const password = body.password ? String(body.password).trim() : null;
    const requester = body.requester || {};

    if (!name || !role) {
      return NextResponse.json(
        { success: false, error: "Nama dan Role wajib diisi." },
        { status: 400 }
      );
    }

    if (!ALLOWED_ROLES.includes(role)) {
      return NextResponse.json(
        { success: false, error: "Role tidak valid. Role hanya boleh: superadmin, admin, manager." },
        { status: 400 }
      );
    }

    // Check user exists
    const existing = await client.execute({
      sql: "SELECT * FROM users WHERE id = ?",
      args: [id],
    });

    if (existing.rows.length === 0) {
      return NextResponse.json(
        { success: false, error: "User tidak ditemukan." },
        { status: 404 }
      );
    }

    const currentTarget = existing.rows[0];
    const now = new Date().toISOString();
    const targetUsername = body.username 
      ? String(body.username).trim().toLowerCase().replace(/\s+/g, "") 
      : String(currentTarget.username);

    // Prevent changing root admin username
    const isRootUser = currentTarget.is_root || currentTarget.username === "admin" || currentTarget.username === "root";
    const finalUsername = isRootUser ? String(currentTarget.username) : targetUsername;

    if (!isRootUser && finalUsername !== currentTarget.username) {
      if (finalUsername.length < 3) {
        return NextResponse.json(
          { success: false, error: "Username minimal 3 karakter." },
          { status: 400 }
        );
      }
      const dup = await client.execute({
        sql: "SELECT id FROM users WHERE LOWER(username) = ? AND id != ?",
        args: [finalUsername, id],
      });
      if (dup.rows.length > 0) {
        return NextResponse.json(
          { success: false, error: `Username "${finalUsername}" sudah digunakan.` },
          { status: 409 }
        );
      }
    }

    if (password && password.length >= 5) {
      await client.execute({
        sql: "UPDATE users SET username = ?, name = ?, role = ?, password = ?, updated_at = ? WHERE id = ?",
        args: [finalUsername, name, role, password, now, id],
      });
    } else {
      await client.execute({
        sql: "UPDATE users SET username = ?, name = ?, role = ?, updated_at = ? WHERE id = ?",
        args: [finalUsername, name, role, now, id],
      });
    }


    // Audit log
    const ip = req.headers.get("x-forwarded-for") || req.headers.get("x-real-ip") || "127.0.0.1";
    const userAgent = req.headers.get("user-agent") || "Browser";
    const requesterName = requester.name || requester.username || "Superadmin/Root";

    await insertAuditLog({
      userId: requester.id,
      username: requester.username || "admin",
      userName: requesterName,
      userRole: requester.role || "superadmin",
      action: "UPDATE_USER",
      category: "USER_MANAGEMENT",
      details: `${requesterName} memperbarui user @${currentTarget.username}: nama "${name}", role [${role}]${password ? " (kata sandi direset)" : ""}`,
      ipAddress: ip,
      userAgent,
    });

    return NextResponse.json({
      success: true,
      message: `User @${currentTarget.username} berhasil diperbarui.`,
    });
  } catch (error: any) {
    console.error("API PUT /api/users/[id] error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Gagal memperbarui user" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await req.json().catch(() => ({}));
    const requester = body.requester || {};

    const existing = await client.execute({
      sql: "SELECT * FROM users WHERE id = ?",
      args: [id],
    });

    if (existing.rows.length === 0) {
      return NextResponse.json(
        { success: false, error: "User tidak ditemukan." },
        { status: 404 }
      );
    }

    const targetUser = existing.rows[0];

    // Prevent deleting root users
    if (targetUser.is_root || targetUser.username === "admin" || targetUser.username === "root") {
      return NextResponse.json(
        { success: false, error: "Akun Superadmin Root bawaan sistem tidak boleh dihapus demi keamanan." },
        { status: 403 }
      );
    }

    // Prevent deleting self
    if (requester.username && String(requester.username).toLowerCase() === String(targetUser.username).toLowerCase()) {
      return NextResponse.json(
        { success: false, error: "Anda tidak dapat menghapus akun Anda sendiri saat sedang login." },
        { status: 400 }
      );
    }

    await client.execute({
      sql: "DELETE FROM users WHERE id = ?",
      args: [id],
    });

    // Audit log
    const ip = req.headers.get("x-forwarded-for") || req.headers.get("x-real-ip") || "127.0.0.1";
    const userAgent = req.headers.get("user-agent") || "Browser";
    const requesterName = requester.name || requester.username || "Superadmin/Root";

    await insertAuditLog({
      userId: requester.id,
      username: requester.username || "admin",
      userName: requesterName,
      userRole: requester.role || "superadmin",
      action: "DELETE_USER",
      category: "USER_MANAGEMENT",
      details: `${requesterName} menghapus akun user: ${targetUser.name} (@${targetUser.username})`,
      ipAddress: ip,
      userAgent,
    });

    return NextResponse.json({
      success: true,
      message: `User @${targetUser.username} berhasil dihapus.`,
    });
  } catch (error: any) {
    console.error("API DELETE /api/users/[id] error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Gagal menghapus user" },
      { status: 500 }
    );
  }
}
