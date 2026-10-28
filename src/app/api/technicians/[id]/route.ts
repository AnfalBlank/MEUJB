import { NextResponse } from "next/server";
import { client } from "@/db";
import { Technician } from "@/types";

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body: Technician = await req.json();

    await client.execute({
      sql: "UPDATE technicians SET name = ?, phone = ?, role = ?, subdiv = ? WHERE id = ?",
      args: [body.name, body.phone, body.role, body.subdiv, id],
    });

    return NextResponse.json({ success: true, message: "Technician updated in Turso" });
  } catch (error: any) {
    console.error("API PUT /api/technicians/[id] error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed updating technician" },
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

    await client.execute({
      sql: "DELETE FROM technicians WHERE id = ?",
      args: [id],
    });

    return NextResponse.json({ success: true, message: "Technician deleted from Turso" });
  } catch (error: any) {
    console.error("API DELETE /api/technicians/[id] error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed deleting technician" },
      { status: 500 }
    );
  }
}
