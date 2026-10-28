import { NextResponse } from "next/server";
import { client } from "@/db";
import { WorkOrderJob } from "@/types";

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body: WorkOrderJob = await req.json();
    const now = new Date().toISOString();

    // 1. Update work order
    await client.execute({
      sql: `
        UPDATE work_orders SET
          doc_type = ?,
          doc_number = ?,
          marketing_name = ?,
          customer_name = ?,
          subdiv = ?,
          description = ?,
          target_duration = ?,
          execution_date = ?,
          start_date = ?,
          target_date = ?,
          status = ?,
          status_note = ?,
          actual_expense = ?,
          ba_drive_url = ?,
          ba_file_name = ?,
          updated_at = ?
        WHERE id = ?
      `,
      args: [
        body.docType,
        body.docNumber,
        body.marketing || "Bagus Pratama",
        body.customer,
        body.subdiv,
        body.desc,
        body.target || "3 Hari",
        body.date,
        body.startDate || body.date,
        body.targetDate || body.date,
        body.status,
        body.statusNote || "",
        Number(body.kasbonUsed || 0),
        body.baLink || "",
        body.baFileName || "",
        now,
        id,
      ],
    });

    // 2. Refresh assignees
    await client.execute({
      sql: "DELETE FROM work_order_assignees WHERE work_order_id = ?",
      args: [id],
    });

    if (body.techs && body.techs.length > 0) {
      for (const t of body.techs) {
        await client.execute({
          sql: `
            INSERT INTO work_order_assignees (
              id, work_order_id, technician_id, name, subdiv, kasbon_amount
            ) VALUES (?, ?, ?, ?, ?, ?)
          `,
          args: [
            "asg-" + Math.random().toString(36).substr(2, 9),
            id,
            t.technicianId || null,
            t.name,
            t.subdiv,
            Number(t.kasbon || 0),
          ],
        });
      }
    }

    // 3. Refresh SPD
    await client.execute({
      sql: "DELETE FROM spd_expenses WHERE work_order_id = ?",
      args: [id],
    });

    const totalSpd =
      body.spdType === "Proyek"
        ? 0
        : Number(body.spdDays || 0) * Number(body.spdDaily || 0) +
          Number(body.spdNights || 0) * Number(body.spdHotel || 0);

    await client.execute({
      sql: `
        INSERT INTO spd_expenses (
          id, work_order_id, category, days, daily_rate, nights, hotel_rate, total_spd
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `,
      args: [
        "spd-" + Math.random().toString(36).substr(2, 9),
        id,
        body.spdType || "SPD",
        Number(body.spdDays || 0),
        Number(body.spdDaily || 0),
        Number(body.spdNights || 0),
        Number(body.spdHotel || 0),
        totalSpd,
      ],
    });

    // 4. Update photos if provided
    if (body.photos) {
      await client.execute({
        sql: "DELETE FROM work_order_photos WHERE work_order_id = ?",
        args: [id],
      });

      for (const p of body.photos) {
        await client.execute({
          sql: `
            INSERT INTO work_order_photos (
              id, work_order_id, file_name, drive_view_url, caption, created_at
            ) VALUES (?, ?, ?, ?, ?, ?)
          `,
          args: [
            p.id || "p_" + Date.now(),
            id,
            p.fileName,
            p.driveUrl,
            p.caption || "",
            p.uploadedAt || now,
          ],
        });
      }
    }

    return NextResponse.json({ success: true, message: "Job updated successfully in Turso" });
  } catch (error: any) {
    console.error("API PUT /api/jobs/[id] error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed updating job" },
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
      sql: "DELETE FROM work_order_photos WHERE work_order_id = ?",
      args: [id],
    });

    await client.execute({
      sql: "DELETE FROM spd_expenses WHERE work_order_id = ?",
      args: [id],
    });

    await client.execute({
      sql: "DELETE FROM work_order_assignees WHERE work_order_id = ?",
      args: [id],
    });

    await client.execute({
      sql: "DELETE FROM work_orders WHERE id = ?",
      args: [id],
    });

    return NextResponse.json({ success: true, message: "Job deleted successfully from Turso" });
  } catch (error: any) {
    console.error("API DELETE /api/jobs/[id] error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed deleting job" },
      { status: 500 }
    );
  }
}
