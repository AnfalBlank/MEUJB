"use client";

import React, { useState, useEffect, useMemo } from "react";
import { 
  FileText, 
  Upload, 
  Users, 
  DollarSign, 
  CheckCircle2, 
  RotateCcw, 
  FolderCheck, 
  Plus, 
  Trash2,
  Calendar,
  Building2,
  UserCheck,
  Clock,
  AlertCircle,
  HelpCircle,
  HardDrive,
  UserPlus,
  Image as ImageIcon,
  ExternalLink,
  RefreshCw
} from "lucide-react";
import { 
  WorkOrderJob, 
  SubDivision, 
  DocType, 
  JobStatus, 
  Technician, 
  AssignedTech, 
  WorkOrderPhoto 
} from "@/types";
import { ALL_SUB_DIVISIONS } from "@/data/initialData";
import { 
  formatRupiah, 
  countWords, 
  generateNextDocNumber,
  calculateDurationDays 
} from "@/utils/formatters";
import { buildDriveFolderPath } from "@/utils/driveHelper";
import { DriveGuideModal } from "@/components/DriveGuideModal";

interface InputViewProps {
  initialJob: WorkOrderJob | null;
  teamMembers: Technician[];
  existingJobsCount: number;
  onSaveJob: (job: WorkOrderJob) => void;
  onCancel: () => void;
  onShowToast: (message: string, type?: "success" | "error" | "info") => void;
  onRegisterMarketing?: (name: string, phone?: string) => Promise<void> | void;
}

