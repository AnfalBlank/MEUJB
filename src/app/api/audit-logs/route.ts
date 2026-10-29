import { NextResponse } from "next/server";
import { client, ensureTablesAndSeed, insertAuditLog } from "@/db";
import { AuditLogItem } from "@/types";

export async function GET(req: Request) {
  try {
    await ensureTablesAndSeed();
    const { searchParams } = new URL(req.url);
    const limit = Math.min(Number(searchParams.get("limit") || 250), 500);
    const category = searchParams.get("category");
    const search = searchParams.get("search");
    const from = searchParams.get("from");
    const to = searchParams.get("to");
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");
    const startTime = searchParams.get("startTime") || "00:00";
    const endTime = searchParams.get("endTime") || "23:59:59";

    let sql = `SELECT * FROM audit_logs WHERE 1=1`;
    const args: any[] = [];

    if (category && category !== "ALL") {
      sql += ` AND category = ?`;
      args.push(category);
    }

    if (search && search.trim()) {
      const term = `%${search.trim().toLowerCase()}%`;
      sql += ` AND (LOWER(username) LIKE ? OR LOWER(user_name) LIKE ? OR LOWER(action) LIKE ? OR LOWER(details) LIKE ?)`;
      args.push(term, term, term, term);
    }

    // Filter by Date and Time
    if (from) {
      sql += ` AND created_at >= ?`;
      args.push(from);
    } else if (startDate) {
      sql += ` AND created_at >= ?`;
      args.push(`${startDate}T${startTime}:00`);
    }

    if (to) {
      sql += ` AND created_at <= ?`;
      args.push(to);
    } else if (endDate) {
      sql += ` AND created_at <= ?`;
      args.push(`${endDate}T${endTime}`);
    }

    sql += ` ORDER BY created_at DESC LIMIT ?`;
    args.push(limit);

    const res = await client.execute({ sql, args });

    const logs: AuditLogItem[] = res.rows.map((r: any) => ({
      id: String(r.id),
      userId: r.user_id ? String(r.user_id) : undefined,
      username: String(r.username),
      userName: String(r.user_name),
      userRole: String(r.user_role),
      action: String(r.action),
      category: String(r.category),
      details: String(r.details),
      ipAddress: r.ip_address ? String(r.ip_address) : undefined,
      userAgent: r.user_agent ? String(r.user_agent) : undefined,
      createdAt: String(r.created_at),
    }));

    return NextResponse.json({ success: true, count: logs.length, data: logs });
  } catch (error: any) {
    console.error("API GET /api/audit-logs error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Gagal mengambil audit logs" },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    await ensureTablesAndSeed();
    const body = await req.json();

    const username = String(body.username || "system");
    const userName = String(body.userName || body.name || username);
    const userRole = String(body.userRole || body.role || "user");
    const action = String(body.action || "ACTIVITY");
    const category = String(body.category || "SYSTEM");
    const details = String(body.details || "Aktivitas tercatat");

    const ip = req.headers.get("x-forwarded-for") || req.headers.get("x-real-ip") || "127.0.0.1";
    const userAgent = req.headers.get("user-agent") || "Browser";

    const result = await insertAuditLog({
      userId: body.userId,
      username,
      userName,
      userRole,
      action,
      category,
      details,
      ipAddress: ip,
      userAgent,
    });

    return NextResponse.json(result);
  } catch (error: any) {
    console.error("API POST /api/audit-logs error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Gagal menyimpan audit log" },
      { status: 500 }
    );
  }
}
