# Sistem Monitoring Operasional Teknik (WO & SPK Tracker)
### PT. USAHA JAYAMAS BHAKTI (Mechanical Electrical Engineering & IT)

Aplikasi enterprise untuk monitoring pekerjaan teknis, penerbitan dan tracking Work Order (WO) & Surat Perintah Kerja (SPK), manajemen anggaran kasbon teknisi & Surat Perintah Dinas (SPD), integrasi Google Drive API v3, serta Executive Cockpit Dashboard.

---

## 🚀 Fitur Utama

1. **Monitoring Pekerjaan Lapangan (WO & SPK)**:
   - Pencatatan dan monitoring real-time dokumen Work Order (WO) dan Surat Perintah Kerja (SPK).
   - Penjadwalan pekerjaan: **Tanggal Mulai**, **Target Selesai**, dan kalkulasi durasi hari kalender otomatis.
   - Peringatan status otomatis untuk pekerjaan yang melewati jadwal (*Overdue Alert*).
   - Pengelompokan 3 Sub-Divisi Utama: *Fueling System Engineering*, *IT Engineering*, dan *Electrical Engineering*.

2. **Executive Cockpit Dashboard**:
   - **4 KPI Cards**: Total Volume Beban Kerja, Tingkat Keberhasilan Global (% Done), Alokasi Anggaran vs Realisasi Biaya, dan Rata-rata Durasi Proyek.
   - **Interactive Donut / Pie Charts**: Distribusi Beban Kerja per Sub-Divisi & Komposisi Status Pekerjaan.
   - **Interactive Multi-Line Trend Charts**: Tren Volume Bulanan (WO vs SPK) & Tren Keuangan (Anggaran vs Realisasi Aktual) dengan hover tooltips.
   - **Marketing Leaderboard & Sub-Divisi Scorecard**: Evaluasi performa marketing dan matriks efisiensi per sub-divisi.

3. **Laporan Resmi Siap Cetak & Ekspor**:
   - **Laporan PDF Resmi**: Format resmi berstandar korporat dengan Kop Surat PT. Usaha Jayamas Bhakti, nomor surat resmi, tabel data, dan lembar pengesahan tanda tangan 3 pihak (Supervisor Operasional, Manager Teknik, Direktur Operasional).
   - **Ekspor CSV Resmi**: Format 23 kolom lengkap dengan UTF-8 BOM dan pemisah titik koma (`;`) yang siap dibuka di Microsoft Excel tanpa teks acak (*garbled text*).

4. **Integrasi Google Drive API v3**:
   - Pembuatan struktur hirarki folder otomatis via Google Service Account:
     `{Root Folder} / {Tahun} / {Sub-Divisi} / [{No_Dokumen}] {Customer} / Berita_Acara & Foto_Dokumentasi`
   - Tombol akses langsung 1-klik untuk membuka folder proyek di Google Drive.

5. **Cloud Database Turso (LibSQL / SQLite)**:
   - Sinkronisasi data real-time dengan serverless cloud SQLite Turso di AWS AP-Northeast-1.
   - Dilengkapi fallback offline LocalStorage untuk reliabilitas tinggi.

---

## 🛠️ Tech Stack

- **Framework**: [Next.js 16](https://nextjs.org/) (Turbopack, App Router)
- **Library UI**: [React 19](https://react.dev/)
- **Styling**: [Tailwind CSS v4](https://tailwindcss.com/)
- **Icons**: [Lucide React](https://lucide.dev/)
- **Database**: [Turso (LibSQL)](https://turso.tech/) + [Drizzle ORM](https://orm.drizzle.team/)
- **Cloud Storage API**: [Google APIs (Google Drive v3)](https://www.npmjs.com/package/googleapis)

---

## ⚙️ Panduan Menjalankan Proyek

### 1. Kloning Repositori
```bash
git clone https://github.com/AnfalBlank/MEUJB.git
cd MEUJB
```

### 2. Pasang Dependensi
```bash
npm install
```

### 3. Konfigurasi Environment Variables
Salin file `.env.example` menjadi `.env.local`:
```bash
cp .env.example .env.local
```
Lalu lengkapi isinya:
```env
# Turso Database
TURSO_DATABASE_URL="libsql://your-db-url.turso.io"
TURSO_AUTH_TOKEN="your-turso-auth-token"

# Google Drive Service Account
GOOGLE_SERVICE_ACCOUNT_EMAIL="your-service-account@project.iam.gserviceaccount.com"
GOOGLE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
GDRIVE_ROOT_FOLDER_ID="your-root-folder-id"
```

### 4. Jalankan Server Development
```bash
npm run dev
```
Buka browser di [http://localhost:3000](http://localhost:3000) (atau port yang aktif).

### 5. Build Produksi
```bash
npm run build
npm run start
```

---

## 📄 Lisensi
Hak Cipta © 2026 PT. USAHA JAYAMAS BHAKTI. Seluruh hak cipta dilindungi undang-undang.
