import { SubDivision, Technician, WorkOrderJob, DivisionMeta } from "@/types";

export const MAIN_SUB_DIVISIONS: DivisionMeta[] = [
  {
    name: "Fueling System Engineering",
    shortName: "Fueling System",
    iconName: "Fuel",
    accentColor: "#d97706", // amber-600
    bgSoft: "bg-amber-50",
    borderSoft: "border-amber-200",
    textColor: "text-amber-800",
    badgeBg: "bg-amber-100 text-amber-800 border-amber-200"
  },
  {
    name: "IT Engineering",
    shortName: "IT Eng.",
    iconName: "Network",
    accentColor: "#4f46e5", // indigo-600
    bgSoft: "bg-indigo-50",
    borderSoft: "border-indigo-200",
    textColor: "text-indigo-800",
    badgeBg: "bg-indigo-100 text-indigo-800 border-indigo-200"
  },
  {
    name: "Electrical Engineering",
    shortName: "Electrical",
    iconName: "Zap",
    accentColor: "#059669", // emerald-600
    bgSoft: "bg-emerald-50",
    borderSoft: "border-emerald-200",
    textColor: "text-emerald-800",
    badgeBg: "bg-emerald-100 text-emerald-800 border-emerald-200"
  }
];

export const ALL_SUB_DIVISIONS: SubDivision[] = [
  "Fueling System Engineering",
  "IT Engineering",
  "Electrical Engineering"
];

export const INITIAL_TECHNICIANS: Technician[] = [
  { id: "tech-1", name: "Budi Santoso", role: "Supervisor", phone: "0812-3456-7801", subdiv: "Fueling System Engineering" },
  { id: "tech-2", name: "Andi Pratama", role: "Teknisi", phone: "0812-3456-7802", subdiv: "Fueling System Engineering" },
  { id: "tech-3", name: "Rizal Hidayat", role: "Supervisor", phone: "0813-9876-5401", subdiv: "IT Engineering" },
  { id: "tech-4", name: "Dimas Wahyu", role: "Teknisi", phone: "0813-9876-5402", subdiv: "IT Engineering" },
  { id: "tech-5", name: "Hendra Wijaya", role: "Supervisor", phone: "0815-1122-3301", subdiv: "Electrical Engineering" },
  { id: "tech-6", name: "Eko Saputra", role: "Teknisi", phone: "0815-1122-3302", subdiv: "Electrical Engineering" },
  { id: "tech-7", name: "Fajar Nugraha", role: "Drafter", phone: "0817-5544-3322", subdiv: "Fueling System Engineering" },
  { id: "tech-8", name: "Siska Amelia", role: "Marketing", phone: "0818-9988-7766", subdiv: "Divisi Marketing" },
  { id: "tech-9", name: "Bagus Pratama", role: "Marketing", phone: "0819-4455-6677", subdiv: "Divisi Marketing" }
];

