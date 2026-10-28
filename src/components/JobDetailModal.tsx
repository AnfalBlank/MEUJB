"use client";

import React, { useEffect, useState } from "react";
import Image from "next/image";
import { 
  X, 
  Printer, 
  Edit3, 
  Trash2, 
  FolderCheck, 
  ExternalLink, 
  FileText, 
  Users, 
  DollarSign, 
  Compass, 
  Calendar, 
  UserCheck, 
  Building2, 
  Clock, 
  Image as ImageIcon
} from "lucide-react";
import { WorkOrderJob, WorkOrderPhoto } from "@/types";
import { formatRupiah, formatDateIndo, calculateDurationDays, isJobOverdue } from "@/utils/formatters";
import { buildDriveFolderPath } from "@/utils/driveHelper";
import { PhotoLightboxModal } from "./PhotoLightboxModal";

interface JobDetailModalProps {
  job: WorkOrderJob | null;
  onClose: () => void;
  onEdit: (job: WorkOrderJob) => void;
  onDelete: (id: string) => void;
}

export function JobDetailModal({
  job,
  onClose,
  onEdit,
  onDelete
}: JobDetailModalProps) {
  const [selectedPhoto, setSelectedPhoto] = useState<WorkOrderPhoto | null>(null);
  const [clientTodayStr, setClientTodayStr] = useState<string>("");

  useEffect(() => {
    setClientTodayStr(new Date().toISOString().split("T")[0]);
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && job && !selectedPhoto) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [job, selectedPhoto, onClose]);

  if (!job) return null;

  const totalKasbonTech = job.techs.reduce((sum, t) => sum + Number(t.kasbon || 0), 0);
  const totalSpd = job.spdType === "Proyek" 
    ? 0 
    : (Number(job.spdDays || 0) * Number(job.spdDaily || 0)) + (Number(job.spdNights || 0) * Number(job.spdHotel || 0));
  
  const totalPengajuan = totalKasbonTech + totalSpd;
  const realisasi = Number(job.kasbonUsed || 0);
  const sisaDana = totalPengajuan - realisasi;

  const year = job.date ? job.date.split("-")[0] : new Date().getFullYear().toString();
  const driveFolders = buildDriveFolderPath(year, job.subdiv, job.docType, job.docNumber, job.customer);

  const statusBadgeClass = 
    job.status === "Done" ? "bg-emerald-50 text-emerald-700 border-emerald-200" :
    job.status === "Pending" ? "bg-amber-50 text-amber-700 border-amber-200" :
    job.status === "Hold" ? "bg-indigo-50 text-indigo-700 border-indigo-200" :
    "bg-rose-50 text-rose-700 border-rose-200";

  const handlePrint = () => {
    window.print();
  };

  return (
    <>
      <div 
        className="fixed inset-0 z-40 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5"
        role="dialog"
        aria-modal="true"
        aria-labelledby="job-detail-title"
      >
        <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[92vh] flex flex-col border border-slate-200 overflow-hidden animate-in fade-in duration-150">
          
          {/* Header */}
          <div className="p-4 sm:p-5 bg-slate-900 text-white flex justify-between items-center shrink-0 border-b border-slate-800">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-white/10 p-1 flex items-center justify-center shrink-0 border border-white/20">
                <Image
                  src="/logo.png"
                  alt="Logo PT. Usaha Jayamas Bhakti"
                  width={36}
                  height={36}
                  className="object-contain"
                />
              </div>
              <span className={`px-2.5 py-1 rounded text-xs font-mono font-bold uppercase ${
                job.docType === "WO" ? "bg-blue-600 text-white" : "bg-purple-600 text-white"
              }`}>
                {job.docType}
              </span>
              <div>
                <div className="flex items-center gap-2">
                  <h2 id="job-detail-title" className="text-base sm:text-lg font-bold font-mono tracking-tight text-white">
                    {job.docNumber}
                  </h2>
                  <span className={`text-[11px] font-sans font-semibold px-2 py-0.5 rounded-full border ${statusBadgeClass}`}>
                    {job.status}
                  </span>
                </div>
                <p className="text-xs text-slate-400 mt-0.5">
                  PT. Usaha Jayamas Bhakti • {job.subdiv}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={handlePrint}
                className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
                title="Cetak Ringkasan"
                aria-label="Cetak Ringkasan"
              >
                <Printer className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onEdit(job);
                }}
                className="p-1.5 text-slate-400 hover:text-amber-400 hover:bg-slate-800 rounded-lg transition-colors"
                title="Edit Dokumen"
                aria-label="Edit Dokumen"
              >
                <Edit3 className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => onDelete(job.id)}
                className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-slate-800 rounded-lg transition-colors"
                title="Hapus Dokumen"
                aria-label="Hapus Dokumen"
              >
                <Trash2 className="w-4 h-4" />
              </button>
              <div className="w-px h-5 bg-slate-800 mx-1"></div>
              <button
                type="button"
                onClick={onClose}
                className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
                aria-label="Tutup modal"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Modal Scrollable Content */}
          <div className="p-4 sm:p-6 overflow-y-auto space-y-5 text-slate-800 flex-1">
            
            {/* Top Info Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                  Marketing Penanggung Jawab
                </span>
                <div className="text-xs font-bold text-slate-800 mt-1 flex items-center gap-1.5">
                  <UserCheck className="w-3.5 h-3.5 text-blue-600" />
                  <span>{job.marketing}</span>
                </div>
              </div>

              <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg sm:col-span-2">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                  Customer & Lokasi Kerja
                </span>
                <div className="text-xs font-bold text-slate-800 mt-1 flex items-center gap-1.5">
                  <Building2 className="w-3.5 h-3.5 text-slate-600 shrink-0" />
                  <span className="truncate">{job.customer}</span>
                </div>
              </div>
            </div>

            {/* Description & Execution Note */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 bg-white border border-slate-200 rounded-lg">
                <div className="flex items-center gap-1.5 text-xs font-bold uppercase text-slate-600 mb-2">
                  <FileText className="w-4 h-4 text-blue-600" />
                  <span>Uraian Tugas Pekerjaan</span>
                </div>
                <p className="text-xs text-slate-700 leading-relaxed">
                  {job.desc}
                </p>
                <div className="mt-3 pt-2.5 border-t border-slate-100 flex flex-wrap items-center gap-2 text-[11px] text-slate-600 font-mono">
                  <span className="flex items-center gap-1 bg-slate-50 px-2 py-1 rounded border border-slate-200">
                    <Calendar className="w-3.5 h-3.5 text-blue-600" />
                    <span>Mulai: <strong>{formatDateIndo(job.startDate || job.date)}</strong></span>
                  </span>
                  <span className="flex items-center gap-1 bg-slate-50 px-2 py-1 rounded border border-slate-200">
                    <Calendar className="w-3.5 h-3.5 text-indigo-600" />
                    <span>Target: <strong>{formatDateIndo(job.targetDate || job.date)}</strong></span>
                  </span>
                  <span className="flex items-center gap-1 bg-blue-50 text-blue-800 px-2 py-1 rounded border border-blue-200 font-bold">
                    <Clock className="w-3.5 h-3.5 text-blue-600" />
                    <span>{calculateDurationDays(job.startDate || job.date, job.targetDate || job.date)} Hari Kalender</span>
                  </span>
                  {isJobOverdue(job.targetDate || job.date, job.status, clientTodayStr) && (
                    <span className="px-2 py-1 rounded bg-rose-100 text-rose-800 border border-rose-200 font-bold text-[10px]">
                      ⚠️ Lewat Batas Target
                    </span>
                  )}
                </div>
              </div>

              <div className="p-4 bg-white border border-slate-200 rounded-lg">
                <div className="flex items-center gap-1.5 text-xs font-bold uppercase text-slate-600 mb-2">
                  <Compass className="w-4 h-4 text-emerald-600" />
                  <span>Catatan Progres Lapangan</span>
                </div>
                <p className="text-xs text-slate-700 leading-relaxed">
                  {job.statusNote || "Tidak ada catatan tambahan."}
                </p>
                <div className="mt-3 pt-2 border-t border-slate-100 flex items-center justify-between text-[11px]">
                  <span className="text-slate-500 font-medium">Status Pekerjaan:</span>
                  <span className={`px-2 py-0.5 rounded font-semibold text-xs border ${statusBadgeClass}`}>
                    {job.status}
                  </span>
                </div>
              </div>
            </div>

            {/* Tim Bertugas & Kasbon */}
            <div className="p-4 bg-slate-50 border border-slate-200 rounded-lg space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 text-xs font-bold uppercase text-slate-700">
                  <Users className="w-4 h-4 text-blue-600" />
                  <span>Tim Bertugas ({job.techs.length} Personil)</span>
                </div>
                <span className="text-xs font-bold font-mono text-blue-700">
                  Total Kasbon Tim: {formatRupiah(totalKasbonTech)}
                </span>
              </div>

              {job.techs.length === 0 ? (
                <p className="text-xs text-slate-500 italic">Belum ada personil yang ditugaskan.</p>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5">
                  {job.techs.map((t, idx) => (
                    <div key={idx} className="bg-white p-3 rounded-lg border border-slate-200 flex justify-between items-center shadow-2xs">
                      <div>
                        <div className="text-xs font-bold text-slate-900">{t.name}</div>
                        <div className="text-[11px] text-slate-500">{t.subdiv}</div>
                      </div>
                      <div className="text-right">
                        <span className="text-[10px] text-slate-400 uppercase font-semibold block">Kasbon</span>
                        <span className="text-xs font-mono font-bold text-blue-700">{formatRupiah(t.kasbon)}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Finansial: SPD & Rekonsiliasi Kasbon */}
            <div className="p-4 bg-white border border-slate-200 rounded-lg space-y-3">
              <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                <div className="flex items-center gap-1.5 text-xs font-bold uppercase text-slate-700">
                  <DollarSign className="w-4 h-4 text-amber-600" />
                  <span>Kalkulasi SPD ({job.spdType}) & Rekonsiliasi Kasbon</span>
                </div>
                <span className="text-xs font-mono font-bold bg-amber-50 text-amber-800 border border-amber-200 px-2 py-0.5 rounded">
                  {job.spdType === "Proyek" ? "Kategori Proyek (Non-SPD)" : "Kategori SPD Resmi"}
                </span>
              </div>

              {job.spdType === "SPD" && (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-xs font-mono">
                  <div className="bg-slate-50 p-2.5 rounded border border-slate-200">
                    <span className="text-[10px] text-slate-400 font-sans uppercase block">Hari & Uang Harian</span>
                    <span className="text-xs font-bold text-slate-800">
                      {job.spdDays} Hari × {formatRupiah(job.spdDaily)}
                    </span>
                  </div>
                  <div className="bg-slate-50 p-2.5 rounded border border-slate-200">
                    <span className="text-[10px] text-slate-400 font-sans uppercase block">Malam & Hotel</span>
                    <span className="text-xs font-bold text-slate-800">
                      {job.spdNights} Malam × {formatRupiah(job.spdHotel)}
                    </span>
                  </div>
                  <div className="bg-amber-50/60 p-2.5 rounded border border-amber-200 sm:col-span-2">
                    <span className="text-[10px] text-amber-800 font-sans uppercase font-bold block">Total Uang SPD</span>
                    <span className="text-xs font-bold text-amber-900">{formatRupiah(totalSpd)}</span>
                  </div>
                </div>
              )}

              {/* Rekonsiliasi Dana */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
                <div className="bg-slate-50 p-3 rounded-lg border border-slate-200">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">Total Pengajuan Awal</span>
                  <div className="text-xs text-slate-500 font-mono mt-0.5">
                    Kasbon ({formatRupiah(totalKasbonTech)}) + SPD ({formatRupiah(totalSpd)})
                  </div>
                  <div className="text-sm font-bold font-mono text-slate-900 mt-1">
                    {formatRupiah(totalPengajuan)}
                  </div>
                </div>

                <div className="bg-slate-50 p-3 rounded-lg border border-slate-200">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">Realisasi Aktual Lapangan</span>
                  <div className="text-xs text-slate-500 font-mono mt-0.5">
                    Total Nota & Pengeluaran Nyata
                  </div>
                  <div className="text-sm font-bold font-mono text-slate-900 mt-1">
                    {formatRupiah(realisasi)}
                  </div>
                </div>

                <div className={`p-3 rounded-lg border ${
                  sisaDana >= 0 
                    ? "bg-emerald-50/60 border-emerald-200 text-emerald-900" 
                    : "bg-rose-50/60 border-rose-200 text-rose-900"
                }`}>
                  <span className="text-[10px] uppercase font-bold block opacity-80">
                    {sisaDana >= 0 ? "Sisa Dana (Kembali ke Kas)" : "Defisit (Kurang Bayar)"}
                  </span>
                  <div className="text-xs opacity-75 font-mono mt-0.5">
                    {sisaDana >= 0 ? "Surplus Keuangan Operasional" : "Perlu Penggantian / Klaim Kasbon"}
                  </div>
                  <div className="text-sm font-bold font-mono mt-1">
                    {formatRupiah(Math.abs(sisaDana))}
                  </div>
                </div>
              </div>
            </div>

            {/* Arsip Google Drive & Berkas */}
            <div className="p-4 bg-slate-50 border border-slate-200 rounded-lg space-y-3">
              <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                <div className="flex items-center gap-1.5 text-xs font-bold uppercase text-slate-700">
                  <FolderCheck className="w-4 h-4 text-blue-600" />
                  <span>Arsip Berkas Google Drive Perusahaan</span>
                </div>
                <span className="text-[11px] font-mono text-slate-500">
                  Google Drive API v3
                </span>
              </div>

              {/* Folder Path Banner */}
              <div className="p-2.5 bg-slate-900 rounded text-slate-300 text-xs font-mono flex items-center justify-between gap-2 overflow-x-auto">
                <div className="flex items-center gap-1.5 truncate">
                  <span className="text-blue-400">Dir:</span>
                  <span className="truncate">{driveFolders.fullPath}</span>
                </div>
                <span className="text-[10px] uppercase tracking-wider text-slate-400 bg-slate-800 px-2 py-0.5 rounded shrink-0">
                  Struktur PRD
                </span>
              </div>

              {/* Direct Link to Google Drive Project Folder */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-2.5 bg-blue-50 border border-blue-200 rounded-lg text-xs">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-blue-500 shrink-0"></span>
                  <span className="text-blue-950 font-semibold">Folder Tersimpan di Google Drive</span>
                </div>
                <button
                  type="button"
                  onClick={async () => {
                    try {
                      const res = await fetch("/api/drive/ensure-folder", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({
                          year,
                          subdiv: job.subdiv,
                          docType: job.docType,
                          docNumber: job.docNumber,
                          customer: job.customer,
                        }),
                      });
                      const data = await res.json();
                      if (data.projectFolderUrl) {
                        window.open(data.projectFolderUrl, "_blank");
                      } else {
                        window.open("https://drive.google.com/drive/folders/1CitMTDumnP3aJ3N-l57ILyzb6tUro9Za", "_blank");
                      }
                    } catch {
                      window.open("https://drive.google.com/drive/folders/1CitMTDumnP3aJ3N-l57ILyzb6tUro9Za", "_blank");
                    }
                  }}
                  className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 active:bg-blue-700 text-white rounded-lg font-bold flex items-center justify-center gap-1.5 text-xs transition-colors shrink-0 shadow-2xs"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span>Buka Folder di Google Drive</span>
                </button>
              </div>

              {/* Berita Acara & Foto Gallery */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
                {/* Berita Acara */}
                <div className="bg-white p-3 rounded-lg border border-slate-200">
                  <span className="text-[10px] font-bold uppercase text-slate-400 block mb-1">
                    Dokumen Berita Acara (BA)
                  </span>
                  {job.baLink ? (
                    <div className="flex items-center justify-between gap-2 bg-slate-50 p-2 rounded border border-slate-200">
                      <div className="flex items-center gap-2 truncate">
                        <FileText className="w-4 h-4 text-rose-500 shrink-0" />
                        <span className="text-xs font-mono text-slate-700 truncate font-semibold">
                          {job.baFileName || "BA_" + job.docNumber + ".pdf"}
                        </span>
                      </div>
                      <a
                        href={job.baLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-1 shrink-0"
                      >
                        <span>Buka File</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    </div>
                  ) : (
                    <p className="text-xs text-slate-400 italic">Belum ada file Berita Acara yang diunggah.</p>
                  )}
                </div>

                {/* Foto Dokumentasi */}
                <div className="bg-white p-3 rounded-lg border border-slate-200">
                  <span className="text-[10px] font-bold uppercase text-slate-400 block mb-1">
                    Foto Dokumentasi Lapangan ({job.photos?.length || 0})
                  </span>
                  {!job.photos || job.photos.length === 0 ? (
                    <p className="text-xs text-slate-400 italic">Belum ada foto dokumentasi diunggah.</p>
                  ) : (
                    <div className="flex flex-wrap gap-2">
                      {job.photos.map((photo) => (
                        <button
                          key={photo.id}
                          type="button"
                          onClick={() => setSelectedPhoto(photo)}
                          className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-slate-50 hover:bg-blue-50 border border-slate-200 hover:border-blue-300 text-xs font-medium text-slate-700 transition-colors"
                        >
                          <ImageIcon className="w-3.5 h-3.5 text-blue-500" />
                          <span className="truncate max-w-[140px] text-[11px] font-mono">{photo.fileName}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>

          </div>

          {/* Footer Actions */}
          <div className="p-4 bg-slate-50 border-t border-slate-200 flex justify-between items-center shrink-0">
            <span className="text-[11px] text-slate-400 font-mono hidden sm:inline">
              ID: {job.id}
            </span>
            <div className="flex items-center gap-2 ml-auto">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-lg border border-slate-300 text-slate-700 text-xs font-semibold hover:bg-slate-100 transition-colors"
              >
                Tutup
              </button>
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onEdit(job);
                }}
                className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold transition-colors flex items-center gap-1.5 shadow-xs"
              >
                <Edit3 className="w-3.5 h-3.5" />
                <span>Edit Dokumen</span>
              </button>
            </div>
          </div>

        </div>
      </div>

      {/* Lightbox for Photos */}
      <PhotoLightboxModal
        photo={selectedPhoto}
        onClose={() => setSelectedPhoto(null)}
      />
    </>
  );
}
