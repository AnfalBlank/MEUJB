import { sqliteTable, text, integer } from "drizzle-orm/sqlite-core";
import { sql } from "drizzle-orm";

export const divisions = sqliteTable("divisions", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  name: text("name").notNull().unique(), // Fueling System Engineering, IT Engineering, Electrical Engineering
  createdAt: text("created_at").default(sql`CURRENT_TIMESTAMP`),
});

export const technicians = sqliteTable("technicians", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  name: text("name").notNull(),
  phone: text("phone").notNull(),
  role: text("role").notNull(), // Teknisi, Supervisor, Drafter, Manager, Marketing
  subdiv: text("subdiv").notNull(),
  divisionId: text("division_id"),
  createdAt: text("created_at").default(sql`CURRENT_TIMESTAMP`),
});

export const workOrders = sqliteTable("work_orders", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  docType: text("doc_type").notNull(), // WO | SPK
  docNumber: text("doc_number").notNull().unique(), // e.g. WO-EXT-2026-089
  marketingName: text("marketing_name").notNull(),
  customerName: text("customer_name").notNull(),
  subdiv: text("subdiv").notNull(),
  divisionId: text("division_id"),
  description: text("description").notNull(),
  targetDuration: text("target_duration").default("3 Hari"),
  executionDate: text("execution_date").notNull(), // YYYY-MM-DD
  startDate: text("start_date"), // YYYY-MM-DD
  targetDate: text("target_date"), // YYYY-MM-DD
  status: text("status").notNull().default("Pending"), // Done, Pending, Hold, Cancel
  statusNote: text("status_note").default(""),
  
  // Keuangan Lapangan
  actualExpense: integer("actual_expense").default(0),
  remainingFund: integer("remaining_fund").default(0),

  // Drive Metadata
  gdriveFolderId: text("gdrive_folder_id"),
  baDriveFileId: text("ba_drive_file_id"),
  baDriveUrl: text("ba_drive_url"),
  baFileName: text("ba_file_name"),

  createdAt: text("created_at").default(sql`CURRENT_TIMESTAMP`),
  updatedAt: text("updated_at").default(sql`CURRENT_TIMESTAMP`),
});

export const workOrderAssignees = sqliteTable("work_order_assignees", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  workOrderId: text("work_order_id").notNull(),
  technicianId: text("technician_id"),
  name: text("name").notNull(),
  subdiv: text("subdiv").notNull(),
  kasbonAmount: integer("kasbon_amount").default(0),
});

export const spdExpenses = sqliteTable("spd_expenses", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  workOrderId: text("work_order_id").notNull(),
  category: text("category").notNull(), // SPD | Proyek
  days: integer("days").default(0),
  dailyRate: integer("daily_rate").default(0),
  nights: integer("nights").default(0),
  hotelRate: integer("hotel_rate").default(0),
  totalSpd: integer("total_spd").default(0),
});

export const workOrderPhotos = sqliteTable("work_order_photos", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  workOrderId: text("work_order_id").notNull(),
  fileName: text("file_name").notNull(),
  driveFileId: text("drive_file_id"),
  driveViewUrl: text("drive_view_url").notNull(),
  caption: text("caption"),
  createdAt: text("created_at").default(sql`CURRENT_TIMESTAMP`),
});
