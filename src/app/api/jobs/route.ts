import { NextResponse } from "next/server";
import { client, insertAuditLog, ensureTablesAndSeed } from "@/db";
import { WorkOrderJob, AssignedTech, WorkOrderPhoto } from "@/types";
import { requireAuth } from "@/utils/apiMiddleware";

const VALID_STATUSES = ["Pending", "Done", "Hold", "Cancel"];
const VALID_DOC_TYPES = ["WO", "SPK"];
const VALID_SUBDIVS = [
  "Fueling System Engineering",
  "IT Engineering",
  "Electrical Engineering",
];

function validateJobBody(body: Partial<WorkOrderJob>): string | null {
  if (!body.docType || !VALID_DOC_TYPES.includes(body.docType))
    return "docType harus WO atau SPK.";
  if (!body.docNumber?.trim())
    return "Nomor dokumen wajib diisi.";
  if (!body.customer?.trim())
    return "Nama customer wajib diisi.";
  if (!body.subdiv || !VALID_SUBDIVS.includes(body.subdiv))
    return `Subdivisi tidak valid. Pilih: ${VALID_SUBDIVS.join(", ")}.`;
  if (!body.desc?.trim())
    return "Uraian pekerjaan wajib diisi.";
  if (!body.date?.match(/^\d{4}-\d{2}-\d{2}$/))
    return "Tanggal pelaksanaan tidak valid (format: YYYY-MM-DD).";
  if (body.status && !VALID_STATUSES.includes(body.status))
    return `Status tidak valid. Pilih: ${VALID_STATUSES.join(", ")}.`;
  if (body.kasbonUsed !== undefined && (isNaN(Number(body.kasbonUsed)) || Number(body.kasbonUsed) < 0))
    return "Nilai kasbon tidak valid.";
  return null;
}

