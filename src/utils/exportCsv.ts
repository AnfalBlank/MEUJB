import { WorkOrderJob } from "@/types";
import { formatRupiah, formatDateIndo, calculateDurationDays } from "@/utils/formatters";

interface CsvExportOptions {
  jobs: WorkOrderJob[];
  subdivFilter?: string;
  statusFilter?: string;
  yearFilter?: string;
  monthFilter?: string;
  delimiter?: ";" | ",";
}

function escapeCsvCell(val: any, delimiter: string = ";"): string {
  if (val === null || val === undefined) return '""';
  const str = String(val);
  if (str.includes(delimiter) || str.includes('"') || str.includes("\n") || str.includes("\r")) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return `"${str}"`;
}

export function exportOfficialCsv({
  jobs,
  subdivFilter = "ALL",
  statusFilter = "ALL",
  delimiter = ";",
}: CsvExportOptions) {
  const now = new Date();
  const dateFormatted = now.toLocaleDateString("id-ID", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const escape = (val: any) => escapeCsvCell(val, delimiter);

  const makeRow23 = (cells: Record<number, string>) => {
    const arr = Array(23).fill("");
    Object.entries(cells).forEach(([colIdx, val]) => {
      arr[Number(colIdx)] = val;
    });
    return arr.map(escape).join(delimiter);
  };

  const headers = [
    "No",
    "Jenis Dokumen",
    "Nomor Dokumen",
    "Sub-Divisi",
    "Customer",
    "Uraian Tugas",
    "Marketing",
    "Tanggal Mulai",
    "Target Selesai",
    "Durasi (Hari)",
    "Personil Teknisi",
    "Jumlah Personil",
    "Tipe Penugasan",
    "Total Kasbon (Rp)",
    "Biaya SPD Harian (Rp)",
    "Biaya Hotel SPD (Rp)",
    "Total Pengajuan (Rp)",
    "Realisasi Aktual (Rp)",
    "Sisa Efisiensi (Rp)",
    "Status Pekerjaan",
    "Catatan Lapangan",
    "Link Berita Acara Drive",
    "Jumlah Foto",
  ];

  let totalKasbonAll = 0;
  let totalSpdDailyAll = 0;
  let totalSpdHotelAll = 0;
  let totalPengajuanAll = 0;
  let totalRealisasiAll = 0;
  let totalDurasiAll = 0;
  let totalPersonilAll = 0;
  let totalFotoAll = 0;
  let countDone = 0;

  const dataRows = jobs.map((job, idx) => {
    const startDate = job.startDate || job.date;
    const targetDate = job.targetDate || job.date;
    const duration = calculateDurationDays(startDate, targetDate);

    const totalKasbon = (job.techs || []).reduce((acc, t) => acc + (t.kasbon || 0), 0);
    const spdDaily = job.spdType === "Proyek" ? 0 : (job.spdDays || 0) * (job.spdDaily || 0);
    const spdHotel = job.spdType === "Proyek" ? 0 : (job.spdNights || 0) * (job.spdHotel || 0);
    const totalPengajuan = totalKasbon + spdDaily + spdHotel;
    const realisasi = job.kasbonUsed || 0;
    const sisa = totalPengajuan - realisasi;
    const techCount = (job.techs || []).length;
    const photoCount = (job.photos || []).length;

    totalKasbonAll += totalKasbon;
    totalSpdDailyAll += spdDaily;
    totalSpdHotelAll += spdHotel;
    totalPengajuanAll += totalPengajuan;
    totalRealisasiAll += realisasi;
    totalDurasiAll += duration;
    totalPersonilAll += techCount;
    totalFotoAll += photoCount;

    if (job.status === "Done") countDone++;

    const techNames = (job.techs || []).map((t) => `${t.name} (Rp ${t.kasbon.toLocaleString("id-ID")})`).join(", ");

    const row = [
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
      techCount,
      job.spdType === "Proyek" ? "Proyek Lokal" : "SPD Luar Kota",
      formatRupiah(totalKasbon),
      formatRupiah(spdDaily),
      formatRupiah(spdHotel),
      formatRupiah(totalPengajuan),
      formatRupiah(realisasi),
      formatRupiah(sisa),
      job.status,
      job.statusNote || "-",
      job.baLink || "-",
      photoCount,
    ];

    return row.map(escape).join(delimiter);
  });

  const totalSisaAll = totalPengajuanAll - totalRealisasiAll;
  const completionRateFormatted = jobs.length > 0 
    ? ((countDone / jobs.length) * 100).toFixed(1).replace(".", ",") + "%" 
    : "0,0%";

  const row1 = makeRow23({ 0: "PT. USAHA JAYAMAS BHAKTI - ME ENGINEERING & IT SOLUTIONS" });
  const row2 = makeRow23({ 0: `REKAPITULASI RESMI WORK ORDER & SPK (${dateFormatted})` });
  const row3 = makeRow23({ 0: `Total Dokumen: ${jobs.length} | Format Delimiter: ${delimiter === ";" ? "Titik Koma (Excel ID)" : "Koma (Standard RFC 4180)"}` });
  const row4 = makeRow23({});

  const row5 = makeRow23({
    1: "TOTAL DOKUMEN",
    4: "TOTAL PENGAJUAN",
    8: "REALISASI AKTUAL",
    12: "SISA EFISIENSI",
    16: "TINGKAT SELESAI"
  });

  const row6 = makeRow23({
    1: String(jobs.length),
    4: formatRupiah(totalPengajuanAll),
    8: formatRupiah(totalRealisasiAll),
    12: formatRupiah(totalSisaAll),
    16: completionRateFormatted
  });

  const row7 = makeRow23({
    1: "Total Dokumen Aktif",
    4: "Akumulasi Usulan Biaya",
    8: "Realisasi Biaya Lapangan",
    12: "Penghematan Anggaran",
    16: `Proyek Selesai: ${countDone} / ${jobs.length}`
  });

  const row8 = makeRow23({});
  const row9 = makeRow23({});

  const summaryRow = makeRow23({
    0: "TOTAL RINGKASAN",
    9: String(totalDurasiAll),
    11: String(totalPersonilAll),
    13: formatRupiah(totalKasbonAll),
    14: formatRupiah(totalSpdDailyAll),
    15: formatRupiah(totalSpdHotelAll),
    16: formatRupiah(totalPengajuanAll),
    17: formatRupiah(totalRealisasiAll),
    18: formatRupiah(totalSisaAll),
    22: String(totalFotoAll),
  });

  const csvContent = "\uFEFF" + [
    row1,
    row2,
    row3,
    row4,
    row5,
    row6,
    row7,
    row8,
    row9,
    headers.map(escape).join(delimiter),
    ...dataRows,
    summaryRow,
  ].join("\r\n");

  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  const pad = (n: number) => String(n).padStart(2, "0");
  const fileName = `Rekap_WO_SPK_UJB_${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(now.getDate())}_${pad(now.getHours())}${pad(now.getMinutes())}.csv`;

  link.setAttribute("href", url);
  link.setAttribute("download", fileName);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
