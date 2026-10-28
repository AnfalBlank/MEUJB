import { NextResponse } from "next/server";
import { client, ensureTablesAndSeed } from "@/db";
import { WorkOrderJob, AssignedTech, WorkOrderPhoto } from "@/types";

export async function GET() {
  try {
    await ensureTablesAndSeed();

    // 1. Fetch work orders
    const jobsRes = await client.execute(`
      SELECT * FROM work_orders ORDER BY execution_date DESC, created_at DESC
    `);

    // 2. Fetch assignees
    const assigneesRes = await client.execute(`
      SELECT * FROM work_order_assignees
    `);

    // 3. Fetch spd
    const spdRes = await client.execute(`
      SELECT * FROM spd_expenses
    `);

    // 4. Fetch photos
    const photosRes = await client.execute(`
      SELECT * FROM work_order_photos
    `);

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
      const jobId = String(r.work_order_id);
      spdByJob[jobId] = {
        category: r.category as "SPD" | "Proyek",
        days: Number(r.days || 0),
        dailyRate: Number(r.daily_rate || 0),
        nights: Number(r.nights || 0),
        hotelRate: Number(r.hotel_rate || 0),
        totalSpd: Number(r.total_spd || 0),
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

    // Map into WorkOrderJob array
    const jobs: WorkOrderJob[] = jobsRes.rows.map((r: any) => {
      const id = String(r.id);
      const spdInfo = spdByJob[id] || {
        category: "SPD",
        days: 0,
        dailyRate: 0,
        nights: 0,
        hotelRate: 0,
      };

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
        spdType: spdInfo.category,
        spdDays: spdInfo.days,
        spdDaily: spdInfo.dailyRate,
        spdNights: spdInfo.nights,
        spdHotel: spdInfo.hotelRate,
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

    return NextResponse.json({ success: true, count: jobs.length, data: jobs });
  } catch (error: any) {
    console.error("API GET /api/jobs error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed fetching jobs from Turso" },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const body: WorkOrderJob = await req.json();

    const id = body.id || "job-" + Date.now();
    const now = new Date().toISOString();

    // 1. Insert work order
    await client.execute({
      sql: `
        INSERT INTO work_orders (
          id, doc_type, doc_number, marketing_name, customer_name, subdiv,
          description, target_duration, execution_date, start_date, target_date, status, status_note,
          actual_expense, ba_drive_url, ba_file_name, gdrive_folder_id, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `,
      args: [
        id,
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
        body.status || "Pending",
        body.statusNote || "",
        Number(body.kasbonUsed || 0),
        body.baLink || "",
        body.baFileName || "",
        body.gdriveFolderId || "",
        now,
        now,
      ],
    });

    // 2. Insert assignees
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

    // 3. Insert SPD
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

    // 4. Insert Photos
    if (body.photos && body.photos.length > 0) {
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

    return NextResponse.json({ success: true, id, message: "Job created successfully in Turso" });
  } catch (error: any) {
    console.error("API POST /api/jobs error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed creating job in Turso" },
      { status: 500 }
    );
  }
}