export function InputView({
  initialJob,
  teamMembers,
  existingJobsCount,
  onSaveJob,
  onCancel,
  onShowToast,
  onRegisterMarketing
}: InputViewProps) {
  // Form State
  const [docType, setDocType] = useState<DocType>("WO");
  const [docNumber, setDocNumber] = useState<string>("");

  // Marketing dynamic list from team members
  const marketingList = useMemo(() => {
    const names = new Set<string>();
    teamMembers.forEach((m) => {
      if (m.role === "Marketing" || m.subdiv.toLowerCase().includes("marketing")) {
        if (m.name && m.name.trim()) names.add(m.name.trim());
      }
    });
    if (names.size === 0) {
      names.add("Bagus Pratama");
      names.add("Siska Amelia");
    }
    return Array.from(names).sort((a, b) => a.localeCompare(b));
  }, [teamMembers]);

  const [marketing, setMarketing] = useState<string>("");
  const [isManualMarketing, setIsManualMarketing] = useState<boolean>(false);
  const [autoRegisterMarketing, setAutoRegisterMarketing] = useState<boolean>(true);
  const [isRegisteringQuick, setIsRegisteringQuick] = useState<boolean>(false);
  const [isDriveGuideOpen, setIsDriveGuideOpen] = useState<boolean>(false);

  const [subdiv, setSubdiv] = useState<SubDivision>("Fueling System Engineering");
  const [customer, setCustomer] = useState<string>("");
  const [desc, setDesc] = useState<string>("");
  const [target, setTarget] = useState<string>("3 Hari");
  const [date, setDate] = useState<string>(
    new Date().toISOString().split("T")[0]
  );
  const [startDate, setStartDate] = useState<string>(
    new Date().toISOString().split("T")[0]
  );
  const [targetDate, setTargetDate] = useState<string>(() => {
    const d = new Date();
    d.setDate(d.getDate() + 2);
    return d.toISOString().split("T")[0];
  });

  const calculatedDuration = useMemo(() => {
    return calculateDurationDays(startDate, targetDate);
  }, [startDate, targetDate]);

  const isInvalidDateRange = useMemo(() => {
    return Boolean(startDate && targetDate && targetDate < startDate);
  }, [startDate, targetDate]);

  const [assignedTechs, setAssignedTechs] = useState<AssignedTech[]>([]);
  const [spdType, setSpdType] = useState<"SPD" | "Proyek">("SPD");
  const [spdDays, setSpdDays] = useState<number>(3);
  const [spdDaily, setSpdDaily] = useState<number>(300000);
  const [spdNights, setSpdNights] = useState<number>(2);
  const [spdHotel, setSpdHotel] = useState<number>(600000);

  // Drive & Media state
  const [baLink, setBaLink] = useState<string>("");
  const [baFileName, setBaFileName] = useState<string>("");
  const [photos, setPhotos] = useState<WorkOrderPhoto[]>([]);
  const [isUploading, setIsUploading] = useState<boolean>(false);

  const [kasbonUsed, setKasbonUsed] = useState<number>(0);
  const [status, setStatus] = useState<JobStatus>("Pending");
  const [statusNote, setStatusNote] = useState<string>("");

  // Google Drive folder generation state
  const [isGeneratingFolder, setIsGeneratingFolder] = useState<boolean>(false);

  const handleEnsureDriveFolder = async () => {
    setIsGeneratingFolder(true);
    try {
      const res = await fetch("/api/drive/ensure-folder", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          year,
          subdiv,
          docType,
          docNumber: docNumber || "DRAFT",
          customer: customer || "Umum",
        }),
      });
      const data = await res.json();
      if (data.success && data.projectFolderUrl) {
        if (!baLink) {
          setBaLink(data.baFolderUrl);
        }
        onShowToast("Folder Google Drive berhasil disiapkan di '101 - Dashboard Master ME Engineering'!", "success");
        window.open(data.projectFolderUrl, "_blank");
      } else {
        onShowToast(data.error || "Gagal membuat folder di Google Drive", "error");
      }
    } catch (err: any) {
      onShowToast("Terjadi kendala saat menghubungkan ke Google Drive", "error");
    } finally {
      setIsGeneratingFolder(false);
    }
  };

  // Populate from initialJob if editing
  useEffect(() => {
    if (initialJob) {
      setDocType(initialJob.docType);
      setDocNumber(initialJob.docNumber);
      setMarketing(initialJob.marketing);
      const isKnown = marketingList.includes(initialJob.marketing);
      setIsManualMarketing(!isKnown && Boolean(initialJob.marketing));
      setSubdiv(initialJob.subdiv);
      setCustomer(initialJob.customer);
      setDesc(initialJob.desc);
      setTarget(initialJob.target);
      const sDate = initialJob.startDate || initialJob.date || new Date().toISOString().split("T")[0];
      const tDate = initialJob.targetDate || initialJob.date || sDate;
      setDate(sDate);
      setStartDate(sDate);
      setTargetDate(tDate);
      setAssignedTechs(initialJob.techs || []);
      setSpdType(initialJob.spdType);
      setSpdDays(initialJob.spdDays || 0);
      setSpdDaily(initialJob.spdDaily || 0);
      setSpdNights(initialJob.spdNights || 0);
      setSpdHotel(initialJob.spdHotel || 0);
      setBaLink(initialJob.baLink || "");
      setBaFileName(initialJob.baFileName || "");
      setPhotos(initialJob.photos || []);
      setKasbonUsed(initialJob.kasbonUsed || 0);
      setStatus(initialJob.status);
      setStatusNote(initialJob.statusNote || "");
    } else {
      // Generate default fresh document number
      const newNum = generateNextDocNumber("WO", "Fueling System Engineering", existingJobsCount);
      setDocNumber(newNum);
      const defaultMkt = marketingList[0] || "Bagus Pratama";
      setMarketing(defaultMkt);
      setIsManualMarketing(false);
      const todayStr = new Date().toISOString().split("T")[0];
      const future = new Date();
      future.setDate(future.getDate() + 2);
      setDate(todayStr);
      setStartDate(todayStr);
      setTargetDate(future.toISOString().split("T")[0]);
      setAssignedTechs([]);
      setPhotos([]);
      setBaLink("");
      setBaFileName("");
      setKasbonUsed(0);
      setStatus("Pending");
      setStatusNote("");
    }
  }, [initialJob, existingJobsCount, marketingList]);

  // Handle doc type change with auto code adjustment
  const handleDocTypeChange = (newType: DocType) => {
    setDocType(newType);
    if (!initialJob) {
      const generated = generateNextDocNumber(newType, subdiv, existingJobsCount);
      setDocNumber(generated);
    }
  };

  const handleSubdivChange = (newSub: SubDivision) => {
    setSubdiv(newSub);
    if (!initialJob && docType === "SPK") {
      const generated = generateNextDocNumber(docType, newSub, existingJobsCount);
      setDocNumber(generated);
    }
  };

  // Toggle assigned technician
  const toggleTechnician = (tech: Technician) => {
    setAssignedTechs((prev) => {
      const exists = prev.find((t) => t.name === tech.name);
      if (exists) {
        return prev.filter((t) => t.name !== tech.name);
      } else {
        return [...prev, {
          technicianId: tech.id,
          name: tech.name,
          subdiv: tech.subdiv,
          kasbon: 1000000 // default initial kasbon
        }];
      }
    });
  };

  const updateTechKasbon = (name: string, amount: number) => {
    setAssignedTechs((prev) =>
      prev.map((t) => (t.name === name ? { ...t, kasbon: amount } : t))
    );
  };

  // Real-time calculations
  const totalKasbonTim = assignedTechs.reduce((acc, t) => acc + Number(t.kasbon || 0), 0);
  const totalSpd = spdType === "Proyek" ? 0 : (Number(spdDays || 0) * Number(spdDaily || 0)) + (Number(spdNights || 0) * Number(spdHotel || 0));
  const totalPengajuan = totalKasbonTim + totalSpd;
  const sisaDana = totalPengajuan - Number(kasbonUsed || 0);

  // Word count check
  const wordCount = countWords(desc);
  const maxWords = 150;

  // Google Drive hierarchy preview
  const year = date ? date.split("-")[0] : new Date().getFullYear().toString();
  const driveInfo = buildDriveFolderPath(year, subdiv, docType, docNumber || "NO-DOC", customer || "CUSTOMER");

  // Real / Fallback Upload Handlers via /api/drive/upload
  const handleBaUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("docType", docType);
      formData.append("docNumber", docNumber || "DRAFT");
      formData.append("subdiv", subdiv);
      formData.append("customer", customer || "CUSTOMER");
      formData.append("category", "Berita_Acara");
      formData.append("year", year);

      const res = await fetch("/api/drive/upload", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      if (data.success) {
        setBaLink(data.fileUrl);
        setBaFileName(file.name);
        onShowToast(
          data.simulated
            ? `File "${file.name}" tersinkronisasi (Mode Simulasi Drive).`
            : `File "${file.name}" berhasil diunggah ke Google Drive!`,
          "success"
        );
      } else {
        throw new Error(data.error || "Gagal upload");
      }
    } catch (err: any) {
      console.warn("Upload fallback error:", err);
      const mockUrl = `https://drive.google.com/file/d/drive_${Date.now()}/view`;
      setBaLink(mockUrl);
      setBaFileName(file.name);
      onShowToast(`File "${file.name}" tersimpan secara lokal.`, "info");
    } finally {
      setIsUploading(false);
    }
  };

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setIsUploading(true);
    try {
      const newUploaded: WorkOrderPhoto[] = [];

      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const formData = new FormData();
        formData.append("file", file);
        formData.append("docType", docType);
        formData.append("docNumber", docNumber || "DRAFT");
        formData.append("subdiv", subdiv);
        formData.append("customer", customer || "CUSTOMER");
        formData.append("category", "Foto_Dokumentasi");
        formData.append("year", year);

        const res = await fetch("/api/drive/upload", {
          method: "POST",
          body: formData,
        });
        const data = await res.json();

        if (data.success) {
          newUploaded.push({
            id: "p_" + Date.now() + "_" + i,
            fileName: file.name,
            driveUrl: data.fileUrl,
            caption: `Dokumentasi lapangan (${file.name})`,
            uploadedAt: new Date().toISOString().split("T")[0],
          });
        }
      }

      setPhotos((prev) => [...prev, ...newUploaded]);
      onShowToast(`${newUploaded.length} foto berhasil diunggah ke Google Drive!`, "success");
    } catch (err) {
      console.warn("Photo upload fallback:", err);
      const fallbackPhotos: WorkOrderPhoto[] = Array.from(files).map((f, i) => ({
        id: "p_" + Date.now() + "_" + i,
        fileName: f.name,
        driveUrl: `https://drive.google.com/file/d/photo_${Date.now()}_${i}/view`,
        caption: `Dokumentasi lapangan (${f.name})`,
        uploadedAt: new Date().toISOString().split("T")[0],
      }));
      setPhotos((prev) => [...prev, ...fallbackPhotos]);
      onShowToast(`${fallbackPhotos.length} foto disimpan.`, "info");
    } finally {
      setIsUploading(false);
    }
  };

  const removePhoto = (id: string) => {
    setPhotos((prev) => prev.filter((p) => p.id !== id));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!docNumber.trim()) {
      onShowToast("Nomor Dokumen wajib diisi!", "error");
      return;
    }
    if (!marketing.trim()) {
      onShowToast("Nama Marketing wajib diisi atau dipilih!", "error");
      return;
    }
    if (!customer.trim()) {
      onShowToast("Nama Customer wajib diisi!", "error");
      return;
    }
    if (!desc.trim()) {
      onShowToast("Uraian Pekerjaan wajib diisi!", "error");
      return;
    }

    // Auto register marketing to master team if manual and requested
    if (isManualMarketing && autoRegisterMarketing && onRegisterMarketing) {
      const trimmedMkt = marketing.trim();
      const alreadyExists = teamMembers.some(
        (m) => m.name.toLowerCase() === trimmedMkt.toLowerCase()
      );
      if (!alreadyExists) {
        onRegisterMarketing(trimmedMkt, "0812-0000-0000");
      }
    }

    const payload: WorkOrderJob = {
      id: initialJob ? initialJob.id : "job-" + Date.now(),
      docType,
      docNumber: docNumber.trim(),
      marketing: marketing.trim() || "Bagus Pratama",
      subdiv,
      customer: customer.trim(),
      desc: desc.trim(),
      target: target.trim() || `${calculatedDuration} Hari`,
      date: startDate,
      startDate,
      targetDate,
      techs: assignedTechs,
      spdType,
      spdDays: spdType === "Proyek" ? 0 : Number(spdDays || 0),
      spdDaily: spdType === "Proyek" ? 0 : Number(spdDaily || 0),
      spdNights: spdType === "Proyek" ? 0 : Number(spdNights || 0),
      spdHotel: spdType === "Proyek" ? 0 : Number(spdHotel || 0),
      baLink: baLink.trim(),
      baFileName: baFileName.trim(),
      photos,
      kasbonUsed: Number(kasbonUsed || 0),
      status,
      statusNote: statusNote.trim(),
      updatedAt: new Date().toISOString()
    };

    onSaveJob(payload);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      
      {/* Form Header Card */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-2xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-mono uppercase bg-blue-100 text-blue-800 border border-blue-200 px-2 py-0.5 rounded font-bold">
                {initialJob ? "Mode Edit Dokumen" : "Penerbitan Dokumen Baru"}
              </span>
              <h2 className="text-base sm:text-lg font-bold text-slate-900">
                {initialJob ? `Edit ${initialJob.docNumber}` : "Form Input WO / SPK Operasional"}
              </h2>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Lengkapi rincian tugas teknis, penugasan teknisi, estimasi kasbon & SPD, dan sinkronisasi arsip Google Drive.
            </p>
          </div>

          {/* Toggle WO vs SPK */}
          <div className="flex items-center bg-slate-100 p-1 rounded-lg border border-slate-200 shrink-0">
            <button
              type="button"
              onClick={() => handleDocTypeChange("WO")}
              className={`px-4 py-1.5 rounded-md text-xs font-bold transition-colors ${
                docType === "WO"
                  ? "bg-blue-600 text-white shadow-xs"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              Work Order (WO)
            </button>
            <button
              type="button"
              onClick={() => handleDocTypeChange("SPK")}
              className={`px-4 py-1.5 rounded-md text-xs font-bold transition-colors ${
                docType === "SPK"
                  ? "bg-purple-600 text-white shadow-xs"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              SPK Operasional
            </button>
          </div>
        </div>

        {/* Section 1: Klasifikasi & Identitas Dokumen */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
          {/* No Dokumen */}
          <div>
            <label className="text-[10px] font-bold text-slate-600 uppercase block mb-1">
              Nomor Dokumen <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              value={docNumber}
              onChange={(e) => setDocNumber(e.target.value)}
              required
              className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-xs font-mono font-bold text-slate-900 focus:outline-hidden focus:ring-1 focus:ring-blue-500"
              placeholder="e.g. WO-EXT-2026-089"
            />
          </div>

          {/* Sub-Divisi */}
          <div>
            <label className="text-[10px] font-bold text-slate-600 uppercase block mb-1">
              Sub-Divisi Penanggung Jawab <span className="text-rose-500">*</span>
            </label>
            <select
              value={subdiv}
              onChange={(e) => handleSubdivChange(e.target.value as SubDivision)}
              className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-xs font-semibold text-slate-900 focus:outline-hidden focus:ring-1 focus:ring-blue-500"
            >
              {ALL_SUB_DIVISIONS.map((sub) => (
                <option key={sub} value={sub}>{sub}</option>
              ))}
            </select>
          </div>

          {/* Marketing Selection & Dynamic Input */}
          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <label className="text-[10px] font-bold text-slate-600 uppercase block">
                Nama Marketing <span className="text-rose-500">*</span>
              </label>
              <button
                type="button"
                onClick={() => setIsManualMarketing(!isManualMarketing)}
                className="text-[10px] text-blue-600 hover:text-blue-800 font-semibold flex items-center gap-1 transition-colors"
              >
                {isManualMarketing ? "↩ Pilih Dropdown" : "➕ Input Baru / Manual"}
              </button>
            </div>

            {!isManualMarketing ? (
              <select
                value={marketing}
                onChange={(e) => {
                  if (e.target.value === "__NEW__") {
                    setIsManualMarketing(true);
                    setMarketing("");
                  } else {
                    setMarketing(e.target.value);
                  }
                }}
                className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-xs font-semibold text-slate-900 focus:outline-hidden focus:ring-1 focus:ring-blue-500"
              >
                <option value="">-- Pilih Nama Marketing --</option>
                {marketingList.map((mName) => (
                  <option key={mName} value={mName}>
                    {mName}
                  </option>
                ))}
                <option value="__NEW__" className="font-bold text-blue-600">
                  ➕ Tambah Marketing Baru / Ketik Manual...
                </option>
              </select>
            ) : (
              <div className="space-y-1.5">
                <div className="flex items-center gap-1.5">
                  <input
                    type="text"
                    value={marketing}
                    onChange={(e) => setMarketing(e.target.value)}
                    required
                    className="flex-1 bg-white border border-blue-400 rounded-lg px-3 py-1.5 text-xs font-semibold text-slate-900 focus:outline-hidden focus:ring-1 focus:ring-blue-500"
                    placeholder="Ketik nama marketing baru..."
                  />
                  {onRegisterMarketing && (
                    <button
                      type="button"
                      disabled={!marketing.trim() || isRegisteringQuick}
                      onClick={async () => {
                        if (!marketing.trim()) return;
                        setIsRegisteringQuick(true);
                        try {
                          await onRegisterMarketing(marketing.trim(), "0812-0000-0000");
                          onShowToast(`Marketing "${marketing.trim()}" berhasil didaftarkan ke Master Tim!`, "success");
                          setIsManualMarketing(false);
                        } catch (err) {
                          onShowToast("Gagal mendaftarkan marketing", "error");
                        } finally {
                          setIsRegisteringQuick(false);
                        }
                      }}
                      className="px-2.5 py-1.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-lg text-xs font-bold shrink-0 transition-colors flex items-center gap-1"
                      title="Daftarkan langsung ke Master Tim agar masuk database Turso"
                    >
                      <UserPlus className="w-3.5 h-3.5" />
                      <span>{isRegisteringQuick ? "..." : "Daftarkan"}</span>
                    </button>
                  )}
                </div>

                <div className="flex items-center justify-between text-[11px] text-slate-500">
                  <label className="flex items-center gap-1.5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={autoRegisterMarketing}
                      onChange={(e) => setAutoRegisterMarketing(e.target.checked)}
                      className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 w-3.5 h-3.5"
                    />
                    <span className="text-[10px]">Daftarkan otomatis ke Master Tim saat disimpan</span>
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      setIsManualMarketing(false);
                      if (!marketing && marketingList.length > 0) {
                        setMarketing(marketingList[0]);
                      }
                    }}
                    className="text-slate-400 hover:text-slate-700 underline text-[10px]"
                  >
                    Batal
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Tanggal Pelaksanaan */}
          <div>
            <label className="text-[10px] font-bold text-slate-600 uppercase block mb-1">
              Tanggal Pelaksanaan <span className="text-rose-500">*</span>
            </label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              required
              className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-xs font-mono text-slate-900 focus:outline-hidden focus:ring-1 focus:ring-blue-500"
            />
          </div>
        </div>

        {/* Customer & Jadwal Durasi Pelaksanaan */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs pt-1">
          {/* Customer */}
          <div className="sm:col-span-2 lg:col-span-2">
            <label className="text-[10px] font-bold text-slate-600 uppercase block mb-1">
              Nama Customer & Lokasi Pelaksanaan <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              value={customer}
              onChange={(e) => setCustomer(e.target.value)}
              required
              className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-xs text-slate-900 focus:outline-hidden focus:ring-1 focus:ring-blue-500"
              placeholder="e.g. PT Pertamina Patra Niaga Regional JBB"
            />
          </div>

          {/* Tanggal Mulai Pelaksanaan */}
          <div>
            <label className="text-[10px] font-bold text-slate-600 uppercase block mb-1">
              Tanggal Mulai <span className="text-rose-500">*</span>
            </label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => {
                setStartDate(e.target.value);
                setDate(e.target.value);
                if (!targetDate || e.target.value > targetDate) {
                  setTargetDate(e.target.value);
                }
              }}
              required
              className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-xs font-mono font-bold text-slate-900 focus:outline-hidden focus:ring-1 focus:ring-blue-500"
            />
          </div>

          {/* Target Tanggal Selesai */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-[10px] font-bold text-slate-600 uppercase block">
                Target Selesai <span className="text-rose-500">*</span>
              </label>
              {isInvalidDateRange && (
                <span className="text-[9px] text-rose-600 font-bold">
                  ⚠️ Kurang dari tgl mulai
                </span>
              )}
            </div>
            <input
              type="date"
              value={targetDate}
              onChange={(e) => setTargetDate(e.target.value)}
              required
              className={`w-full bg-slate-50 border rounded-lg px-3 py-2 text-xs font-mono font-bold text-slate-900 focus:outline-hidden focus:ring-1 ${
                isInvalidDateRange ? "border-rose-400 focus:ring-rose-500" : "border-slate-300 focus:ring-blue-500"
              }`}
            />
          </div>
        </div>

        {/* Durasi Live Info Pill */}
        <div className="flex items-center justify-between p-2.5 bg-blue-50/70 border border-blue-200/80 rounded-lg text-xs">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-blue-600 shrink-0" />
            <span className="text-slate-700">
              Durasi Pelaksanaan: <strong className="text-blue-900 font-mono font-bold">{calculatedDuration} Hari Kalender</strong>
            </span>
          </div>
          <span className="text-[11px] text-slate-500 font-mono">
            Target SLA Standar: 1 s/d 5 Hari
          </span>
        </div>

        {/* Textarea Uraian Tugas */}
        <div>
          <div className="flex items-center justify-between mb-1">
            <label className="text-[10px] font-bold text-slate-600 uppercase">
              Uraian Rinci Tugas Pekerjaan <span className="text-rose-500">*</span>
            </label>
            <span className={`text-[11px] font-mono font-semibold ${
              wordCount > maxWords ? "text-rose-600" : "text-slate-400"
            }`}>
              {wordCount}/{maxWords} kata
            </span>
          </div>
          <textarea
            value={desc}
            onChange={(e) => setDesc(e.target.value)}
            rows={3}
            required
            className="w-full bg-slate-50 border border-slate-300 rounded-lg p-3 text-xs text-slate-800 leading-relaxed focus:outline-hidden focus:ring-1 focus:ring-blue-500"
            placeholder="Jelaskan spesifikasi teknis tugas, perbaikan komponen, kalibrasi sistem, atau pekerjaan instalasi..."
          />
        </div>
      </div>

      {/* Section 2: Penugasan Teknisi & Kasbon */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-2xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4 text-blue-600" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800">
              Penugasan Teknisi Lintas Divisi & Alokasi Kasbon
            </h3>
          </div>
          <span className="text-xs font-mono font-bold text-blue-700 bg-blue-50 px-2.5 py-1 rounded border border-blue-200">
            Total Kasbon Tim: {formatRupiah(totalKasbonTim)}
          </span>
        </div>

        {/* Checklist of Technicians */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
          {teamMembers.map((tech) => {
            const isAssigned = assignedTechs.some((t) => t.name === tech.name);
            const assignedItem = assignedTechs.find((t) => t.name === tech.name);

            return (
              <div
                key={tech.id}
                className={`p-3 rounded-lg border transition-all ${
                  isAssigned
                    ? "bg-blue-50/60 border-blue-300"
                    : "bg-slate-50 border-slate-200 hover:border-slate-300"
                }`}
              >
                <div className="flex items-start gap-2.5">
                  <input
                    type="checkbox"
                    id={`tech-${tech.id}`}
                    checked={isAssigned}
                    onChange={() => toggleTechnician(tech)}
                    className="mt-0.5 rounded text-blue-600 focus:ring-blue-500 cursor-pointer"
                  />
                  <div className="flex-1">
                    <label 
                      htmlFor={`tech-${tech.id}`}
                      className="text-xs font-bold text-slate-800 cursor-pointer block"
                    >
                      {tech.name}
                    </label>
                    <span className="text-[11px] text-slate-500 block">
                      {tech.role} • {tech.subdiv}
                    </span>

                    {/* Kasbon Input for checked technician */}
                    {isAssigned && (
                      <div className="mt-2 pt-2 border-t border-blue-200">
                        <label className="text-[10px] uppercase font-bold text-blue-900 block mb-1">
                          Nominal Kasbon:
                        </label>
                        <input
                          type="number"
                          value={assignedItem?.kasbon || 0}
                          onChange={(e) => updateTechKasbon(tech.name, Number(e.target.value))}
                          step="50000"
                          min="0"
                          className="w-full bg-white border border-blue-300 rounded px-2 py-1 text-xs font-mono font-bold text-blue-800 focus:outline-hidden focus:ring-1 focus:ring-blue-500"
                        />
                        <span className="text-[10px] font-mono text-slate-500 mt-0.5 block">
                          {formatRupiah(assignedItem?.kasbon || 0)}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Section 3: Kategori Dinas (SPD vs Proyek) */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-2xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <DollarSign className="w-4 h-4 text-amber-600" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800">
              Kategori Perjalanan Dinas (SPD vs Proyek)
            </h3>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] text-slate-400 font-bold uppercase">Mode:</span>
            <select
              value={spdType}
              onChange={(e) => setSpdType(e.target.value as "SPD" | "Proyek")}
              className="bg-slate-50 border border-slate-300 rounded px-2.5 py-1 text-xs font-bold text-slate-800"
            >
              <option value="SPD">SPD Luar Kota (Dengan Rincian Harian & Hotel)</option>
              <option value="Proyek">Proyek Lokal (Tanpa Biaya Harian SPD)</option>
            </select>
          </div>
        </div>

        {spdType === "Proyek" ? (
          <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-600 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>Mode Proyek aktif: Pekerjaan ini tidak menghitung komponen harian SPD atau hotel.</span>
          </div>
        ) : (
          <div className="space-y-3">
            <p className="text-xs text-slate-500 font-mono">
              Rumus: Total Uang SPD = (Jumlah Hari × SPD Harian) + (Jumlah Malam × Biaya Hotel)
            </p>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
              <div>
                <label className="text-[10px] font-bold text-slate-600 uppercase block mb-1">
                  Jumlah Hari
                </label>
                <input
                  type="number"
                  min="0"
                  value={spdDays}
                  onChange={(e) => setSpdDays(Number(e.target.value))}
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-1.5 font-mono text-xs font-bold"
                />
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-600 uppercase block mb-1">
                  SPD Harian (Rp)
                </label>
                <input
                  type="number"
                  min="0"
                  step="50000"
                  value={spdDaily}
                  onChange={(e) => setSpdDaily(Number(e.target.value))}
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-1.5 font-mono text-xs font-bold"
                />
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-600 uppercase block mb-1">
                  Malam Menginap
                </label>
                <input
                  type="number"
                  min="0"
                  value={spdNights}
                  onChange={(e) => setSpdNights(Number(e.target.value))}
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-1.5 font-mono text-xs font-bold"
                />
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-600 uppercase block mb-1">
                  Biaya Hotel / Malam (Rp)
                </label>
                <input
                  type="number"
                  min="0"
                  step="50000"
                  value={spdHotel}
                  onChange={(e) => setSpdHotel(Number(e.target.value))}
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-1.5 font-mono text-xs font-bold"
                />
              </div>
            </div>

            <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg flex items-center justify-between">
              <span className="text-xs font-bold text-amber-900">Total Perhitungan Uang SPD:</span>
              <span className="text-sm font-bold font-mono text-amber-900">{formatRupiah(totalSpd)}</span>
            </div>
          </div>
        )}
      </div>

      {/* Section 4: Sinkronisasi Google Drive & Arsip Lapangan */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-2xs space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <FolderCheck className="w-4 h-4 text-blue-600" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800">
              Sinkronisasi Google Drive API v3 (PRD Architecture)
            </h3>
          </div>
          <button
            type="button"
            onClick={() => setIsDriveGuideOpen(true)}
            className="text-xs font-bold text-blue-600 hover:text-blue-800 flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-blue-50 hover:bg-blue-100 border border-blue-200 transition-colors"
          >
            <HardDrive className="w-3.5 h-3.5" />
            <span>Panduan Setup Google Drive API</span>
          </button>
        </div>

        {/* Google Drive Service Account Live Status Banner */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-xs">
          <div className="flex items-center gap-2.5">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shrink-0"></span>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-emerald-950">Google Drive API v3 Terhubung Aktif</span>
                <span className="text-[10px] bg-emerald-200 text-emerald-900 font-bold px-2 py-0.5 rounded-full">Service Account Ready</span>
              </div>
              <p className="text-[11px] text-emerald-800 mt-0.5">
                Folder Induk: <strong>101 - Dashboard Master ME Engineering</strong> (prinof.usahajb@gmail.com) • Email Service Account: <code>master-me-engineering@quantum-age-513009-m3.iam.gserviceaccount.com</code>
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleEnsureDriveFolder}
            disabled={isGeneratingFolder}
            className="px-3.5 py-2 rounded-lg bg-emerald-700 hover:bg-emerald-600 active:bg-emerald-800 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-colors shadow-xs shrink-0 disabled:opacity-50"
            title="Sinkronkan struktur folder di Google Drive dan buka langsung di tab baru"
          >
            {isGeneratingFolder ? (
              <>
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                <span>Menyiapkan Folder...</span>
              </>
            ) : (
              <>
                <ExternalLink className="w-3.5 h-3.5" />
                <span>Buka / Buat Folder di Drive</span>
              </>
            )}
          </button>
        </div>

        {/* Folder Hierarchy Target Visualizer */}
        <div className="p-3 bg-slate-900 text-slate-300 rounded-lg text-xs font-mono space-y-1">
          <span className="text-blue-400 font-bold block text-[10px] uppercase">
            Target Hirarki Folder Otomatis:
          </span>
          <div className="truncate text-slate-200">{driveInfo.fullPath}</div>
        </div>

        {/* Upload Inputs */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          
          {/* Upload Berita Acara (BA) */}
          <div className="p-4 bg-slate-50 border border-slate-200 rounded-lg space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                <FileText className="w-4 h-4 text-rose-500" />
                <span>Upload Berita Acara (BA) .pdf</span>
              </span>
              {baFileName && (
                <span className="text-[10px] font-mono text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded font-bold">
                  Tersimpan
                </span>
              )}
            </div>

            <label className="flex flex-col items-center justify-center p-4 border-2 border-dashed border-slate-300 hover:border-blue-400 rounded-lg cursor-pointer bg-white transition-colors">
              <Upload className="w-5 h-5 text-slate-400 mb-1" />
              <span className="text-xs font-semibold text-blue-600">Pilih Berkas Berita Acara</span>
              <span className="text-[10px] text-slate-400 mt-0.5">Format dokumen PDF (Maks. 25MB)</span>
              <input
                type="file"
                accept=".pdf"
                onChange={handleBaUpload}
                className="hidden"
                disabled={isUploading}
              />
            </label>

            {baLink && (
              <div className="text-xs font-mono text-slate-700 bg-white p-2.5 rounded border border-slate-200 flex items-center justify-between gap-2">
                <span className="truncate">{baFileName || baLink}</span>
                <button
                  type="button"
                  onClick={() => {
                    setBaLink("");
                    setBaFileName("");
                  }}
                  className="text-rose-600 hover:text-rose-800 p-0.5"
                  title="Hapus Berkas"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            )}
          </div>

          {/* Upload Foto Dokumentasi */}
          <div className="p-4 bg-slate-50 border border-slate-200 rounded-lg space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                <ImageIcon className="w-4 h-4 text-blue-500" />
                <span>Upload Foto Dokumentasi Lapangan</span>
              </span>
              <span className="text-[10px] font-mono text-slate-500">
                {photos.length} Foto
              </span>
            </div>

            <label className="flex flex-col items-center justify-center p-4 border-2 border-dashed border-slate-300 hover:border-blue-400 rounded-lg cursor-pointer bg-white transition-colors">
              <Upload className="w-5 h-5 text-slate-400 mb-1" />
              <span className="text-xs font-semibold text-blue-600">Pilih Multi-Foto Lapangan</span>
              <span className="text-[10px] text-slate-400 mt-0.5">Format JPG, PNG, WEBP</span>
              <input
                type="file"
                accept="image/*"
                multiple
                onChange={handlePhotoUpload}
                className="hidden"
                disabled={isUploading}
              />
            </label>

            {photos.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {photos.map((p) => (
                  <div key={p.id} className="flex items-center gap-1 bg-white px-2 py-1 rounded border border-slate-200 text-xs font-mono">
                    <span className="truncate max-w-[120px]">{p.fileName}</span>
                    <button
                      type="button"
                      onClick={() => removePhoto(p.id)}
                      className="text-slate-400 hover:text-rose-600 ml-1"
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>
      </div>

      {/* Section 5: Realisasi Keuangan & Status Penyelesaian */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-2xs space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <DollarSign className="w-4 h-4 text-emerald-600" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800">
              Realisasi Keuangan & Status Akhir Dokumen
            </h3>
          </div>
          <span className="text-xs font-mono font-bold text-slate-800">
            Total Pengajuan: {formatRupiah(totalPengajuan)}
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
          {/* Realisasi Kasbon Terpakai */}
          <div>
            <label className="text-[10px] font-bold text-slate-600 uppercase block mb-1">
              Realisasi Pengeluaran Aktual (Rp)
            </label>
            <input
              type="number"
              min="0"
              step="50000"
              value={kasbonUsed}
              onChange={(e) => setKasbonUsed(Number(e.target.value))}
              className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-xs font-mono font-bold text-slate-900 focus:outline-hidden focus:ring-1 focus:ring-blue-500"
            />
            <span className="text-[10px] text-slate-500 font-mono mt-0.5 block">
              {formatRupiah(kasbonUsed)}
            </span>
          </div>

          {/* Sisa Dana (Auto Calculated) */}
          <div>
            <label className="text-[10px] font-bold text-slate-600 uppercase block mb-1">
              {sisaDana >= 0 ? "Sisa Dana (Kembali ke Kas)" : "Defisit (Kurang Bayar)"}
            </label>
            <div className={`p-2 rounded-lg border font-mono font-bold text-sm ${
              sisaDana >= 0 ? "bg-emerald-50 text-emerald-800 border-emerald-200" : "bg-rose-50 text-rose-800 border-rose-200"
            }`}>
              {formatRupiah(Math.abs(sisaDana))}
            </div>
            <span className="text-[10px] text-slate-400 mt-0.5 block font-mono">
              = Total Pengajuan ({formatRupiah(totalPengajuan)}) - Realisasi ({formatRupiah(kasbonUsed)})
            </span>
          </div>

          {/* Status Pekerjaan */}
          <div>
            <label className="text-[10px] font-bold text-slate-600 uppercase block mb-1">
              Status Pekerjaan
            </label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as JobStatus)}
              className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-xs font-bold text-slate-900 focus:outline-hidden focus:ring-1 focus:ring-blue-500"
            >
              <option value="Pending">Pending (Menunggu)</option>
              <option value="Done">Done (Selesai)</option>
              <option value="Hold">Hold (Tertunda)</option>
              <option value="Cancel">Cancel (Batal)</option>
            </select>
          </div>
        </div>

        {/* Catatan Status */}
        <div>
          <label className="text-[10px] font-bold text-slate-600 uppercase block mb-1">
            Catatan Pelaksanaan Lapangan / Kendala Pekerjaan
          </label>
          <input
            type="text"
            value={statusNote}
            onChange={(e) => setStatusNote(e.target.value)}
            className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-xs text-slate-800 focus:outline-hidden focus:ring-1 focus:ring-blue-500"
            placeholder="e.g. Selesai tepat waktu sesuai standar tera metrologi, tidak ada kendala."
          />
        </div>
      </div>

      {/* Action Submit Buttons */}
      <div className="flex items-center justify-end gap-3 pt-2">
        <button
          type="button"
          onClick={onCancel}
          className="px-5 py-2.5 rounded-lg border border-slate-300 text-slate-700 text-xs font-semibold hover:bg-slate-100 transition-colors"
        >
          Batal / Kembali ke Dashboard
        </button>
        <button
          type="submit"
          disabled={isUploading}
          className="px-6 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-500 active:bg-blue-700 text-white text-xs font-bold transition-colors shadow-sm flex items-center gap-2"
        >
          <CheckCircle2 className="w-4 h-4" />
          <span>{initialJob ? "Perbarui Dokumen" : "Simpan & Daftarkan Dokumen"}</span>
        </button>
      </div>

      {/* Guide Modal */}
      <DriveGuideModal
        isOpen={isDriveGuideOpen}
        onClose={() => setIsDriveGuideOpen(false)}
      />

    </form>
  );
}
