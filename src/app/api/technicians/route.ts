import { NextResponse } from "next/server";
import { requireAuth } from "@/utils/apiMiddleware";
import { client, insertAuditLog, ensureTablesAndSeed } from "@/db";
import { Technician } from "@/types";

export async function GET(req: Request) {
  const auth = requireAuth(req);
  if (!auth.ok) return auth.response;
  try {
    await ensureTablesAndSeed();

    const res = await client.execute("SELECT * FROM technicians ORDER BY name ASC");
    const technicians: Technician[] = res.rows.map((r: any) => ({
      id: String(r.id),
      name: String(r.name),
      phone: String(r.phone),
      role: r.role as any,
      subdiv: String(r.subdiv),
    }));

    return NextResponse.json({ success: true, count: technicians.length, data: technicians });
  } catch (error: any) {
    console.error("API GET /api/technicians error:", error);
    insertAuditLog({
      username: "system",
      userName: "System",
      userRole: "system",
      action: "SYSTEM_ERROR",
      category: "SYSTEM",
      details: `API GET /api/technicians error: ${error?.message || String(error)}`,
    }).catch(() => {});
    
    return NextResponse.json(
      { success: false, error: error.message || "Failed fetching technicians" },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  const auth = requireAuth(req);
  if (!auth.ok) return auth.response;
  try {
    const body: Technician = await req.json();
    const id = body.id || "tech-" + Date.now();

    await client.execute({
      sql: "INSERT INTO technicians (id, name, phone, role, subdiv) VALUES (?, ?, ?, ?, ?)",
      args: [id, body.name, body.phone, body.role, body.subdiv],
    });

    return NextResponse.json({ success: true, id, message: "Technician created in Turso" });
  } catch (error: any) {
    console.error("API POST /api/technicians error:", error);
    insertAuditLog({
      username: "system",
      userName: "System",
      userRole: "system",
      action: "SYSTEM_ERROR",
      category: "SYSTEM",
      details: `API POST /api/technicians error: ${error?.message || String(error)}`,
    }).catch(() => {});
    
    return NextResponse.json(
      { success: false, error: error.message || "Failed creating technician" },
      { status: 500 }
    );
  }
}
