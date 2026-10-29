import { createClient } from "@libsql/client";
import { drizzle } from "drizzle-orm/libsql";
import * as schema from "./schema";
import { INITIAL_JOBS, INITIAL_TECHNICIANS, MAIN_SUB_DIVISIONS } from "@/data/initialData";

const url = process.env.TURSO_DATABASE_URL || "libsql://internalmesystem-anfal.aws-ap-northeast-1.turso.io";
const authToken = process.env.TURSO_AUTH_TOKEN || "eyJhbGciOiJFZERTQSIsInR5cCI6IkpXVCJ9.eyJhIjoicnciLCJpYXQiOjE3OTMxNzI5MTQsImlkIjoiMDFhMTgxNmYtMjgwMS03OGM3LWIwMjgtNzgxYWMxNmM1NzgyIiwia2lkIjoieXlnVk1sWlY0R2p6ZXJ2YW1RYUNIUEhNT1R5VVFjWDZTNUZZUk9zVkU1cyIsInJpZCI6IjgyYzYwZmNiLWRmZjgtNGNkMS1hZDFhLWVkYWZiMGJmOWUzZiJ9.XV6b_KBY1kKTlXogIZux0Ad-yQ39I0x2jNU36zGLyGj09Igrm-rYk3Yxse-ObWMXuW1wEDLTAhSTiwO7CkcxDg";

export const client = createClient({
  url,
  authToken,
});

export const db = drizzle(client, { schema });

