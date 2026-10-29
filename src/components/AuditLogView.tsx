"use client";

import React, { useState, useEffect, useMemo } from "react";
import { 
  ShieldCheck, 
  Search, 
  RefreshCw, 
  Download, 
  Filter, 
  LogIn, 
  LogOut, 
  AlertTriangle, 
  FileText, 
  Users, 
  UserCheck, 
  KeyRound, 
  Activity, 
  Calendar,
  Clock,
  Laptop,
  CheckCircle2,
  RotateCcw,
  X,
  SlidersHorizontal
} from "lucide-react";
import { AuditLogItem, AuthUser } from "@/types";

interface AuditLogViewProps {
  currentUser: AuthUser;
}

export function AuditLogView({ currentUser }: AuditLogViewProps) {
  const isSuperAdmin = Boolean(
    currentUser?.role?.toLowerCase().replace(/[\s_-]/g, "") === "superadmin" ||
    currentUser?.isRoot ||
    currentUser?.username === "admin" ||
    currentUser?.username === "root"
  );

  type TimePreset = "ALL" | "TODAY" | "24H" | "7D" | "30D" | "CUSTOM";

  const getTodayDateString = () => {
    const now = new Date();
    const y = now.getFullYear();
    const m = String(now.getMonth() + 1).padStart(2, "0");
    const d = String(now.getDate()).padStart(2, "0");
    return `${y}-${m}-${d}`;
  };

  const [logs, setLogs] = useState<AuditLogItem[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [selectedCategory, setSelectedCategory] = useState<string>("ALL");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [isExporting, setIsExporting] = useState<boolean>(false);

  // Date and Time Filter State
  const [timePreset, setTimePreset] = useState<TimePreset>("ALL");
  const [startDate, setStartDate] = useState<string>(getTodayDateString());
  const [startTime, setStartTime] = useState<string>("00:00");
  const [endDate, setEndDate] = useState<string>(getTodayDateString());
  const [endTime, setEndTime] = useState<string>("23:59");
  const [isCustomTimeOpen, setIsCustomTimeOpen] = useState<boolean>(false);

  const getTimeRange = (
    preset: TimePreset,
    sDate?: string,
    sTime?: string,
    eDate?: string,
    eTime?: string
  ) => {
    const now = new Date();

    if (preset === "ALL") {
      return { from: undefined, to: undefined, label: "Semua Waktu" };
    }

    if (preset === "TODAY") {
      const start = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
      const end = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
      return {
        from: start.toISOString(),
        to: end.toISOString(),
        label: `Hari Ini (${now.toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" })})`
      };
    }

    if (preset === "24H") {
      const start = new Date(now.getTime() - 24 * 60 * 60 * 1000);
      return {
        from: start.toISOString(),
        to: now.toISOString(),
        label: "24 Jam Terakhir"
      };
    }

    if (preset === "7D") {
      const start = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      return {
        from: start.toISOString(),
        to: now.toISOString(),
        label: "7 Hari Terakhir"
      };
    }

    if (preset === "30D") {
      const start = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      return {
        from: start.toISOString(),
        to: now.toISOString(),
        label: "30 Hari Terakhir"
      };
    }

    if (preset === "CUSTOM") {
      if (!sDate && !eDate) {
        return { from: undefined, to: undefined, label: "Kustom (Belum Ditentukan)" };
      }
      let fromIso: string | undefined = undefined;
      let toIso: string | undefined = undefined;
      const labelParts: string[] = [];

      if (sDate) {
        const timePart = sTime || "00:00";
        const d = new Date(`${sDate}T${timePart}:00`);
        if (!isNaN(d.getTime())) {
          fromIso = d.toISOString();
          labelParts.push(`Mulai: ${sDate} ${timePart} WIB`);
        }
      }

      if (eDate) {
        const timePart = eTime || "23:59";
        const d = new Date(`${eDate}T${timePart}:59.999`);
        if (!isNaN(d.getTime())) {
          toIso = d.toISOString();
          labelParts.push(`Hingga: ${eDate} ${timePart} WIB`);
        }
      }

      return {
        from: fromIso,
        to: toIso,
        label: labelParts.join(" • ") || "Rentang Waktu Kustom"
      };
    }

    return { from: undefined, to: undefined, label: "Semua Waktu" };
  };

  const fetchLogs = async (
    overridePreset?: TimePreset,
    customParams?: { sDate?: string; sTime?: string; eDate?: string; eTime?: string }
  ) => {
    if (!isSuperAdmin) return;
    setIsLoading(true);
    try {
      const activePreset = overridePreset !== undefined ? overridePreset : timePreset;
      const sD = customParams?.sDate !== undefined ? customParams.sDate : startDate;
      const sT = customParams?.sTime !== undefined ? customParams.sTime : startTime;
      const eD = customParams?.eDate !== undefined ? customParams.eDate : endDate;
      const eT = customParams?.eTime !== undefined ? customParams.eTime : endTime;

      const params = new URLSearchParams();
      if (selectedCategory !== "ALL") {
        params.append("category", selectedCategory);
      }
      if (searchQuery.trim()) {
        params.append("search", searchQuery.trim());
      }

      const range = getTimeRange(activePreset, sD, sT, eD, eT);
      if (range.from) params.append("from", range.from);
      if (range.to) params.append("to", range.to);

      params.append("limit", "500");

      const res = await fetch(`/api/audit-logs?${params.toString()}`);
      const data = await res.json();
      if (res.ok && data.success && Array.isArray(data.data)) {
        setLogs(data.data);
      }
    } catch (err) {
      console.error("Fetch audit logs error:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [selectedCategory]);

  const handleSelectPreset = (preset: TimePreset) => {
    setTimePreset(preset);
    if (preset === "CUSTOM") {
      setIsCustomTimeOpen(true);
    } else {
      setIsCustomTimeOpen(false);
      fetchLogs(preset);
    }
  };

  const handleApplyCustomTime = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setTimePreset("CUSTOM");
    fetchLogs("CUSTOM", { sDate: startDate, sTime: startTime, eDate: endDate, eTime: endTime });
  };

  const handleResetTimeFilter = () => {
    setTimePreset("ALL");
    const today = getTodayDateString();
    setStartDate(today);
    setStartTime("00:00");
    setEndDate(today);
    setEndTime("23:59");
    setIsCustomTimeOpen(false);
    fetchLogs("ALL");
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchLogs();
  };

  // KPI Metrics Calculation
  const metrics = useMemo(() => {
    const total = logs.length;
    const loginCount = logs.filter((l) => l.action === "LOGIN" || l.action === "LOGOUT").length;
    const woCount = logs.filter((l) => l.category === "WORK_ORDER").length;
    const userCount = logs.filter((l) => l.category === "USER_MANAGEMENT").length;
    return { total, loginCount, woCount, userCount };
  }, [logs]);

  // Export to CSV
  const handleExportCsv = () => {
    setIsExporting(true);
    try {
      const headers = [
        "ID Log",
        "Waktu (WIB)",
        "Username",
        "Nama User",
        "Role",
        "Kategori",
        "Aksi",
        "Keterangan Detail",
        "Alamat IP"
      ];

      const rows = logs.map((l) => [
        `"${l.id}"`,
        `"${new Date(l.createdAt).toLocaleString("id-ID")}"`,
        `"${l.username}"`,
        `"${l.userName}"`,
        `"${l.userRole}"`,
        `"${l.category}"`,
        `"${l.action}"`,
        `"${(l.details || "").replace(/"/g, '""')}"`,
        `"${l.ipAddress || "-"}"`
      ]);

      const csvContent = "\uFEFF" + [headers.join(","), ...rows.map((r) => r.join(","))].join("\r\n");
      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      const dateStr = new Date().toISOString().split("T")[0];
      link.href = url;
      link.setAttribute("download", `audit_log_system_${dateStr}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error("Export audit log CSV error:", err);
    } finally {
      setIsExporting(false);
    }
  };

  // Helper for action badges
  const getActionBadge = (action: string) => {
    switch (action) {
      case "LOGIN":
        return {
          icon: <LogIn className="w-3.5 h-3.5 text-emerald-600" />,
          label: "Login Masuk",
          className: "bg-emerald-50 text-emerald-700 border-emerald-200"
        };
      case "LOGOUT":
        return {
          icon: <LogOut className="w-3.5 h-3.5 text-slate-600" />,
          label: "Logout",
          className: "bg-slate-100 text-slate-700 border-slate-200"
        };
      case "LOGIN_FAILED":
        return {
          icon: <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />,
          label: "Gagal Login",
          className: "bg-rose-50 text-rose-700 border-rose-200"
        };
      case "CREATE_JOB":
        return {
          icon: <FileText className="w-3.5 h-3.5 text-blue-600" />,
          label: "Buat WO/SPK",
          className: "bg-blue-50 text-blue-700 border-blue-200"
        };
      case "UPDATE_JOB":
        return {
          icon: <FileText className="w-3.5 h-3.5 text-indigo-600" />,
          label: "Update WO/SPK",
          className: "bg-indigo-50 text-indigo-700 border-indigo-200"
        };
      case "DELETE_JOB":
        return {
          icon: <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />,
          label: "Hapus WO/SPK",
          className: "bg-rose-50 text-rose-700 border-rose-200"
        };
      case "UPDATE_STATUS":
        return {
          icon: <RefreshCw className="w-3.5 h-3.5 text-amber-600" />,
          label: "Ubah Status",
          className: "bg-amber-50 text-amber-700 border-amber-200"
        };
      case "CREATE_MEMBER":
      case "UPDATE_MEMBER":
      case "DELETE_MEMBER":
        return {
          icon: <Users className="w-3.5 h-3.5 text-cyan-600" />,
          label: "Master Tim",
          className: "bg-cyan-50 text-cyan-700 border-cyan-200"
        };
      case "CREATE_USER":
      case "UPDATE_USER":
      case "DELETE_USER":
        return {
          icon: <UserCheck className="w-3.5 h-3.5 text-purple-600" />,
          label: "Kelola User",
          className: "bg-purple-50 text-purple-700 border-purple-200"
        };
      case "UPDATE_PROFILE":
        return {
          icon: <KeyRound className="w-3.5 h-3.5 text-blue-600" />,
          label: "Ubah Profil",
          className: "bg-blue-50 text-blue-700 border-blue-200"
        };
      default:
        return {
          icon: <Activity className="w-3.5 h-3.5 text-slate-600" />,
          label: action,
          className: "bg-slate-100 text-slate-700 border-slate-200"
        };
    }
  };

  if (!isSuperAdmin) {
    return (
      <div className="w-full px-3 sm:px-6 lg:px-8 xl:px-10 py-16 text-center">
        <div className="max-w-md mx-auto p-8 bg-white rounded-2xl border border-slate-200 shadow-sm text-center">
          <div className="w-12 h-12 rounded-2xl bg-amber-100 text-amber-600 flex items-center justify-center mx-auto mb-3">
            <AlertTriangle className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-slate-900">Akses Terbatas: Khusus Superadmin</h3>
          <p className="text-xs text-slate-500 mt-1">
            Menu dan rekaman Audit Log hanya dapat diakses oleh akun dengan wewenang Superadmin.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-5 animate-in fade-in duration-200">
      
      {/* Top Banner / Title */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-850 to-slate-900 text-white rounded-2xl p-5 sm:p-6 border border-slate-800 shadow-md flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-purple-600 to-indigo-600 flex items-center justify-center text-white shadow-lg shrink-0">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base sm:text-lg font-bold text-white tracking-tight">
                Audit Log & Jejak Aktivitas Sistem
              </h2>
              <span className="text-[10px] font-mono bg-purple-500/20 text-purple-300 border border-purple-500/30 px-2 py-0.5 rounded font-bold uppercase">
                Superadmin Only
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Pantau siapa melakukan apa, aktivitas login pengguna, dan rekaman perubahan data secara real-time.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-start md:self-auto">
          <button
            type="button"
            onClick={() => fetchLogs()}
            disabled={isLoading}
            className="flex items-center gap-1.5 px-3 py-2 bg-slate-800 hover:bg-slate-700 active:bg-slate-900 text-slate-200 text-xs font-semibold rounded-xl border border-slate-700 transition-colors cursor-pointer"
            title="Muat ulang log"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? "animate-spin text-blue-400" : ""}`} />
            <span>Segarkan</span>
          </button>

          <button
            type="button"
            onClick={handleExportCsv}
            disabled={isExporting || logs.length === 0}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-blue-600 hover:bg-blue-500 active:bg-blue-700 text-white text-xs font-semibold rounded-xl shadow-xs transition-colors cursor-pointer disabled:opacity-50"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Ekspor CSV</span>
          </button>
        </div>
      </div>

      {/* KPI Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        
        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-[11px] font-bold uppercase tracking-wider">Total Aktivitas</span>
            <Activity className="w-4 h-4 text-blue-600" />
          </div>
          <div className="text-xl sm:text-2xl font-bold font-mono text-slate-900">
            {metrics.total}
          </div>
          <span className="text-[11px] text-slate-400 font-medium">Rekaman tersimpan di Turso DB</span>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-[11px] font-bold uppercase tracking-wider">Aktivitas Login & Sesi</span>
            <LogIn className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-xl sm:text-2xl font-bold font-mono text-emerald-700">
            {metrics.loginCount}
          </div>
          <span className="text-[11px] text-slate-400 font-medium">Login & logout pengguna</span>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-[11px] font-bold uppercase tracking-wider">Operasional WO/SPK</span>
            <FileText className="w-4 h-4 text-indigo-600" />
          </div>
          <div className="text-xl sm:text-2xl font-bold font-mono text-indigo-700">
            {metrics.woCount}
          </div>
          <span className="text-[11px] text-slate-400 font-medium">Buat, edit & ubah status</span>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-[11px] font-bold uppercase tracking-wider">Manajemen User</span>
            <UserCheck className="w-4 h-4 text-purple-600" />
          </div>
          <div className="text-xl sm:text-2xl font-bold font-mono text-purple-700">
            {metrics.userCount}
          </div>
          <span className="text-[11px] text-slate-400 font-medium">Tambah user, profil, password</span>
        </div>

      </div>

      {/* Date & Time Filter Card */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-2xs space-y-3">
        {/* Header row: Title & Quick Presets */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 pb-2.5 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-blue-50 border border-blue-200/60 text-blue-600 flex items-center justify-center shrink-0 shadow-2xs">
              <Calendar className="w-4 h-4" />
            </div>
            <div>
              <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                <span>Filter Tanggal & Jam</span>
                <span className="text-[10px] font-mono font-medium text-slate-400 bg-slate-100 px-1.5 py-0.2 rounded">
                  WIB (UTC+7)
                </span>
              </span>
              <p className="text-[11px] text-slate-500">
                Saring rekaman aktivitas sistem berdasarkan rentang waktu atau jam kejadian tertentu
              </p>
            </div>
          </div>

          {/* Quick Preset Buttons */}
          <div className="flex items-center gap-1.5 flex-wrap">
            {[
              { id: "ALL", label: "Semua Waktu" },
              { id: "TODAY", label: "Hari Ini" },
              { id: "24H", label: "24 Jam Terakhir" },
              { id: "7D", label: "7 Hari Terakhir" },
              { id: "30D", label: "30 Hari Terakhir" },
              { id: "CUSTOM", label: "Kustom Tanggal & Jam" }
            ].map((p) => (
              <button
                key={p.id}
                type="button"
                onClick={() => handleSelectPreset(p.id as TimePreset)}
                className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
                  timePreset === p.id
                    ? "bg-blue-600 text-white shadow-xs"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200/80 hover:text-slate-900"
                }`}
              >
                {p.id === "CUSTOM" && <SlidersHorizontal className="w-3 h-3" />}
                <span>{p.label}</span>
              </button>
            ))}

            {timePreset !== "ALL" && (
              <button
                type="button"
                onClick={handleResetTimeFilter}
                className="px-2 py-1 text-xs font-semibold text-rose-600 hover:bg-rose-50 rounded-lg transition-colors flex items-center gap-1 cursor-pointer"
                title="Reset filter waktu ke Semua Waktu"
              >
                <RotateCcw className="w-3 h-3" />
                <span>Reset</span>
              </button>
            )}
          </div>
        </div>

        {/* Custom Date & Time Inputs Panel (Expands when Kustom selected) */}
        {(isCustomTimeOpen || timePreset === "CUSTOM") && (
          <form onSubmit={handleApplyCustomTime} className="bg-slate-50/80 border border-slate-200 rounded-xl p-3.5 space-y-3 animate-in fade-in duration-150">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
              
              {/* Dari (Start Date & Time) */}
              <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-2xs">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[11px] font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-blue-600" />
                    Waktu Mulai (Dari)
                  </span>
                  <span className="text-[10px] text-slate-400 font-mono">WIB</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <div>
                    <label className="text-[10px] text-slate-500 block mb-1 font-medium">Tanggal Mulai</label>
                    <input
                      type="date"
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                      required
                      className="w-full bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs text-slate-900 font-medium focus:bg-white focus:outline-hidden focus:border-blue-600"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-slate-500 block mb-1 font-medium flex items-center gap-1">
                      <Clock className="w-3 h-3 text-slate-400" /> Jam Mulai (HH:mm)
                    </label>
                    <input
                      type="time"
                      value={startTime}
                      onChange={(e) => setStartTime(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs text-slate-900 font-mono focus:bg-white focus:outline-hidden focus:border-blue-600"
                    />
                  </div>
                </div>
              </div>

              {/* Sampai (End Date & Time) */}
              <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-2xs">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[11px] font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-blue-600" />
                    Waktu Selesai (Sampai)
                  </span>
                  <span className="text-[10px] text-slate-400 font-mono">WIB</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <div>
                    <label className="text-[10px] text-slate-500 block mb-1 font-medium">Tanggal Selesai</label>
                    <input
                      type="date"
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                      required
                      className="w-full bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs text-slate-900 font-medium focus:bg-white focus:outline-hidden focus:border-blue-600"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-slate-500 block mb-1 font-medium flex items-center gap-1">
                      <Clock className="w-3 h-3 text-slate-400" /> Jam Selesai (HH:mm)
                    </label>
                    <input
                      type="time"
                      value={endTime}
                      onChange={(e) => setEndTime(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs text-slate-900 font-mono focus:bg-white focus:outline-hidden focus:border-blue-600"
                    />
                  </div>
                </div>
              </div>

            </div>

            {/* Form Footer Action */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-1">
              <span className="text-[11px] text-slate-500 font-medium">
                Pilih tanggal dan jam kejadian untuk mempersempit penelusuran audit log.
              </span>
              <div className="flex items-center gap-2 self-end sm:self-auto">
                <button
                  type="button"
                  onClick={handleResetTimeFilter}
                  className="px-3 py-1.5 bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 text-xs font-semibold rounded-lg transition-colors cursor-pointer"
                >
                  Bersihkan
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-blue-600 hover:bg-blue-500 active:bg-blue-700 text-white text-xs font-semibold rounded-lg shadow-xs transition-colors cursor-pointer flex items-center gap-1.5"
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Terapkan Rentang Waktu</span>
                </button>
              </div>
            </div>
          </form>
        )}

        {/* Active Time Filter Indicator Pill */}
        {timePreset !== "ALL" && (
          <div className="flex items-center justify-between bg-blue-50/70 border border-blue-200/80 rounded-xl px-3 py-2 text-xs text-blue-900 font-medium">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="w-2 h-2 rounded-full bg-blue-600 animate-pulse"></span>
              <span>
                Filter Waktu Aktif: <strong>{getTimeRange(timePreset, startDate, startTime, endDate, endTime).label}</strong>
              </span>
              <span className="text-[10px] text-blue-700 bg-blue-100/90 px-2 py-0.5 rounded-full font-mono font-bold">
                {logs.length} rekaman ditemukan
              </span>
            </div>
            <button
              type="button"
              onClick={handleResetTimeFilter}
              className="text-blue-700 hover:text-blue-950 text-xs font-bold flex items-center gap-1 cursor-pointer shrink-0 ml-2"
              title="Hapus filter waktu"
            >
              <X className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Hapus Filter</span>
            </button>
          </div>
        )}
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-white border border-slate-200 rounded-xl p-3.5 shadow-2xs flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        
        {/* Category Filter Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-1 md:pb-0">
          <Filter className="w-4 h-4 text-slate-400 shrink-0 ml-1 mr-1" />
          {[
            { id: "ALL", label: "Semua Kategori" },
            { id: "AUTH", label: "Login & Sesi" },
            { id: "WORK_ORDER", label: "Pekerjaan WO/SPK" },
            { id: "TEAM", label: "Master Tim" },
            { id: "USER_MANAGEMENT", label: "Pengguna & Profil" },
          ].map((cat) => (
            <button
              key={cat.id}
              type="button"
              onClick={() => setSelectedCategory(cat.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold shrink-0 transition-colors cursor-pointer ${
                selectedCategory === cat.id
                  ? "bg-slate-900 text-white"
                  : "bg-slate-100 hover:bg-slate-200 text-slate-600"
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {/* Search Input */}
        <form onSubmit={handleSearchSubmit} className="relative w-full md:w-72">
          <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cari user, aksi, keterangan..."
            className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-8 pr-16 py-1.5 text-xs text-slate-800 placeholder-slate-400 focus:bg-white focus:outline-hidden focus:border-blue-600 font-medium"
          />
          <button
            type="submit"
            className="absolute right-1.5 top-1/2 -translate-y-1/2 px-2 py-0.5 bg-blue-600 text-white text-[10px] font-bold rounded-lg hover:bg-blue-700"
          >
            Cari
          </button>
        </form>

      </div>

      {/* Main Audit Log Table */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50/90 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider text-[10px]">
              <tr>
                <th className="py-3 px-4">Waktu (WIB)</th>
                <th className="py-3 px-4">Pelaksana (User)</th>
                <th className="py-3 px-4">Aktivitas / Aksi</th>
                <th className="py-3 px-4">Keterangan / Detail Aktivitas</th>
                <th className="py-3 px-4 hidden xl:table-cell text-right">Perangkat / IP</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {isLoading ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-slate-400">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <div className="w-6 h-6 border-2 border-purple-600 border-t-transparent rounded-full animate-spin"></div>
                      <span className="text-xs font-mono">Mengambil data audit log dari Turso Cloud...</span>
                    </div>
                  </td>
                </tr>
              ) : logs.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-slate-400">
                    <div className="flex flex-col items-center justify-center gap-1.5">
                      <CheckCircle2 className="w-8 h-8 text-slate-300" />
                      <span className="text-sm font-semibold text-slate-600">Tidak Ada Aktivitas Ditemukan</span>
                      <span className="text-xs text-slate-400 max-w-md text-center">
                        {searchQuery || timePreset !== "ALL" || selectedCategory !== "ALL"
                          ? "Tidak ada rekaman log yang cocok dengan filter tanggal & jam, kategori, atau pencarian yang dipilih."
                          : "Aktivitas pengguna akan muncul di sini secara otomatis."}
                      </span>
                      {(timePreset !== "ALL" || selectedCategory !== "ALL" || searchQuery) && (
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedCategory("ALL");
                            setSearchQuery("");
                            handleResetTimeFilter();
                          }}
                          className="mt-2 text-xs font-semibold text-blue-600 hover:text-blue-800 underline cursor-pointer"
                        >
                          Bersihkan Semua Filter
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ) : (
                logs.map((log) => {
                  const badge = getActionBadge(log.action);
                  const dateObj = new Date(log.createdAt);
                  const formattedTime = dateObj.toLocaleDateString("id-ID", {
                    day: "numeric",
                    month: "short",
                    year: "numeric"
                  }) + " • " + dateObj.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit", second: "2-digit" }) + " WIB";

                  const roleBadgeColor =
                    log.userRole?.toLowerCase() === "superadmin"
                      ? "bg-purple-100 text-purple-700 border-purple-200"
                      : log.userRole?.toLowerCase() === "admin"
                      ? "bg-blue-100 text-blue-700 border-blue-200"
                      : "bg-emerald-100 text-emerald-700 border-emerald-200";

                  return (
                    <tr key={log.id} className="hover:bg-slate-50/70 transition-colors">
                      
                      {/* Timestamp */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <div className="flex items-center gap-1.5 text-slate-800 font-mono text-[11px] font-semibold">
                          <Clock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span>{formattedTime}</span>
                        </div>
                      </td>

                      {/* User / Pelaksana */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <div className="flex items-center gap-2.5">
                          <div className="w-7 h-7 rounded-lg bg-gradient-to-tr from-slate-700 to-slate-900 text-white font-mono font-bold text-xs flex items-center justify-center shrink-0">
                            {log.username.slice(0, 2).toUpperCase()}
                          </div>
                          <div>
                            <div className="font-bold text-slate-900 flex items-center gap-1.5">
                              <span>{log.userName || log.username}</span>
                              <span className={`text-[9px] font-bold font-mono px-1.5 py-0.2 rounded border ${roleBadgeColor}`}>
                                {log.userRole}
                              </span>
                            </div>
                            <span className="text-[11px] text-slate-400 font-mono">
                              @{log.username}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Action Badge */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <span className={`inline-flex items-center gap-1.5 text-[11px] font-bold px-2.5 py-1 rounded-lg border ${badge.className}`}>
                          {badge.icon}
                          <span>{badge.label}</span>
                        </span>
                      </td>

                      {/* Details */}
                      <td className="py-3.5 px-4">
                        <div className="text-slate-800 font-medium text-xs leading-relaxed max-w-xl">
                          {log.details}
                        </div>
                      </td>

                      {/* IP / User Agent */}
                      <td className="py-3.5 px-4 hidden xl:table-cell text-right whitespace-nowrap">
                        <div className="text-[10px] text-slate-400 font-mono flex items-center justify-end gap-1">
                          <Laptop className="w-3 h-3 text-slate-400" />
                          <span>{log.ipAddress || "Localhost"}</span>
                        </div>
                      </td>

                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Table Footer */}
        <div className="p-3 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500">
          <span className="font-mono text-[11px]">
            Menampilkan <strong>{logs.length}</strong> aktivitas terbaru
          </span>
          <span className="text-[11px] text-slate-400">
            Sistem Audit Log otomatis merekam setiap perubahan di database Turso
          </span>
        </div>

      </div>

    </div>
  );
}
