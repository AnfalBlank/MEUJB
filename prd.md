# Product Requirement Document (PRD)

**Nama Produk:** Sistem Monitoring Operasional Teknik (WO/SPK Tracker & Cloud Drive Management)

**Platform:** Web Application Internal (Next.js App Router)

**Database:** Turso (LibSQL/SQLite via Drizzle ORM)

**File Storage:** Google Drive API v3 (Google Cloud Service Account)

---

### 1. Tujuan & Latar Belakang

Sistem ini menggantikan pencatatan operasional lokal (*LocalStorage* / spreadsheet) menjadi platform terpusat berbasis web. Tujuannya adalah memonitor alur kerja Work Order (WO) dan Surat Perintah Kerja (SPK) di tiga sub-divisi teknik (*Fueling System Engineering*, *IT Engineering*, dan *Electrical Engineering*), mengotomatisasi perhitungan kasbon dan SPD, serta mengorganisasi seluruh arsip Berita Acara (BA) dan dokumentasi foto lapangan langsung ke Google Drive perusahaan secara terstruktur.

---

### 2. Arsitektur Sistem & Tech Stack

* **Framework:** Next.js (App Router, Server Actions, Route Handlers)
* **Bahasa & Styling:** TypeScript, Tailwind CSS, Lucide React, Shadcn/UI
* **Database & ORM:** Turso (LibSQL Edge Database) + Drizzle ORM
* **Runtime:** Node.js / Bun
* **Cloud Storage & API:** Google Drive API v3 (`googleapis`) menggunakan Service Account bersertifikat JSON
* **Autentikasi Internal:** Sesi berbasis role atau PIN/Password internal admin

---

### 3. Arsitektur Folder & Alur Upload Google Drive

Aplikasi tidak menyimpan file di server lokal atau database. File langsung diteruskan ke Google Drive melalui Next.js API/Server Action.

**Struktur Hirarki Folder di Google Drive:**

```text
Root: [GDRIVE_ROOT_FOLDER_ID] (e.g., "OPERASIONAL TEKNIK")
└── {Tahun}/ (e.g., 2026)
    └── {Nama Sub-Divisi}/ (e.g., Fueling System Engineering)
        └── [{Jenis}-{Nomor Dokumen}] {Nama Customer}/
            ├── Berita_Acara/
            │   └── BA_{Nomor_Dokumen}.pdf
            └── Foto_Dokumentasi/
                ├── FOTO_01_{Timestamp}.jpg
                └── FOTO_02_{Timestamp}.png

```

**Mekanisme Upload File:**

1. Pengguna memilih file Berita Acara (PDF) dan foto-foto lapangan (JPG/PNG/WEBP) di Tab Input/Edit.
2. Form dikirim via `multipart/form-data` ke Server Action atau Route Handler Next.js.
3. Server Action menginisialisasi Google Drive API Client:
* Mencari/membuat folder Tahun $\rightarrow$ Sub-Divisi $\rightarrow$ Folder Proyek `[Nomor Dokumen] Nama Customer`.
* Mengunggah file ke sub-folder terkait menggunakan stream buffer.
* Mengatur izin file (*permission*) agar dapat dilihat (*view-only*) oleh pengguna internal.


4. Google Drive mengembalikan `fileId`, `webViewLink`, dan `webContentLink`.
5. URL dan ID file tersebut disimpan ke tabel database Turso.

---

### 4. Skema Database Turso (Drizzle ORM)

```typescript
// schema.ts
import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core';
import { sql } from 'drizzle-orm';

export const divisions = sqliteTable('divisions', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  name: text('name').notNull().unique(), // Fueling System, IT, Electrical
  createdAt: text('created_at').default(sql`CURRENT_TIMESTAMP`),
});

export const technicians = sqliteTable('technicians', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  name: text('name').notNull(),
  phone: text('phone').notNull(),
  role: text('role').notNull(), // Teknisi, Supervisor, Drafter, Manager
  divisionId: text('division_id').references(() => divisions.id, { onDelete: 'cascade' }),
  createdAt: text('created_at').default(sql`CURRENT_TIMESTAMP`),
});

export const workOrders = sqliteTable('work_orders', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  docType: text('doc_type').notNull(), // WO | SPK
  docNumber: text('doc_number').notNull().unique(), // e.g. WO-EXT-2026-089
  marketingName: text('marketing_name').notNull(),
  customerName: text('customer_name').notNull(),
  divisionId: text('division_id').notNull().references(() => divisions.id),
  description: text('description').notNull(),
  executionDate: text('execution_date').notNull(), // YYYY-MM-DD
  status: text('status').notNull().default('Pending'), // Done, Pending, Hold, Cancel
  
  // Keuangan Lapangan
  actualExpense: integer('actual_expense').default(0),
  remainingFund: integer('remaining_fund').default(0),

  // Drive Metadata
  gdriveFolderId: text('gdrive_folder_id'),
  baDriveFileId: text('ba_drive_file_id'),
  baDriveUrl: text('ba_drive_url'),

  createdAt: text('created_at').default(sql`CURRENT_TIMESTAMP`),
  updatedAt: text('updated_at').default(sql`CURRENT_TIMESTAMP`),
});

export const workOrderAssignees = sqliteTable('work_order_assignees', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  workOrderId: text('work_order_id').notNull().references(() => workOrders.id, { onDelete: 'cascade' }),
  technicianId: text('technician_id').notNull().references(() => technicians.id, { onDelete: 'cascade' }),
  kasbonAmount: integer('kasbon_amount').default(0),
});

export const spdExpenses = sqliteTable('spd_expenses', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  workOrderId: text('work_order_id').notNull().references(() => workOrders.id, { onDelete: 'cascade' }),
  category: text('category').notNull(), // SPD | Proyek
  days: integer('days').default(0),
  dailyRate: integer('daily_rate').default(0),
  nights: integer('nights').default(0),
  hotelRate: integer('hotel_rate').default(0),
  totalSpd: integer('total_spd').default(0),
});

export const workOrderPhotos = sqliteTable('work_order_photos', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  workOrderId: text('work_order_id').notNull().references(() => workOrders.id, { onDelete: 'cascade' }),
  fileName: text('file_name').notNull(),
  driveFileId: text('drive_file_id').notNull(),
  driveViewUrl: text('drive_view_url').notNull(),
  createdAt: text('created_at').default(sql`CURRENT_TIMESTAMP`),
});

```