// Auto-migration & database table initialization
export async function ensureTablesAndSeed() {
  try {
    // 1. Create tables if not exist
    await client.execute(`
      CREATE TABLE IF NOT EXISTS divisions (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL UNIQUE,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP
      );
    `);

    await client.execute(`
      CREATE TABLE IF NOT EXISTS technicians (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        phone TEXT NOT NULL,
        role TEXT NOT NULL,
        subdiv TEXT NOT NULL,
        division_id TEXT,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP
      );
    `);

    await client.execute(`
      CREATE TABLE IF NOT EXISTS work_orders (
        id TEXT PRIMARY KEY,
        doc_type TEXT NOT NULL,
        doc_number TEXT NOT NULL UNIQUE,
        marketing_name TEXT NOT NULL,
        customer_name TEXT NOT NULL,
        subdiv TEXT NOT NULL,
        division_id TEXT,
        description TEXT NOT NULL,
        target_duration TEXT DEFAULT '3 Hari',
        execution_date TEXT NOT NULL,
        status TEXT NOT NULL DEFAULT 'Pending',
        status_note TEXT DEFAULT '',
        actual_expense INTEGER DEFAULT 0,
        remaining_fund INTEGER DEFAULT 0,
        gdrive_folder_id TEXT,
        ba_drive_file_id TEXT,
        ba_drive_url TEXT,
        ba_file_name TEXT,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP,
        updated_at TEXT DEFAULT CURRENT_TIMESTAMP
      );
    `);

    await client.execute(`
      CREATE TABLE IF NOT EXISTS work_order_assignees (
        id TEXT PRIMARY KEY,
        work_order_id TEXT NOT NULL,
        technician_id TEXT,
        name TEXT NOT NULL,
        subdiv TEXT NOT NULL,
        kasbon_amount INTEGER DEFAULT 0
      );
    `);

    await client.execute(`
      CREATE TABLE IF NOT EXISTS spd_expenses (
        id TEXT PRIMARY KEY,
        work_order_id TEXT NOT NULL,
        category TEXT NOT NULL,
        days INTEGER DEFAULT 0,
        daily_rate INTEGER DEFAULT 0,
        nights INTEGER DEFAULT 0,
        hotel_rate INTEGER DEFAULT 0,
        total_spd INTEGER DEFAULT 0
      );
    `);

    await client.execute(`
      CREATE TABLE IF NOT EXISTS work_order_photos (
        id TEXT PRIMARY KEY,
        work_order_id TEXT NOT NULL,
        file_name TEXT NOT NULL,
        drive_file_id TEXT,
        drive_view_url TEXT NOT NULL,
        caption TEXT,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // 1b. Create users table
    await client.execute(`
      CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        username TEXT NOT NULL UNIQUE,
        password TEXT NOT NULL,
        name TEXT NOT NULL,
        role TEXT NOT NULL,
        is_root INTEGER DEFAULT 0,
        last_login_at TEXT,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP,
        updated_at TEXT DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // 1c. Create audit_logs table
    await client.execute(`
      CREATE TABLE IF NOT EXISTS audit_logs (
        id TEXT PRIMARY KEY,
        user_id TEXT,
        username TEXT NOT NULL,
        user_name TEXT NOT NULL,
        user_role TEXT NOT NULL,
        action TEXT NOT NULL,
        category TEXT NOT NULL,
        details TEXT NOT NULL,
        ip_address TEXT,
        user_agent TEXT,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // 1d. Safely add start_date and target_date columns if not exists
    try {
      await client.execute("ALTER TABLE work_orders ADD COLUMN start_date TEXT");
    } catch {}
    try {
      await client.execute("ALTER TABLE work_orders ADD COLUMN target_date TEXT");
    } catch {}

    // 2. Seed initial divisions if empty
    const divCheck = await client.execute("SELECT count(*) as cnt FROM divisions");
    if (Number(divCheck.rows[0]?.cnt || 0) === 0) {
      for (const d of MAIN_SUB_DIVISIONS) {
        await client.execute({
          sql: "INSERT OR IGNORE INTO divisions (id, name) VALUES (?, ?)",
          args: ["div-" + d.shortName.toLowerCase().replace(/\s+/g, "-"), d.name]
        });
      }
    }

    // 3. Seed initial technicians if empty
    const techCheck = await client.execute("SELECT count(*) as cnt FROM technicians");
    if (Number(techCheck.rows[0]?.cnt || 0) === 0) {
      for (const t of INITIAL_TECHNICIANS) {
        await client.execute({
          sql: "INSERT OR IGNORE INTO technicians (id, name, phone, role, subdiv) VALUES (?, ?, ?, ?, ?)",
          args: [t.id, t.name, t.phone, t.role, t.subdiv]
        });
      }
    }

    // 4. Seed initial users if empty
    const userCheck = await client.execute("SELECT count(*) as cnt FROM users");
    if (Number(userCheck.rows[0]?.cnt || 0) === 0) {
      const now = new Date().toISOString();
      // Seed root superadmin (admin)
      await client.execute({
        sql: `INSERT OR IGNORE INTO users (id, username, password, name, role, is_root, created_at, updated_at)
              VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        args: ["usr-admin-root", "admin", "password", "Administrator Teknik", "superadmin", 1, now, now]
      });

      // Seed manager (prinof)
      await client.execute({
        sql: `INSERT OR IGNORE INTO users (id, username, password, name, role, is_root, created_at, updated_at)
              VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        args: ["usr-prinof", "prinof", "password", "Prinof", "manager", 0, now, now]
      });
    }

    // 5. Seed initial jobs if empty
    const jobCheck = await client.execute("SELECT count(*) as cnt FROM work_orders");
    if (Number(jobCheck.rows[0]?.cnt || 0) === 0) {
      for (const j of INITIAL_JOBS) {
        await client.execute({
          sql: `INSERT OR IGNORE INTO work_orders (
            id, doc_type, doc_number, marketing_name, customer_name, subdiv,
            description, target_duration, execution_date, start_date, target_date, status, status_note,
            actual_expense, ba_drive_url, ba_file_name, created_at, updated_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          args: [
            j.id, j.docType, j.docNumber, j.marketing, j.customer, j.subdiv,
            j.desc, j.target, j.date, j.startDate || j.date, j.targetDate || j.date, j.status, j.statusNote || "",
            j.kasbonUsed || 0, j.baLink || "", j.baFileName || "",
            j.createdAt || new Date().toISOString(), j.updatedAt || new Date().toISOString()
          ]
        });

        // Seed assignees
        for (const t of j.techs) {
          await client.execute({
            sql: "INSERT INTO work_order_assignees (id, work_order_id, technician_id, name, subdiv, kasbon_amount) VALUES (?, ?, ?, ?, ?, ?)",
            args: ["asg-" + Math.random().toString(36).substr(2, 9), j.id, t.technicianId || null, t.name, t.subdiv, t.kasbon || 0]
          });
        }

        // Seed SPD
        const totalSpd = j.spdType === "Proyek" ? 0 : (j.spdDays * j.spdDaily) + (j.spdNights * j.spdHotel);
        await client.execute({
          sql: "INSERT INTO spd_expenses (id, work_order_id, category, days, daily_rate, nights, hotel_rate, total_spd) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
          args: ["spd-" + Math.random().toString(36).substr(2, 9), j.id, j.spdType, j.spdDays || 0, j.spdDaily || 0, j.spdNights || 0, j.spdHotel || 0, totalSpd]
        });

        // Seed Photos
        for (const p of j.photos || []) {
          await client.execute({
            sql: "INSERT INTO work_order_photos (id, work_order_id, file_name, drive_view_url, caption, created_at) VALUES (?, ?, ?, ?, ?, ?)",
            args: [p.id, j.id, p.fileName, p.driveUrl, p.caption || "", p.uploadedAt || new Date().toISOString()]
          });
        }
      }
    }

    return { success: true };
  } catch (error) {
    console.error("Database initialization error:", error);
    return { success: false, error };
  }
}

// Audit logging helper
export async function insertAuditLog(log: {
  userId?: string;
  username: string;
  userName: string;
  userRole: string;
  action: string;
  category: string;
  details: string;
  ipAddress?: string;
  userAgent?: string;
}) {
  try {
    const id = "log-" + Date.now() + "-" + Math.random().toString(36).substring(2, 7);
    const now = new Date().toISOString();
    await client.execute({
      sql: `INSERT INTO audit_logs (id, user_id, username, user_name, user_role, action, category, details, ip_address, user_agent, created_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      args: [
        id,
        log.userId || null,
        log.username,
        log.userName,
        log.userRole,
        log.action,
        log.category,
        log.details,
        log.ipAddress || null,
        log.userAgent || null,
        now,
      ],
    });
    return { success: true, id };
  } catch (err) {
    console.error("Error inserting audit log:", err);
    return { success: false, error: err };
  }
}

