"use client";

import React, { useState, useMemo } from "react";
import { 
  X, 
  Download, 
  Copy, 
  Check, 
  FileSpreadsheet, 
  Settings2, 
  Eye, 
  CheckCircle2,
  TrendingUp,
  Building2,
  DollarSign
} from "lucide-react";
import { WorkOrderJob } from "@/types";
import { formatRupiah, formatDateIndo, calculateDurationDays } from "@/utils/formatters";

interface ExportCsvModalProps {
  isOpen: boolean;
  onClose: () => void;
  jobs: WorkOrderJob[];
  initialSubdiv?: string;
  initialStatus?: string;
}

export function ExportCsvModal({
  isOpen,
  onClose,
  jobs,
  initialSubdiv = "ALL",
  initialStatus = "ALL",
}: ExportCsvModalProps) {
  // Pilihan Delimiter
  const [delimiter, setDelimiter] = useState<";" | ",">(";");
  // Status Tombol Salin
  const [isCopied, setIsCopied] = useState(false);

  // Filter Sub-Divisi & Status di Modal
  const [filterSubdiv, setFilterSubdiv] = useState(initialSubdiv);
  const [filterStatus, setFilterStatus] = useState(initialStatus);

  const filteredJobs = useMemo(() => {
    return jobs.filter((j) => {
      if (filterSubdiv !== "ALL" && j.subdiv !== filterSubdiv) return false;
      if (filterStatus !== "ALL" && j.status !== filterStatus) return false;
      return true;
    });
  }, [jobs, filterSubdiv, filterStatus]);

  // Escape Cell CSV
  const escapeCell = (val: any) => {
    if (val === null || val === undefined) return '""';
    const str = String(val);
    if (str.includes(delimiter) || str.includes('"') || str.includes("\n") || str.includes("\r")) {
      return `"${str.replace(/"/g, '""')}"`;
    }
    return `"${str}"`;
  };

  // Generate CSV String persis Google Spreadsheet UJB
  const csvData = useMemo(() => {
    const now = new Date();
    const dateStr = now.toLocaleDateString("id-ID", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });

    // 23 Kolom Utama
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

    const rows = filteredJobs.map((job, idx) => {
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

      return row.map(escapeCell).join(delimiter);
    });

    const totalSisaAll = totalPengajuanAll - totalRealisasiAll;
    const completionRateFormatted = filteredJobs.length > 0 
      ? ((countDone / filteredJobs.length) * 100).toFixed(1).replace(".", ",") + "%" 
      : "0,0%";

    // Buat 23 kolom array helper
    const makeRow23 = (cells: Record<number, string>) => {
      const arr = Array(23).fill("");
      Object.entries(cells).forEach(([colIdx, val]) => {
        arr[Number(colIdx)] = val;
      });
      return arr.map(escapeCell).join(delimiter);
    };

    // Header Metadata
    const row1 = makeRow23({ 0: "PT. USAHA JAYAMAS BHAKTI - ME ENGINEERING & IT SOLUTIONS" });
    const row2 = makeRow23({ 0: `REKAPITULASI RESMI WORK ORDER & SPK (${dateStr})` });
    const row3 = makeRow23({ 0: `Total Dokumen: ${filteredJobs.length} | Format Delimiter: ${delimiter === ";" ? "Titik Koma (Excel ID)" : "Koma (Standard RFC 4180)"}` });
    const row4 = makeRow23({});

    // Baris 5, 6, 7: KPI Metric Cards (Sesuai Persis Google Spreadsheet)
    const row5 = makeRow23({
      1: "TOTAL DOKUMEN",
      4: "TOTAL PENGAJUAN",
      8: "REALISASI AKTUAL",
      12: "SISA EFISIENSI",
      16: "TINGKAT SELESAI"
    });

    const row6 = makeRow23({
      1: String(filteredJobs.length),
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
      16: `Proyek Selesai: ${countDone} / ${filteredJobs.length}`
    });

    const row8 = makeRow23({});
    const row9 = makeRow23({});

    // Baris Total Ringkasan (Footer Row)
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

    const fullContent = "\uFEFF" + [
      row1,
      row2,
      row3,
      row4,
      row5,
      row6,
      row7,
      row8,
      row9,
      headers.map(escapeCell).join(delimiter),
      ...rows,
      summaryRow,
    ].join("\r\n");

    return { 
      headers, 
      rows, 
      fullContent,
      metrics: {
        totalJobs: filteredJobs.length,
        totalPengajuanAll,
        totalRealisasiAll,
        totalSisaAll,
        completionRateFormatted,
        countDone,
      }
    };
  }, [filteredJobs, delimiter]);

  const handleDownload = () => {
    const blob = new Blob([csvData.fullContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    const now = new Date();
    const pad = (n: number) => String(n).padStart(2, "0");
    const fileName = `Rekap_WO_SPK_UJB_${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(now.getDate())}_${pad(now.getHours())}${pad(now.getMinutes())}.csv`;

    link.setAttribute("href", url);
    link.setAttribute("download", fileName);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleCopyClipboard = async () => {
    try {
      await navigator.clipboard.writeText(csvData.fullContent);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2500);
    } catch {}
  };

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 z-50 bg-slate-950/75 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5"
      role="dialog"
      aria-modal="true"
    >
      <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[92vh] flex flex-col border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        
        {/* Header Modal */}
        <div className="bg-slate-900 text-white p-4 sm:p-5 flex items-center justify-between shrink-0 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-600/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shrink-0">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-mono uppercase bg-emerald-500/20 text-emerald-300 px-1.5 py-0.2 rounded font-bold">
                  Standar Format Google Sheets & Excel UJB
                </span>
                <span className="text-xs text-slate-400">PT. Usaha Jayamas Bhakti</span>
              </div>
              <h2 className="text-sm sm:text-base font-bold text-white tracking-tight mt-0.5">
                Export Data Operasional (CSV Rapi Sesuai Format Rekap)
              </h2>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
            aria-label="Tutup modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-5 text-slate-800">
          
          {/* 1. KPI Cards Preview (Seperti di Google Spreadsheet) */}
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-3">
              <span className="text-[10px] font-bold text-slate-500 uppercase block tracking-wider">
                Total Dokumen
              </span>
              <span className="text-lg font-black text-slate-900 mt-0.5 block">
                {csvData.metrics.totalJobs}
              </span>
              <span className="text-[10px] text-slate-400">Total Dokumen Aktif</span>
            </div>

            <div className="bg-blue-50/50 border border-blue-200/60 rounded-xl p-3">
              <span className="text-[10px] font-bold text-blue-700 uppercase block tracking-wider">
                Total Pengajuan
              </span>
              <span className="text-sm font-black text-blue-900 mt-1 block">
                {formatRupiah(csvData.metrics.totalPengajuanAll)}
              </span>
              <span className="text-[10px] text-blue-600/70">Akumulasi Usulan</span>
            </div>

            <div className="bg-slate-50 border border-slate-200 rounded-xl p-3">
              <span className="text-[10px] font-bold text-slate-500 uppercase block tracking-wider">
                Realisasi Aktual
              </span>
              <span className="text-sm font-black text-slate-800 mt-1 block">
                {formatRupiah(csvData.metrics.totalRealisasiAll)}
              </span>
              <span className="text-[10px] text-slate-400">Biaya Lapangan</span>
            </div>

            <div className="bg-emerald-50/50 border border-emerald-200/60 rounded-xl p-3">
              <span className="text-[10px] font-bold text-emerald-700 uppercase block tracking-wider">
                Sisa Efisiensi
              </span>
              <span className="text-sm font-black text-emerald-900 mt-1 block">
                {formatRupiah(csvData.metrics.totalSisaAll)}
              </span>
              <span className="text-[10px] text-emerald-600/70">Penghematan</span>
            </div>

            <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 col-span-2 sm:col-span-1">
              <span className="text-[10px] font-bold text-slate-500 uppercase block tracking-wider">
                Tingkat Selesai
              </span>
              <span className="text-lg font-black text-slate-900 mt-0.5 block">
                {csvData.metrics.completionRateFormatted}
              </span>
              <span className="text-[10px] text-slate-400">
                Selesai: {csvData.metrics.countDone}/{csvData.metrics.totalJobs}
              </span>
            </div>
          </div>

          {/* Controls Bar: Format Delimiter */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
            <label className="text-[11px] font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5 mb-2.5">
              <Settings2 className="w-3.5 h-3.5 text-blue-600" />
              Format Delimiter Pemisah Kolom
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <button
                type="button"
                onClick={() => setDelimiter(";")}
                className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                  delimiter === ";"
                    ? "bg-blue-50 border-blue-600 text-blue-900 font-bold shadow-xs"
                    : "bg-white border-slate-200 text-slate-600 hover:border-slate-300"
                }`}
              >
                <div className="flex items-center justify-between">
                  <span>Titik Koma ( ; )</span>
                  {delimiter === ";" && <Check className="w-4 h-4 text-blue-600" />}
                </div>
                <span className="text-[11px] text-slate-500 font-normal block mt-1">
                  Standar Microsoft Excel Indonesia (Kolom langsung terpisah otomatis)
                </span>
              </button>

              <button
                type="button"
                onClick={() => setDelimiter(",")}
                className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                  delimiter === ","
                    ? "bg-blue-50 border-blue-600 text-blue-900 font-bold shadow-xs"
                    : "bg-white border-slate-200 text-slate-600 hover:border-slate-300"
                }`}
              >
                <div className="flex items-center justify-between">
                  <span>Koma ( , )</span>
                  {delimiter === "," && <Check className="w-4 h-4 text-blue-600" />}
                </div>
                <span className="text-[11px] text-slate-500 font-normal block mt-1">
                  Standar Google Sheets & RFC 4180 Internasional
                </span>
              </button>
            </div>
          </div>

          {/* Quick Metrics Bar */}
          <div className="flex items-center justify-between text-xs border-b border-slate-200 pb-2">
            <div className="flex items-center gap-2">
              <span className="font-bold text-slate-800 flex items-center gap-1">
                <Eye className="w-3.5 h-3.5 text-blue-600" />
                Live Preview (Pratinjau Data CSV Sesuai Google Sheet):
              </span>
              <span className="text-[11px] text-slate-500 bg-slate-100 px-2 py-0.5 rounded font-mono">
                {filteredJobs.length} Baris Data + Baris Total Ringkasan
              </span>
            </div>

            <span className="text-[11px] text-slate-400 font-mono hidden sm:inline">
              UTF-8 BOM Encoded • Microsoft Excel & Google Sheets Compatible
            </span>
          </div>

          {/* Table Preview (5 baris pertama) */}
          <div className="border border-slate-200 rounded-xl overflow-hidden shadow-2xs">
            <div className="overflow-x-auto max-h-56">
              <table className="w-full text-[11px] text-left border-collapse">
                <thead className="bg-slate-100 text-slate-700 font-bold uppercase sticky top-0 border-b border-slate-200">
                  <tr>
                    <th className="p-2 border-r border-slate-200 text-center w-8">#</th>
                    <th className="p-2 border-r border-slate-200 w-28">No. Dokumen</th>
                    <th className="p-2 border-r border-slate-200 w-32">Sub-Divisi</th>
                    <th className="p-2 border-r border-slate-200">Customer</th>
                    <th className="p-2 border-r border-slate-200 w-24">Marketing</th>
                    <th className="p-2 border-r border-slate-200 w-28 text-right">Pengajuan</th>
                    <th className="p-2 border-r border-slate-200 w-28 text-right">Realisasi</th>
                    <th className="p-2 text-center w-20">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-mono">
                  {filteredJobs.slice(0, 5).map((job, idx) => {
                    const totalKasbon = (job.techs || []).reduce((acc, t) => acc + (t.kasbon || 0), 0);
                    const spdDaily = job.spdType === "Proyek" ? 0 : (job.spdDays || 0) * (job.spdDaily || 0);
                    const spdHotel = job.spdType === "Proyek" ? 0 : (job.spdNights || 0) * (job.spdHotel || 0);
                    const totalPengajuan = totalKasbon + spdDaily + spdHotel;
                    const realisasi = job.kasbonUsed || 0;

                    return (
                      <tr key={job.id} className="hover:bg-slate-50">
                        <td className="p-2 border-r border-slate-100 text-center text-slate-400">{idx + 1}</td>
                        <td className="p-2 border-r border-slate-100 font-bold text-slate-900">{job.docNumber}</td>
                        <td className="p-2 border-r border-slate-100 font-sans text-slate-700">{job.subdiv}</td>
                        <td className="p-2 border-r border-slate-100 font-sans truncate max-w-[200px] text-slate-800">{job.customer}</td>
                        <td className="p-2 border-r border-slate-100 font-sans text-slate-600">{job.marketing}</td>
                        <td className="p-2 border-r border-slate-100 text-right font-semibold text-blue-700">{formatRupiah(totalPengajuan)}</td>
                        <td className="p-2 border-r border-slate-100 text-right font-semibold text-slate-700">{formatRupiah(realisasi)}</td>
                        <td className="p-2 text-center">
                          <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                            job.status === "Done" ? "bg-emerald-100 text-emerald-800" :
                            job.status === "Hold" ? "bg-amber-100 text-amber-800" :
                            job.status === "Cancel" ? "bg-rose-100 text-rose-800" :
                            "bg-blue-100 text-blue-800"
                          }`}>
                            {job.status}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            {filteredJobs.length > 5 && (
              <div className="bg-slate-50 px-3 py-1.5 text-center text-[10px] text-slate-500 border-t border-slate-200">
                ...dan {filteredJobs.length - 5} baris data pekerjaan lainnya akan disertakan dalam file CSV unduhan.
              </div>
            )}
          </div>

        </div>

        {/* Footer Actions */}
        <div className="bg-slate-50 border-t border-slate-200 p-4 sm:p-5 flex flex-wrap items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-2 text-xs text-slate-500 font-mono">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>Format tabel & baris TOTAL RINGKASAN otomatis rapi di Excel/Sheets.</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleCopyClipboard}
              className="px-3.5 py-2 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              {isCopied ? (
                <>
                  <Check className="w-4 h-4 text-emerald-600" />
                  <span className="text-emerald-700 font-bold">Tersalin ke Clipboard!</span>
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4 text-slate-600" />
                  <span>Salin ke Clipboard</span>
                </>
              )}
            </button>

            <button
              type="button"
              onClick={handleDownload}
              className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white text-xs font-bold flex items-center gap-2 shadow-md shadow-blue-600/20 transition-all cursor-pointer"
            >
              <Download className="w-4 h-4" />
              <span>Download File CSV (.csv)</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
