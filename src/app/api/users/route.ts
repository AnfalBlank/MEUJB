import { NextResponse } from "next/server";
import { client, ensureTablesAndSeed, insertAuditLog } from "@/db";
import { UserRole } from "@/types";

const ALLOWED_ROLES: UserRole[] = ["superadmin", "admin", "manager"];

export async function GET() {
  try {
    await ensureTablesAndSeed();
    const res = await client.execute(`
      SELECT id, username, name, role, is_root, last_login_at, created_at, updated_at
      FROM users
      ORDER BY created_at ASC
    `);

    const users = res.rows.map((r: any) => ({
      id: String(r.id),
      username: String(r.username),
      name: String(r.name),
      role: String(r.role).toLowerCase() as UserRole,
      isRoot: Boolean(r.is_root) || r.username === "admin" || r.username === "root",
      lastLoginAt: r.last_login_at ? String(r.last_login_at) : undefined,
      createdAt: r.created_at ? String(r.created_at) : undefined,
      updatedAt: r.updated_at ? String(r.updated_at) : undefined,
    }));

    return NextResponse.json({ success: true, count: users.length, data: users });
  } catch (error: any) {
    console.error("API GET /api/users error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Gagal mengambil daftar pengguna" },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    await ensureTablesAndSeed();
    const body = await req.json();

    const username = String(body.username || "").trim().toLowerCase();
    const name = String(body.name || "").trim();
    const password = String(body.password || "").trim();
    const role = String(body.role || "").trim().toLowerCase() as UserRole;
    const requester = body.requester || {};

    if (!username || !name || !password) {
      return NextResponse.json(
        { success: false, error: "Username, Nama Lengkap, dan Kata Sandi wajib diisi." },
        { status: 400 }
      );
    }

    // Role validation: ONLY 3 roles allowed
    if (!ALLOWED_ROLES.includes(role)) {
      return NextResponse.json(
        { success: false, error: `Role tidak valid. Role yang diizinkan hanya: superadmin, admin, manager.` },
        { status: 400 }
      );
    }

    if (username.length < 3) {
      return NextResponse.json(
        { success: false, error: "Username minimal 3 karakter." },
        { status: 400 }
      );
    }

    if (!/^[a-zA-Z0-9_.-]+$/.test(username)) {
      return NextResponse.json(
        { success: false, error: "Username hanya boleh huruf, angka, underscore (_), atau titik (.)." },
        { status: 400 }
      );
    }

    if (password.length < 5) {
      return NextResponse.json(
        { success: false, error: "Kata sandi minimal 5 karakter." },
        { status: 400 }
      );
    }

    // Check username collision
    const existing = await client.execute({
      sql: "SELECT id FROM users WHERE LOWER(username) = ?",
      args: [username],
    });

    if (existing.rows.length > 0) {
      return NextResponse.json(
        { success: false, error: `Username "${username}" sudah digunakan. Silakan pilih username lain.` },
        { status: 409 }
      );
    }

    const id = "usr-" + Date.now() + "-" + Math.random().toString(36).substring(2, 6);
    const now = new Date().toISOString();
    const isRoot = username === "root" || username === "admin" ? 1 : 0;

    await client.execute({
      sql: `INSERT INTO users (id, username, password, name, role, is_root, created_at, updated_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      args: [id, username, password, name, role, isRoot, now, now],
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
      action: "CREATE_USER",
      category: "USER_MANAGEMENT",
      details: `${requesterName} membuat user baru: ${name} (@${username}) dengan role [${role}]`,
      ipAddress: ip,
      userAgent,
    });

    return NextResponse.json({
      success: true,
      message: `User "${name}" (@${username}) berhasil ditambahkan.`,
      user: {
        id,
        username,
        name,
        role,
        isRoot: Boolean(isRoot),
        createdAt: now,
      },
    });
  } catch (error: any) {
    console.error("API POST /api/users error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Gagal membuat user" },
      { status: 500 }
    );
  }
}
