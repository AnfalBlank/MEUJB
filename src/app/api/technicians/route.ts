import { NextResponse } from "next/server";
import { client, ensureTablesAndSeed } from "@/db";
import { Technician } from "@/types";

export async function GET() {
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
    return NextResponse.json(
      { success: false, error: error.message || "Failed fetching technicians" },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
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
    return NextResponse.json(
      { success: false, error: error.message || "Failed creating technician" },
      { status: 500 }
    );
  }
}