export const INITIAL_JOBS: WorkOrderJob[] = [
  {
    id: "job-101",
    docType: "WO",
    docNumber: "WO-EXT-2026-089",
    marketing: "Bagus Pratama",
    subdiv: "Fueling System Engineering",
    customer: "PT Pertamina Patra Niaga Regional Jawa Bagian Barat",
    desc: "Kalibrasi ATG dan perbaikan pompa dispenser pulau 2 dan 3 di SPBU Daan Mogot Jakarta Barat",
    target: "3 Hari",
    date: "2026-10-15",
    startDate: "2026-10-15",
    targetDate: "2026-10-17",
    techs: [
      { technicianId: "tech-2", name: "Andi Pratama", subdiv: "Fueling System Engineering", kasbon: 1500000 },
      { technicianId: "tech-6", name: "Eko Saputra", subdiv: "Electrical Engineering", kasbon: 1000000 }
    ],
    spdType: "SPD",
    spdDays: 3,
    spdDaily: 300000,
    spdNights: 2,
    spdHotel: 600000,
    baLink: "https://drive.google.com/file/d/1B_Pertamina_089_view/view",
    baFileName: "BA_Pertamina_089.pdf",
    photos: [
      { id: "p1", fileName: "FOTO_01_Dispenser_Pulau2.jpg", driveUrl: "https://drive.google.com/file/d/photo01_pertamina/view", caption: "Kondisi dispenser sebelum kalibrasi", uploadedAt: "2026-10-16" },
      { id: "p2", fileName: "FOTO_02_Tera_ATG.jpg", driveUrl: "https://drive.google.com/file/d/photo02_pertamina/view", caption: "Pengecekan probe ATG sensor tanki 1", uploadedAt: "2026-10-17" }
    ],
    kasbonUsed: 4350000,
    status: "Done",
    statusNote: "Pekerjaan selesai tepat waktu, ATG dan dispenser berjalan normal sesuai standar tera metrologi.",
    createdAt: "2026-10-14T08:00:00Z",
    updatedAt: "2026-10-18T16:00:00Z"
  },
  {
    id: "job-102",
    docType: "SPK",
    docNumber: "SPK/MKT-IT/2026/10/014",
    marketing: "Siska Amelia",
    subdiv: "IT Engineering",
    customer: "PT Krakatau Posco Cilegon",
    desc: "Instalasi server monitoring jaringan lokal, penarikan kabel FO antargedung dan integrasi sensor IoT telemetry",
    target: "4 Hari",
    date: "2026-10-20",
    startDate: "2026-10-20",
    targetDate: "2026-10-23",
    techs: [
      { technicianId: "tech-4", name: "Dimas Wahyu", subdiv: "IT Engineering", kasbon: 2000000 }
    ],
    spdType: "Proyek",
    spdDays: 0,
    spdDaily: 0,
    spdNights: 0,
    spdHotel: 0,
    baLink: "",
    baFileName: "",
    photos: [
      { id: "p3", fileName: "FOTO_01_Server_Rack.jpg", driveUrl: "https://drive.google.com/file/d/photo01_krakatau/view", caption: "Pemasangan rak server 42U di data center", uploadedAt: "2026-10-21" }
    ],
    kasbonUsed: 1200000,
    status: "Pending",
    statusNote: "Menunggu pembukaan izin akses firewall dari tim IT internal customer di gedung utama.",
    createdAt: "2026-10-19T09:00:00Z",
    updatedAt: "2026-10-22T11:00:00Z"
  },
  {
    id: "job-103",
    docType: "WO",
    docNumber: "WO-EXT-2026-092",
    marketing: "Bagus Pratama",
    subdiv: "Electrical Engineering",
    customer: "PT PLN Nusantara Power Muara Karang",
    desc: "Inspeksi rutin panel distribusi tegangan menengah MV/LV dan uji proteksi relay genset darurat",
    target: "2 Hari",
    date: "2026-10-24",
    startDate: "2026-10-24",
    targetDate: "2026-10-25",
    techs: [
      { technicianId: "tech-5", name: "Hendra Wijaya", subdiv: "Electrical Engineering", kasbon: 1200000 },
      { technicianId: "tech-6", name: "Eko Saputra", subdiv: "Electrical Engineering", kasbon: 1200000 }
    ],
    spdType: "SPD",
    spdDays: 2,
    spdDaily: 250000,
    spdNights: 1,
    spdHotel: 500000,
    baLink: "https://drive.google.com/file/d/1B_PLN_092_view/view",
    baFileName: "BA_PLN_MuaraKarang_092.pdf",
    photos: [
      { id: "p4", fileName: "FOTO_01_Panel_MV.jpg", driveUrl: "https://drive.google.com/file/d/photo01_pln/view", caption: "Pemeriksaan busbar dan circuit breaker", uploadedAt: "2026-10-25" }
    ],
    kasbonUsed: 3100000,
    status: "Done",
    statusNote: "Panel MV berfungsi stabil, parameter suhu dan tahanan isolasi dalam batas toleransi aman.",
    createdAt: "2026-10-23T07:30:00Z",
    updatedAt: "2026-10-26T15:00:00Z"
  },
  {
    id: "job-104",
    docType: "SPK",
    docNumber: "SPK/MKT-FS/2026/10/019",
    marketing: "Siska Amelia",
    subdiv: "Fueling System Engineering",
    customer: "PT Petrokimia Gresik Plant III",
    desc: "Penggantian flowmeter custody transfer dan kalibrasi sistem loading arm tangki asam fosfat",
    target: "5 Hari",
    date: "2026-10-26",
    startDate: "2026-10-26",
    targetDate: "2026-10-30",
    techs: [
      { technicianId: "tech-1", name: "Budi Santoso", subdiv: "Fueling System Engineering", kasbon: 2500000 },
      { technicianId: "tech-2", name: "Andi Pratama", subdiv: "Fueling System Engineering", kasbon: 2000000 }
    ],
    spdType: "SPD",
    spdDays: 5,
    spdDaily: 350000,
    spdNights: 4,
    spdHotel: 650000,
    baLink: "",
    baFileName: "",
    photos: [],
    kasbonUsed: 5800000,
    status: "Hold",
    statusNote: "Pekerjaan ditunda menunggu jadwal shutdown plant selesai pada awal bulan depan.",
    createdAt: "2026-10-25T10:00:00Z",
    updatedAt: "2026-10-27T09:00:00Z"
  },
  {
    id: "job-105",
    docType: "WO",
    docNumber: "WO-EXT-2026-095",
    marketing: "Bagus Pratama",
    subdiv: "IT Engineering",
    customer: "PT Indofood Sukses Makmur CBP Cibitung",
    desc: "Migrasi access point industri dan konfigurasi VLAN segregasi mesin packing otomatis",
    target: "1 Hari",
    date: "2026-10-27",
    startDate: "2026-10-27",
    targetDate: "2026-10-27",
    techs: [
      { technicianId: "tech-3", name: "Rizal Hidayat", subdiv: "IT Engineering", kasbon: 800000 }
    ],
    spdType: "SPD",
    spdDays: 1,
    spdDaily: 200000,
    spdNights: 0,
    spdHotel: 0,
    baLink: "https://drive.google.com/file/d/1B_Indofood_095/view",
    baFileName: "BA_Indofood_Cibitung_095.pdf",
    photos: [
      { id: "p5", fileName: "FOTO_01_WiFi_SiteSurvey.jpg", driveUrl: "https://drive.google.com/file/d/photo01_indofood/view", caption: "Uji jangkauan signal dBm di warehouse line 4", uploadedAt: "2026-10-27" }
    ],
    kasbonUsed: 950000,
    status: "Done",
    statusNote: "Konektivitas WiFi industri berjalan lancar dengan roaming delay di bawah 15ms.",
    createdAt: "2026-10-26T08:30:00Z",
    updatedAt: "2026-10-27T18:00:00Z"
  }
];
