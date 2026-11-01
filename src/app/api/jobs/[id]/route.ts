import { NextResponse } from "next/server";
import { client } from "@/db";
import { WorkOrderJob } from "@/types";
import { requireAuth, requireAdmin } from "@/utils/apiMiddleware";

const VALID_STATUSES = ["Pending", "Done", "Hold", "Cancel"];
const VALID_DOC_TYPES = ["WO", "SPK"];
const VALID_SUBDIVS = [
  "Fueling System Engineering",
  "IT Engineering",
  "Electrical Engineering",
];

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  // Auth: semua user login boleh update job
  const auth = requireAuth(req);
  if (!auth.ok) return auth.response;

  try {
    const { id } = await params;
    const body: WorkOrderJob = await req.json();
    const now = new Date().toISOString();

    // Validasi input
    if (!body.docType || !VALID_DOC_TYPES.includes(body.docType))
      return NextResponse.json({ success: false, error: "docType harus WO atau SPK." }, { status: 400 });
    if (!body.docNumber?.trim())
      return NextResponse.json({ success: false, error: "Nomor dokumen wajib diisi." }, { status: 400 });
    if (!body.customer?.trim())
      return NextResponse.json({ success: false, error: "Nama customer wajib diisi." }, { status: 400 });
    if (!body.subdiv || !VALID_SUBDIVS.includes(body.subdiv))
      return NextResponse.json({ success: false, error: "Subdivisi tidak valid." }, { status: 400 });
    if (!body.date?.match(/^\d{4}-\d{2}-\d{2}$/))
      return NextResponse.json({ success: false, error: "Format tanggal tidak valid (YYYY-MM-DD)." }, { status: 400 });
    if (body.status && !VALID_STATUSES.includes(body.status))
      return NextResponse.json({ success: false, error: "Status tidak valid." }, { status: 400 });

    // Cek job ada
    const existing = await client.execute({
      sql: "SELECT id FROM work_orders WHERE id = ?",
      args: [id],
    });
    if (existing.rows.length === 0) {
      return NextResponse.json({ success: false, error: "Job tidak ditemukan." }, { status: 404 });
    }

    // Cek duplikat docNumber (kecuali milik diri sendiri)
    const dupCheck = await client.execute({
      sql: "SELECT id FROM work_orders WHERE doc_number = ? AND id != ?",
      args: [body.docNumber.trim(), id],
    });
    if (dupCheck.rows.length > 0) {
      return NextResponse.json(
        { success: false, error: `Nomor dokumen "${body.docNumber}" sudah digunakan oleh dokumen lain.` },
        { status: 409 }
      );
    }

    // 1. Update work order
    await client.execute({
      sql: `UPDATE work_orders SET
        doc_type = ?, doc_number = ?, marketing_name = ?, customer_name = ?,
        subdiv = ?, description = ?, target_duration = ?, execution_date = ?,
        start_date = ?, target_date = ?, status = ?, status_note = ?,
        actual_expense = ?, ba_drive_url = ?, ba_file_name = ?, updated_at = ?
        WHERE id = ?`,
      args: [
        body.docType, body.docNumber.trim(), body.marketing || "",
        body.customer.trim(), body.subdiv, body.desc?.trim() || "",
        body.target || "3 Hari", body.date,
        body.startDate || body.date, body.targetDate || body.date,
        body.status || "Pending", body.statusNote || "",
        Number(body.kasbonUsed || 0), body.baLink || "",
        body.baFileName || "", now, id,
      ],
    });

    // 2. Refresh assignees: DELETE lama → INSERT baru (fix duplikat)
    await client.execute({
      sql: "DELETE FROM work_order_assignees WHERE work_order_id = ?",
      args: [id],
    });
    if (body.techs?.length > 0) {
      for (const t of body.techs) {
        await client.execute({
          sql: `INSERT INTO work_order_assignees (id, work_order_id, technician_id, name, subdiv, kasbon_amount)
                VALUES (?, ?, ?, ?, ?, ?)`,
          args: [
            "asg-" + Math.random().toString(36).substr(2, 9),
            id, t.technicianId || null, t.name, t.subdiv, Number(t.kasbon || 0),
          ],
        });
      }
    }

    // 3. Refresh SPD: DELETE lama → INSERT baru (fix duplikat)
    await client.execute({
      sql: "DELETE FROM spd_expenses WHERE work_order_id = ?",
      args: [id],
    });
    const totalSpd =
      body.spdType === "Proyek" ? 0 :
      Number(body.spdDays || 0) * Number(body.spdDaily || 0) +
      Number(body.spdNights || 0) * Number(body.spdHotel || 0);

    await client.execute({
      sql: `INSERT INTO spd_expenses (id, work_order_id, category, days, daily_rate, nights, hotel_rate, total_spd)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      args: [
        "spd-" + Math.random().toString(36).substr(2, 9),
        id, body.spdType || "SPD",
        Number(body.spdDays || 0), Number(body.spdDaily || 0),
        Number(body.spdNights || 0), Number(body.spdHotel || 0), totalSpd,
      ],
    });

    // 4. Refresh photos jika disertakan
    if (body.photos !== undefined) {
      await client.execute({
        sql: "DELETE FROM work_order_photos WHERE work_order_id = ?",
        args: [id],
      });
      for (const p of body.photos) {
        await client.execute({
          sql: `INSERT INTO work_order_photos (id, work_order_id, file_name, drive_view_url, caption, created_at)
                VALUES (?, ?, ?, ?, ?, ?)`,
          args: [p.id || "p_" + Date.now(), id, p.fileName, p.driveUrl, p.caption || "", p.uploadedAt || now],
        });
      }
    }

    return NextResponse.json({ success: true, message: "Job updated successfully" });
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
  // Hanya admin/superadmin yang boleh hapus job
  const auth = requireAdmin(req);
  if (!auth.ok) return auth.response;

  try {
    const { id } = await params;

    await client.execute({ sql: "DELETE FROM work_order_photos WHERE work_order_id = ?", args: [id] });
    await client.execute({ sql: "DELETE FROM spd_expenses WHERE work_order_id = ?", args: [id] });
    await client.execute({ sql: "DELETE FROM work_order_assignees WHERE work_order_id = ?", args: [id] });
    await client.execute({ sql: "DELETE FROM work_orders WHERE id = ?", args: [id] });

    return NextResponse.json({ success: true, message: "Job deleted successfully" });
  } catch (error: any) {
    console.error("API DELETE /api/jobs/[id] error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed deleting job" },
      { status: 500 }
    );
  }
}
