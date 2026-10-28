"use client";

import React, { useState, useMemo, useEffect } from "react";
import Image from "next/image";
import { 
  X, 
  Printer, 
  Download, 
  Filter, 
  CheckCircle2, 
  AlertCircle, 
  Clock, 
  Calendar,
  Building2,
  DollarSign,
  FileText
} from "lucide-react";
import { WorkOrderJob, SubDivision, JobStatus } from "@/types";
import { ALL_SUB_DIVISIONS } from "@/data/initialData";
import { 
  formatRupiah, 
  formatDateIndo, 
  calculateDurationDays 
} from "@/utils/formatters";

interface OfficialReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  jobs: WorkOrderJob[];
}

export function OfficialReportModal({
  isOpen,
  onClose,
  jobs,
}: OfficialReportModalProps) {
  // Filter inside the report preview
  const [filterSubdiv, setFilterSubdiv] = useState<string>("ALL");
  const [filterStatus, setFilterStatus] = useState<string>("ALL");
  const [filterType, setFilterType] = useState<string>("ALL");

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  const filteredJobs = useMemo(() => {
    return jobs.filter((j) => {
      if (filterSubdiv !== "ALL" && j.subdiv !== filterSubdiv) return false;
      if (filterStatus !== "ALL" && j.status !== filterStatus) return false;
      if (filterType !== "ALL" && j.docType !== filterType) return false;
      return true;
    });
  }, [jobs, filterSubdiv, filterStatus, filterType]);

  const summary = useMemo(() => {
    let totalKasbon = 0;
    let totalSpd = 0;
    let totalPengajuan = 0;
    let totalRealisasi = 0;
    let doneCount = 0;
    let pendingCount = 0;
    let holdCount = 0;

    filteredJobs.forEach((j) => {
      const k = (j.techs || []).reduce((acc, t) => acc + (t.kasbon || 0), 0);
      const s = j.spdType === "Proyek" ? 0 : (j.spdDays || 0) * (j.spdDaily || 0) + (j.spdNights || 0) * (j.spdHotel || 0);
      const pengajuan = k + s;
      const realisasi = j.kasbonUsed || 0;

      totalKasbon += k;
      totalSpd += s;
      totalPengajuan += pengajuan;
      totalRealisasi += realisasi;

      if (j.status === "Done") doneCount++;
      else if (j.status === "Pending") pendingCount++;
      else if (j.status === "Hold") holdCount++;
    });

    const completionRate = filteredJobs.length > 0 ? Math.round((doneCount / filteredJobs.length) * 100) : 0;
    const sisaDana = totalPengajuan - totalRealisasi;

    return {
      totalJobs: filteredJobs.length,
      doneCount,
      pendingCount,
      holdCount,
      completionRate,
      totalPengajuan,
      totalRealisasi,
      sisaDana,
    };
  }, [filteredJobs]);

  if (!isOpen) return null;

  const now = new Date();
  const reportDateStr = now.toLocaleDateString("id-ID", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });
  const reportNum = `UJB/REP-OPS/${now.getFullYear()}/${String(now.getMonth() + 1).padStart(2, "0")}/089`;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 overflow-y-auto print:p-0 print:bg-white print:static">
      <div className="bg-white rounded-xl shadow-2xl max-w-5xl w-full max-h-[92vh] flex flex-col overflow-hidden border border-slate-300 print:max-h-none print:shadow-none print:border-none print:w-full print:rounded-none">
        
        {/* Top Control Bar (Hidden on print) */}
        <div className="bg-slate-900 text-white p-4 flex flex-wrap items-center justify-between gap-3 shrink-0 print:hidden">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-blue-600/30 border border-blue-500/30 flex items-center justify-center text-blue-400">
              <FileText className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-white">
                Pratinjau & Ekspor Laporan Resmi PDF (KOP PT. Usaha Jayamas Bhakti)
              </h3>
              <p className="text-[11px] text-slate-400">
                Format resmi berstandar korporat siap cetak atau simpan ke PDF landscape
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="px-3.5 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold flex items-center gap-1.5 transition-colors shadow-xs"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Cetak / Simpan PDF</span>
            </button>
            <button
              onClick={onClose}
              aria-label="Tutup pratinjau laporan"
              className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Filter Toolbar (Hidden on print) */}
        <div className="bg-slate-50 border-b border-slate-200 p-3 flex flex-wrap items-center justify-between gap-2 shrink-0 text-xs print:hidden">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-bold text-slate-700 flex items-center gap-1 text-[11px]">
              <Filter className="w-3 h-3 text-blue-600" />
              Filter Laporan:
            </span>
            <select
              value={filterSubdiv}
              onChange={(e) => setFilterSubdiv(e.target.value)}
              className="bg-white border border-slate-300 rounded px-2 py-1 text-xs text-slate-800"
            >
              <option value="ALL">Semua Sub-Divisi</option>
              {ALL_SUB_DIVISIONS.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="bg-white border border-slate-300 rounded px-2 py-1 text-xs text-slate-800"
            >
              <option value="ALL">Semua Jenis Dokumen</option>
              <option value="WO">Work Order (WO)</option>
              <option value="SPK">SPK Operasional</option>
            </select>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="bg-white border border-slate-300 rounded px-2 py-1 text-xs text-slate-800"
            >
              <option value="ALL">Semua Status</option>
              <option value="Done">Selesai (Done)</option>
              <option value="Pending">Dalam Proses (Pending)</option>
              <option value="Hold">Tertunda (Hold)</option>
            </select>
          </div>

          <span className="text-[11px] font-mono text-slate-500 font-semibold">
            Menampilkan {filteredJobs.length} dari {jobs.length} Dokumen
          </span>
        </div>

        {/* Printable Paper Canvas */}
        <div className="flex-1 overflow-y-auto p-6 sm:p-8 space-y-6 print:overflow-visible print:p-0 bg-white text-slate-900 font-sans">
          
          {/* 1. Official Letterhead (KOP SURAT) */}
          <div className="border-b-2 border-slate-900 pb-3">
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 sm:w-20 sm:h-20 relative shrink-0">
                  <Image
                    src="/logo.png"
                    alt="Logo PT. Usaha Jayamas Bhakti"
                    width={80}
                    height={80}
                    className="object-contain"
                    priority
                  />
                </div>
                <div>
                  <h1 className="text-base sm:text-lg font-black tracking-wider text-slate-950 uppercase">
                    PT. USAHA JAYAMAS BHAKTI
                  </h1>
                  <h2 className="text-xs font-bold tracking-wide text-blue-900 uppercase">
                    Mechanical Electrical Engineering & IT Solutions
                  </h2>
                  <p className="text-[10px] text-slate-600 mt-0.5 leading-tight">
                    Gedung Operasional Teknik, Jl. Danau Sunter Barat No. 88, Tanjung Priok, Jakarta Utara 14350<br />
                    Telepon: (021) 6583-7799 (Hunting) • Email: operational@usahajayamas.co.id • Web: www.usahajayamas.co.id
                  </p>
                </div>
              </div>

              <div className="text-right shrink-0 hidden sm:block">
                <span className="inline-block px-2.5 py-1 bg-slate-100 border border-slate-300 text-[10px] font-mono font-bold text-slate-800 rounded">
                  DOKUMEN RESMI INTERNAL
                </span>
                <p className="text-[10px] font-mono text-slate-500 mt-1">
                  Klasifikasi: Terkendali
                </p>
              </div>
            </div>

            {/* Double Border Line */}
            <div className="border-t border-slate-400 mt-2.5 pt-0.5"></div>
          </div>

          {/* 2. Document Title and Reference Metadata */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200 pb-3">
            <div>
              <h2 className="text-sm font-black uppercase tracking-wider text-slate-900">
                LAPORAN REKAPITULASI WORK ORDER & SPK OPERASIONAL
              </h2>
              <p className="text-xs text-slate-600 font-mono">
                Nomor Surat: <strong className="text-slate-900">{reportNum}</strong>
              </p>
            </div>
            <div className="text-left sm:text-right text-xs">
              <span className="text-slate-500">Tanggal Terbit: </span>
              <strong className="text-slate-800">{reportDateStr}</strong>
            </div>
          </div>

          {/* 3. Executive Metrics Highlights */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
            <div className="bg-slate-50 p-3 rounded-lg border border-slate-200">
              <span className="text-[10px] uppercase font-bold text-slate-500 block mb-0.5">
                Total Dokumen
              </span>
              <div className="text-base font-black text-slate-900">
                {summary.totalJobs} <span className="text-xs font-normal text-slate-500">Dokumen</span>
              </div>
              <span className="text-[10px] text-emerald-700 font-semibold block mt-0.5">
                {summary.doneCount} Selesai ({summary.completionRate}%)
              </span>
            </div>

            <div className="bg-slate-50 p-3 rounded-lg border border-slate-200">
              <span className="text-[10px] uppercase font-bold text-slate-500 block mb-0.5">
                Total Biaya Diajukan
              </span>
              <div className="text-sm font-black text-blue-900">
                {formatRupiah(summary.totalPengajuan)}
              </div>
              <span className="text-[10px] text-slate-500 block mt-0.5">
                Kasbon & SPD Lapangan
              </span>
            </div>

            <div className="bg-slate-50 p-3 rounded-lg border border-slate-200">
              <span className="text-[10px] uppercase font-bold text-slate-500 block mb-0.5">
                Realisasi Terpakai
              </span>
              <div className="text-sm font-black text-slate-900">
                {formatRupiah(summary.totalRealisasi)}
              </div>
              <span className="text-[10px] text-slate-500 block mt-0.5">
                Pengeluaran Aktual
              </span>
            </div>

            <div className="bg-slate-50 p-3 rounded-lg border border-slate-200">
              <span className="text-[10px] uppercase font-bold text-slate-500 block mb-0.5">
                Efisiensi / Sisa Dana
              </span>
              <div className={`text-sm font-black ${summary.sisaDana >= 0 ? "text-emerald-700" : "text-rose-600"}`}>
                {formatRupiah(summary.sisaDana)}
              </div>
              <span className="text-[10px] text-slate-500 block mt-0.5">
                {summary.sisaDana >= 0 ? "Surplus Anggaran" : "Defisit Anggaran"}
              </span>
            </div>
          </div>

          {/* 4. Official Data Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-[11px] border-collapse border border-slate-300">
              <thead>
                <tr className="bg-slate-100 text-slate-800 font-bold border-b border-slate-300">
                  <th className="p-2 border-r border-slate-300 w-8 text-center">No</th>
                  <th className="p-2 border-r border-slate-300 w-32">No. Dokumen</th>
                  <th className="p-2 border-r border-slate-300 w-32">Sub-Divisi</th>
                  <th className="p-2 border-r border-slate-300">Customer & Uraian Tugas</th>
                  <th className="p-2 border-r border-slate-300 w-24">Marketing</th>
                  <th className="p-2 border-r border-slate-300 w-36">Jadwal & Durasi</th>
                  <th className="p-2 border-r border-slate-300 w-28 text-right">Biaya Diajukan</th>
                  <th className="p-2 border-r border-slate-300 w-28 text-right">Realisasi</th>
                  <th className="p-2 w-20 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {filteredJobs.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="p-6 text-center text-slate-500">
                      Tidak ada data pekerjaan yang sesuai dengan kriteria filter.
                    </td>
                  </tr>
                ) : (
                  filteredJobs.map((job, idx) => {
                    const startDate = job.startDate || job.date;
                    const targetDate = job.targetDate || job.date;
                    const duration = calculateDurationDays(startDate, targetDate);

                    const totalKasbon = (job.techs || []).reduce((acc, t) => acc + (t.kasbon || 0), 0);
                    const spdDailyTotal = job.spdType === "Proyek" ? 0 : (job.spdDays || 0) * (job.spdDaily || 0);
                    const spdHotelTotal = job.spdType === "Proyek" ? 0 : (job.spdNights || 0) * (job.spdHotel || 0);
                    const totalPengajuan = totalKasbon + spdDailyTotal + spdHotelTotal;
                    const realisasi = job.kasbonUsed || 0;

                    return (
                      <tr key={job.id} className={idx % 2 === 1 ? "bg-slate-50/70" : "bg-white"}>
                        <td className="p-2 border-r border-slate-200 text-center font-mono text-slate-600">
                          {idx + 1}
                        </td>
                        <td className="p-2 border-r border-slate-200 font-mono font-bold text-slate-900">
                          <div>{job.docNumber}</div>
                          <span className="text-[9px] font-semibold text-slate-500 uppercase">{job.docType}</span>
                        </td>
                        <td className="p-2 border-r border-slate-200 text-slate-800">
                          {job.subdiv}
                        </td>
                        <td className="p-2 border-r border-slate-200">
                          <strong className="text-slate-900 block">{job.customer}</strong>
                          <p className="text-slate-600 text-[10px] line-clamp-2 mt-0.5">{job.desc}</p>
                          {(job.techs || []).length > 0 && (
                            <div className="text-[9px] text-slate-500 mt-1">
                              Teknisi: {job.techs.map((t) => t.name).join(", ")}
                            </div>
                          )}
                        </td>
                        <td className="p-2 border-r border-slate-200 text-slate-800">
                          {job.marketing}
                        </td>
                        <td className="p-2 border-r border-slate-200 font-mono text-[10px]">
                          <div>{formatDateIndo(startDate)}</div>
                          <div className="text-slate-500">s/d {formatDateIndo(targetDate)}</div>
                          <span className="font-bold text-blue-700">({duration} Hari)</span>
                        </td>
                        <td className="p-2 border-r border-slate-200 text-right font-mono font-semibold text-slate-900">
                          {formatRupiah(totalPengajuan)}
                        </td>
                        <td className="p-2 border-r border-slate-200 text-right font-mono font-semibold text-slate-800">
                          {formatRupiah(realisasi)}
                        </td>
                        <td className="p-2 text-center">
                          <span
                            className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold ${
                              job.status === "Done"
                                ? "bg-emerald-100 text-emerald-800"
                                : job.status === "Hold"
                                ? "bg-amber-100 text-amber-800"
                                : job.status === "Cancel"
                                ? "bg-rose-100 text-rose-800"
                                : "bg-blue-100 text-blue-800"
                            }`}
                          >
                            {job.status}
                          </span>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
              {filteredJobs.length > 0 && (
                <tfoot>
                  <tr className="bg-slate-100 font-bold border-t-2 border-slate-300 text-slate-900">
                    <td colSpan={6} className="p-2 text-right uppercase border-r border-slate-300">
                      Total Rekapitulasi:
                    </td>
                    <td className="p-2 text-right font-mono border-r border-slate-300 text-blue-900">
                      {formatRupiah(summary.totalPengajuan)}
                    </td>
                    <td className="p-2 text-right font-mono border-r border-slate-300">
                      {formatRupiah(summary.totalRealisasi)}
                    </td>
                    <td className="p-2 text-center font-mono">
                      {summary.doneCount}/{filteredJobs.length}
                    </td>
                  </tr>
                </tfoot>
              )}
            </table>
          </div>

          {/* 5. Lembar Pengesahan Resmi (Signatures) */}
          <div className="pt-6 border-t border-slate-200 grid grid-cols-3 gap-6 text-center text-xs text-slate-800">
            <div>
              <p className="text-slate-500 mb-16">Dibuat Oleh,</p>
              <p className="font-bold border-b border-slate-400 inline-block px-4 pb-0.5">
                Supervisor Operasional
              </p>
              <p className="text-[10px] text-slate-500 font-mono mt-0.5">Divisi Teknik UJB</p>
            </div>

            <div>
              <p className="text-slate-500 mb-16">Diperiksa Oleh,</p>
              <p className="font-bold border-b border-slate-400 inline-block px-4 pb-0.5">
                Manager Teknik & Proyek
              </p>
              <p className="text-[10px] text-slate-500 font-mono mt-0.5">ME Engineering & IT</p>
            </div>

            <div>
              <p className="text-slate-500 mb-16">Mengetahui & Menyetujui,</p>
              <p className="font-bold border-b border-slate-400 inline-block px-4 pb-0.5">
                Direktur Operasional
              </p>
              <p className="text-[10px] text-slate-500 font-mono mt-0.5">PT. Usaha Jayamas Bhakti</p>
            </div>
          </div>

          {/* Footnote */}
          <div className="text-[9px] text-slate-400 font-mono text-center pt-4">
            Dokumen ini di-generate secara elektronik melalui Sistem Monitoring Operasional Teknik (WO/SPK Tracker) PT. Usaha Jayamas Bhakti pada {reportDateStr}.
          </div>

        </div>

      </div>
    </div>
  );
}