---

### 5. Detail Spesifikasi Modul

**TAB 1: Dashboard Utama**

* **Filter Multi-Dimensi:** Dropdown Bulan, Tahun, Nama Marketing, Jenis Dokumen (WO/SPK), dan Sub-Divisi. Dilengkapi tombol **Reset Filter** yang mengembalikan state ke default dalam satu klik.
* **Widget Bulat 3 Sub-Divisi:**
* Menampilkan 3 kartu divisi (*Fueling System*, *IT*, *Electrical*).
* Menampilkan badge jumlah pekerjaan aktif.
* Interaksi: Klik membuka modal berisi daftar pekerjaan divisi tersebut untuk edit status cepat (*Pending* $\rightarrow$ *Done*), edit data, atau hapus.


* **Matriks Performa Operasional:** Menampilkan jumlah personil aktif, total WO, total SPK, serta persentase sebaran status pekerjaan (*Done*, *Pending*, *Hold*, *Cancel*).
* **Tabel Monitoring Pekerjaan:**
* Kolom terpisah: No Dokumen, Tanggal, Customer, Marketing, Sub-Divisi, Status, dan Tombol Aksi.
* Klik No. WO/SPK memunculkan pop-up detail lengkap: uraian tugas, penugasan teknisi + kasbon masing-masing, perhitungan SPD, realisasi pemakaian kasbon, sisa dana, tautan Berita Acara, serta galeri *thumbnail* foto pekerjaan dari Google Drive.



**TAB 2: Input & Form WO / SPK**

* **Header & Klasifikasi:** Pilihan toggle WO atau SPK, input nomor dokumen, input nama marketing, dan sub-divisi penanggung jawab.
* **Uraian Pekerjaan:** Input nama customer, tanggal pelaksanaan, serta *textarea* deskripsi pekerjaan dengan *live word counter*.
* **Penugasan Teknisi:** Multi-select teknisi (bisa lintas divisi) dan input nominal kasbon per teknisi.
* **Kategori Dinas (SPD vs Proyek):**
* Pilihan kategori: SPD atau Proyek.
* Input parameter: Jumlah hari, SPD harian, jumlah malam menginap, dan biaya hotel per malam.
* Kalkulasi otomatis:

$$\text{Total SPD} = (\text{Hari} \times \text{SPD Harian}) + (\text{Malam} \times \text{Biaya Hotel})$$




* **Upload Berkas Google Drive & Penyelesaian:**
* Input upload Berita Acara (format .pdf).
* Input multi-upload foto dokumentasi lapangan (.jpg, .jpeg, .png).
* Input realisasi kasbon aktual dan kalkulasi sisa dana.
* Dropdown status: *Done*, *Pending*, *Hold*, *Cancel*.



**TAB 3: Master Tim & Sub-Divisi**

* **Manajemen Personil:** Tambah, edit, dan hapus personil (Nama, WhatsApp/HP, Sub-Divisi, Jabatan: Teknisi, Supervisor, Drafter, Manager).
* **Tabel Beban Kerja:** Kolom total akumulasi WO dan SPK yang pernah diselesaikan tiap personil.
* **Modal Matriks Personil:** Klik nama personil memunculkan grafik perbandingan penugasan WO vs SPK, diagram persentase status pekerjaan yang pernah ditangani, akumulasi total kasbon yang pernah diterima, dan log riwayat pekerjaan.

---

### 6. Rencana Implementasi & Milestone

| Fase | Durasi | Sasaran Teknis |
| --- | --- | --- |
| **Fase 1** | Hari 1–3 | Setup Next.js App Router, konfigurasi Turso DB via Drizzle ORM, migrasi skema tabel, dan setup UI Tab 3 (Master Tim). |
| **Fase 2** | Hari 4–6 | Konfigurasi Google Cloud Console (Service Account, Google Drive API v3), pembuatan helper drive folder generator & upload streaming handler di Next.js. |
| **Fase 3** | Hari 7–9 | Pembangunan Form Input Tab 2: penugasan tim cross-division, kalkulator SPD real-time, upload multi-file ke Drive, dan penyimpanan metadata ke Turso. |
| **Fase 4** | Hari 10–12 | Pembangunan Dashboard Tab 1: filter query multi-dimensi, pop-up interaktif sub-divisi, modal preview detail pekerjaan beserta galeri foto Drive. |
| **Fase 5** | Hari 13–14 | Pengujian beban filter, handling file upload besar/timeout, verifikasi hak akses Google Drive, dan deployment. |