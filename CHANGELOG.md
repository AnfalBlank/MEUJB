# Changelog — MEUJB (Monitoring Operasional Teknik)

## v1.1.0 — 2026-11-01

### 🔐 Security
- **Password hashing dengan bcrypt** — semua password sekarang disimpan sebagai bcrypt hash (10 rounds), tidak ada lagi plaintext di database
- **Auto-upgrade password lama** — password plaintext lama otomatis di-upgrade ke bcrypt saat login berikutnya
- **Session token authentication** — setiap login menghasilkan session token (`sess_...`) yang dikirim via `Authorization: Bearer` header di semua request API
- **API route protection** — semua endpoint (`/api/jobs`, `/api/technicians`, `/api/users`, `/api/audit-logs`, dll) kini membutuhkan session token valid; akses tanpa token → `401 Unauthorized`
- **Role-based access control (RBAC)**:
  - `manager` — bisa baca & update WO/SPK, tidak bisa hapus
  - `admin` — bisa hapus WO/SPK, tidak bisa kelola user
  - `superadmin` — akses penuh termasuk kelola user
  - Endpoint DELETE job → `403 Forbidden` untuk role manager

### 🐛 Bug Fixes
- **Fix duplikasi assignee & SPD** — `PUT /api/jobs/[id]` sekarang DELETE assignees + SPD lama sebelum INSERT baru, menghilangkan data ganda saat update WO/SPK berulang kali
- **Fix data tidak muncul antar user** — localStorage jobs/team di-clear saat logout & login, data selalu fresh dari Turso DB per sesi user
- **Fix CSS Tailwind v4 di production** — tambah `@tailwindcss/postcss` + `postcss.config.mjs`, CSS dari 6KB → 83KB (semua class ter-compile)
- **Fix Server Action mismatch** — hapus konfigurasi `turbopack` yang tidak valid di `next.config.ts`, pindah ke PostCSS pipeline untuk production
- **Fix Nginx cache** — tambah `Cache-Control: no-cache` untuk HTML agar browser selalu load JS terbaru setelah deploy; static assets tetap `immutable`
- **Fix Google Drive 404** — `GDRIVE_ROOT_FOLDER_ID` dan `GOOGLE_REFRESH_TOKEN` diperbarui ke akun yang memiliki folder "OPERASIONAL TEKNIK"

### ✨ New Features

#### API & Backend
- **Pagination di `GET /api/jobs`** — support query params `?limit=&offset=&status=&subdiv=&search=`, response include `total`, `hasMore`, `limit`, `offset`
- **Validasi input server-side** — semua endpoint POST/PUT jobs, users, technicians kini memvalidasi: docType, docNumber duplikat, subdiv, format tanggal, password min 6 karakter, format username
- **Duplicate docNumber check** — insert/update WO/SPK dengan nomor dokumen yang sudah ada → `409 Conflict` dengan pesan error jelas
- **User profile protection** — user hanya bisa update profil diri sendiri (`403` jika coba update user lain)

#### Frontend & UX
- **Polling real-time 30 detik** — data dashboard auto-refresh setiap 30 detik di background (skip jika tab tidak aktif)
- **Last updated timestamp** — Turso DB badge di header desktop menampilkan jam terakhir sync
- **Camera capture untuk upload foto** — tombol "Kamera" terpisah di form upload foto menggunakan `capture="environment"`, langsung buka kamera belakang HP
- **Header responsive mobile** — bottom navigation bar untuk mobile dengan tab icon, tidak ada lagi hamburger menu
- **Header brand cleanup** — area brand disederhanakan: logo + nama sistem + nama perusahaan tanpa tumpukan badge
- **Cockpit filter bar mobile** — filter Executive Cockpit di-refactor ke grid 2 kolom di mobile, date range hanya muncul saat pilih "Kustom"

### 🔧 Infrastructure
- **Nginx cache headers** — `no-cache` untuk HTML, `immutable` untuk static assets `/_next/static/`
- **PM2 env update** — semua restart menggunakan `--update-env` flag

---

## v1.0.0 — 2026-10-29

Initial deployment:
- Monitoring WO/SPK dengan Turso Cloud DB (LibSQL)
- Executive Cockpit dengan chart SVG interaktif
- Google Drive OAuth 2.0 integration untuk upload BA & foto
- Multi-user auth dengan role superadmin/admin/manager
- Audit log sistem
- Export CSV & laporan PDF resmi
