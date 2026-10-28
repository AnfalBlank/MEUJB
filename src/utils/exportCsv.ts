import { WorkOrderJob } from "@/types";
import { formatRupiah, formatDateIndo, calculateDurationDays } from "@/utils/formatters";

interface CsvExportOptions {
  jobs: WorkOrderJob[];
  subdivFilter?: string;
  statusFilter?: string;
  yearFilter?: string;
  monthFilter?: string;
}

function escapeCsvCell(val: any): string {
  if (val === null || val === undefined) return '""';
  const str = String(val);
  // Jika mengandung tanda koma, titik koma, kutip ganda, atau baris baru, bungkus dengan kutip dan escape kutip
  if (str.includes(",") || str.includes(";") || str.includes('"') || str.includes("\n") || str.includes("\r")) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return `"${str}"`;
}

export function exportOfficialCsv({
  jobs,
  subdivFilter = "ALL",
  statusFilter = "ALL",
  yearFilter = "ALL",
  monthFilter = "ALL",
}: CsvExportOptions) {
  const now = new Date();
  const dateFormatted = now.toLocaleDateString("id-ID", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });
  const timeFormatted = now.toLocaleTimeString("id-ID", {
    hour: "2-digit",
    minute: "2-digit",
  }) + " WIB";

  const filterSummary = `Sub-Divisi: ${subdivFilter} | Status: ${statusFilter} | Periode: ${monthFilter !== "ALL" ? "Bulan " + monthFilter : "Semua Bulan"} ${yearFilter !== "ALL" ? yearFilter : "Semua Tahun"}`;

  // 1. Header Resmi Perusahaan
  const headerLines = [
    escapeCsvCell("PT. USAHA JAYAMAS BHAKTI - MECHANICAL ELECTRICAL ENGINEERING & IT"),
    escapeCsvCell("LAPORAN RESMI REKAPITULASI OPERASIONAL WORK ORDER & SPK"),
    escapeCsvCell(`Waktu Unduh: ${dateFormatted}, ${timeFormatted}`),
    escapeCsvCell(`Filter Data: ${filterSummary}`),
    "", // Blank row separator
  ];

  // 2. Baris Judul Kolom Tabel
  const tableHeaders = [
    "No",
    "Jenis Dokumen",
    "Nomor Dokumen",
    "Sub-Divisi Penanggung Jawab",
    "Nama Customer / Klien",
    "Uraian Pekerjaan Teknis",
    "Nama Marketing",
    "Tanggal Mulai",
    "Target Selesai",
    "Estimasi Durasi (Hari)",
    "Teknisi Ditugaskan",
    "Jumlah Personil",
    "Tipe Penugasan",
    "Total Kasbon Teknisi (Rp)",
    "Biaya Harian SPD (Rp)",
    "Biaya Hotel SPD (Rp)",
    "Total Biaya Diajukan (Rp)",
    "Realisasi Kasbon Terpakai (Rp)",
    "Sisa / Efisiensi Biaya (Rp)",
    "Status Pekerjaan",
    "Catatan Evaluasi Lapangan",
    "Link Berita Acara (Drive)",
    "Jumlah Foto Dokumentasi",
  ].map(escapeCsvCell).join(";");

  // 3. Baris Data Pekerjaan
  let totalPengajuanAll = 0;
  let totalRealisasiAll = 0;
  let totalKasbonAll = 0;
  let countDone = 0;
  let countPending = 0;
  let countHold = 0;
  let countCancel = 0;

  const dataRows = jobs.map((job, idx) => {
    const startDate = job.startDate || job.date;
    const targetDate = job.targetDate || job.date;
    const duration = calculateDurationDays(startDate, targetDate);

    const totalKasbon = (job.techs || []).reduce((acc, t) => acc + (t.kasbon || 0), 0);
    const spdDailyTotal = job.spdType === "Proyek" ? 0 : (job.spdDays || 0) * (job.spdDaily || 0);
    const spdHotelTotal = job.spdType === "Proyek" ? 0 : (job.spdNights || 0) * (job.spdHotel || 0);
    const totalPengajuan = totalKasbon + spdDailyTotal + spdHotelTotal;
    const realisasi = job.kasbonUsed || 0;
    const sisaBiaya = totalPengajuan - realisasi;

    totalPengajuanAll += totalPengajuan;
    totalRealisasiAll += realisasi;
    totalKasbonAll += totalKasbon;

    if (job.status === "Done") countDone++;
    else if (job.status === "Pending") countPending++;
    else if (job.status === "Hold") countHold++;
    else if (job.status === "Cancel") countCancel++;

    const techNames = (job.techs || []).map((t) => `${t.name} (Rp ${t.kasbon.toLocaleString("id-ID")})`).join(", ");

    return [
      idx + 1,
      job.docType,
      job.docNumber,
      job.subdiv,
      job.customer,
      job.desc,
      job.marketing,
      formatDateIndo(startDate),
      formatDateIndo(targetDate),
      duration,
      techNames || "-",
      (job.techs || []).length,
      job.spdType === "Proyek" ? "Proyek Lokal" : "SPD Luar Kota",
      totalKasbon,
      spdDailyTotal,
      spdHotelTotal,
      totalPengajuan,
      realisasi,
      sisaBiaya,
      job.status,
      job.statusNote || "-",
      job.baLink || "-",
      (job.photos || []).length,
    ].map(escapeCsvCell).join(";");
  });

  // 4. Baris Rekapitulasi Total (Footer)
  const totalSisaAll = totalPengajuanAll - totalRealisasiAll;
  const footerRows = [
    "", // Blank row separator
    [
      escapeCsvCell("REKAPITULASI RESMI KINERJA OPERASIONAL:"),
      "", "", "", "", "", "", "", "", "", "", "", "",
      escapeCsvCell(`Total Kasbon: ${formatRupiah(totalKasbonAll)}`),
      "", "",
      escapeCsvCell(`Total Diajukan: ${formatRupiah(totalPengajuanAll)}`),
      escapeCsvCell(`Total Realisasi: ${formatRupiah(totalRealisasiAll)}`),
      escapeCsvCell(`Efisiensi/Sisa: ${formatRupiah(totalSisaAll)}`),
      escapeCsvCell(`Selesai: ${countDone} | Pending: ${countPending} | Hold: ${countHold} | Cancel: ${countCancel}`),
      escapeCsvCell(`Total Dokumen: ${jobs.length}`),
    ].join(";"),
  ];

  // Gabungkan seluruh baris dengan BOM UTF-8 (\uFEFF) untuk kompatibilitas sempurna di Microsoft Excel
  const csvContent = "\uFEFF" + [
    ...headerLines,
    tableHeaders,
    ...dataRows,
    ...footerRows,
  ].join("\r\n");

  // Unduh otomatis
  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  const pad = (n: number) => String(n).padStart(2, "0");
  const fileName = `Rekap_Operasional_UJB_${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(now.getDate())}_${pad(now.getHours())}${pad(now.getMinutes())}.csv`;

  link.setAttribute("href", url);
  link.setAttribute("download", fileName);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