export async function GET(req: Request) {
  // Auth check
  const auth = requireAuth(req);
  if (!auth.ok) return auth.response;

  try {
    await ensureTablesAndSeed();

    const url = new URL(req.url);
    const limit = Math.min(parseInt(url.searchParams.get("limit") || "100"), 200);
    const offset = Math.max(parseInt(url.searchParams.get("offset") || "0"), 0);
    const status = url.searchParams.get("status");
    const subdiv = url.searchParams.get("subdiv");
    const search = url.searchParams.get("search");

    // Build WHERE clause dynamically
    const conditions: string[] = [];
    const args: any[] = [];

    if (status && VALID_STATUSES.includes(status)) {
      conditions.push("w.status = ?");
      args.push(status);
    }
    if (subdiv && VALID_SUBDIVS.includes(subdiv)) {
      conditions.push("w.subdiv = ?");
      args.push(subdiv);
    }
    if (search?.trim()) {
      conditions.push("(w.doc_number LIKE ? OR w.customer_name LIKE ? OR w.description LIKE ?)");
      const q = `%${search.trim()}%`;
      args.push(q, q, q);
    }

    const where = conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";

    // Count total for pagination metadata
    const countRes = await client.execute({
      sql: `SELECT COUNT(*) as total FROM work_orders w ${where}`,
      args,
    });
    const total = Number(countRes.rows[0]?.total || 0);

    // Fetch paginated work orders
    const jobsRes = await client.execute({
      sql: `SELECT w.* FROM work_orders w ${where} ORDER BY w.execution_date DESC, w.created_at DESC LIMIT ? OFFSET ?`,
      args: [...args, limit, offset],
    });

    // Fetch related data for returned jobs only
    const jobIds = jobsRes.rows.map((r: any) => String(r.id));

    if (jobIds.length === 0) {
      return NextResponse.json({
        success: true,
        count: 0,
        total,
        limit,
        offset,
        data: [],
      });
    }

    const placeholders = jobIds.map(() => "?").join(",");

    const [assigneesRes, spdRes, photosRes] = await Promise.all([
      client.execute({ sql: `SELECT * FROM work_order_assignees WHERE work_order_id IN (${placeholders})`, args: jobIds }),
      client.execute({ sql: `SELECT * FROM spd_expenses WHERE work_order_id IN (${placeholders})`, args: jobIds }),
      client.execute({ sql: `SELECT * FROM work_order_photos WHERE work_order_id IN (${placeholders})`, args: jobIds }),
    ]);

    // Group relations
    const assigneesByJob: Record<string, AssignedTech[]> = {};
    assigneesRes.rows.forEach((r: any) => {
      const jobId = String(r.work_order_id);
      if (!assigneesByJob[jobId]) assigneesByJob[jobId] = [];
      assigneesByJob[jobId].push({
        technicianId: r.technician_id ? String(r.technician_id) : undefined,
        name: String(r.name),
        subdiv: String(r.subdiv),
        kasbon: Number(r.kasbon_amount || 0),
      });
    });

    const spdByJob: Record<string, any> = {};
    spdRes.rows.forEach((r: any) => {
      spdByJob[String(r.work_order_id)] = {
        category: r.category as "SPD" | "Proyek",
        days: Number(r.days || 0),
        dailyRate: Number(r.daily_rate || 0),
        nights: Number(r.nights || 0),
        hotelRate: Number(r.hotel_rate || 0),
      };
    });

    const photosByJob: Record<string, WorkOrderPhoto[]> = {};
    photosRes.rows.forEach((r: any) => {
      const jobId = String(r.work_order_id);
      if (!photosByJob[jobId]) photosByJob[jobId] = [];
      photosByJob[jobId].push({
        id: String(r.id),
        fileName: String(r.file_name),
        driveUrl: String(r.drive_view_url),
        caption: r.caption ? String(r.caption) : undefined,
        uploadedAt: String(r.created_at || ""),
      });
    });

    const jobs: WorkOrderJob[] = jobsRes.rows.map((r: any) => {
      const id = String(r.id);
      const spd = spdByJob[id] || { category: "SPD", days: 0, dailyRate: 0, nights: 0, hotelRate: 0 };
      return {
        id,
        docType: r.doc_type as "WO" | "SPK",
        docNumber: String(r.doc_number),
        marketing: String(r.marketing_name || "-"),
        subdiv: r.subdiv as any,
        customer: String(r.customer_name),
        desc: String(r.description),
        target: String(r.target_duration || "3 Hari"),
        date: String(r.execution_date),
        startDate: r.start_date ? String(r.start_date) : String(r.execution_date),
        targetDate: r.target_date ? String(r.target_date) : String(r.execution_date),
        techs: assigneesByJob[id] || [],
        spdType: spd.category,
        spdDays: spd.days,
        spdDaily: spd.dailyRate,
        spdNights: spd.nights,
        spdHotel: spd.hotelRate,
        baLink: r.ba_drive_url ? String(r.ba_drive_url) : "",
        baFileName: r.ba_file_name ? String(r.ba_file_name) : "",
        photos: photosByJob[id] || [],
        kasbonUsed: Number(r.actual_expense || 0),
        status: r.status as any,
        statusNote: r.status_note ? String(r.status_note) : "",
        gdriveFolderId: r.gdrive_folder_id ? String(r.gdrive_folder_id) : undefined,
        createdAt: String(r.created_at),
        updatedAt: String(r.updated_at),
      };
    });

    return NextResponse.json({
      success: true,
      count: jobs.length,
      total,
      limit,
      offset,
      hasMore: offset + jobs.length < total,
      data: jobs,
    });
  } catch (error: any) {
    console.error("API GET /api/jobs error:", error);
    insertAuditLog({
      username: "system",
      userName: "System",
      userRole: "system",
      action: "SYSTEM_ERROR",
      category: "SYSTEM",
      details: `API GET /api/jobs error: ${error?.message || String(error)}`,
    }).catch(() => {});
    
    return NextResponse.json(
      { success: false, error: error.message || "Failed fetching jobs" },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  // Auth check - semua user terautentikasi boleh buat job
  const auth = requireAuth(req);
  if (!auth.ok) return auth.response;

  try {
    const body: WorkOrderJob = await req.json();

    // Validasi input
    const validationError = validateJobBody(body);
    if (validationError) {
      return NextResponse.json({ success: false, error: validationError }, { status: 400 });
    }

    const id = body.id || "job-" + Date.now();
    const now = new Date().toISOString();

    // Cek duplikat docNumber
    const dupCheck = await client.execute({
      sql: "SELECT id FROM work_orders WHERE doc_number = ?",
      args: [body.docNumber.trim()],
    });
    if (dupCheck.rows.length > 0) {
      return NextResponse.json(
        { success: false, error: `Nomor dokumen "${body.docNumber}" sudah ada. Gunakan nomor yang berbeda.` },
        { status: 409 }
      );
    }

    await client.execute({
      sql: `INSERT INTO work_orders (
        id, doc_type, doc_number, marketing_name, customer_name, subdiv,
        description, target_duration, execution_date, start_date, target_date,
        status, status_note, actual_expense, ba_drive_url, ba_file_name,
        gdrive_folder_id, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      args: [
        id, body.docType, body.docNumber.trim(), body.marketing || "",
        body.customer.trim(), body.subdiv, body.desc.trim(),
        body.target || "3 Hari", body.date,
        body.startDate || body.date, body.targetDate || body.date,
        body.status || "Pending", body.statusNote || "",
        Number(body.kasbonUsed || 0), body.baLink || "",
        body.baFileName || "", body.gdriveFolderId || "", now, now,
      ],
    });

    // Insert assignees
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

    // Insert SPD
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

    // Insert photos
    if (body.photos?.length > 0) {
      for (const p of body.photos) {
        await client.execute({
          sql: `INSERT INTO work_order_photos (id, work_order_id, file_name, drive_view_url, caption, created_at)
                VALUES (?, ?, ?, ?, ?, ?)`,
          args: [p.id || "p_" + Date.now(), id, p.fileName, p.driveUrl, p.caption || "", p.uploadedAt || now],
        });
      }
    }

    return NextResponse.json({ success: true, id, message: "Job created successfully" });
  } catch (error: any) {
    console.error("API POST /api/jobs error:", error);
    insertAuditLog({
      username: "system",
      userName: "System",
      userRole: "system",
      action: "SYSTEM_ERROR",
      category: "SYSTEM",
      details: `API POST /api/jobs error: ${error?.message || String(error)}`,
    }).catch(() => {});
    
    return NextResponse.json(
      { success: false, error: error.message || "Failed creating job" },
      { status: 500 }
    );
  }
}
