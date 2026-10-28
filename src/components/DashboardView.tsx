"use client";

import React, { useState, useMemo, useEffect } from "react";
import { 
  Search, 
  RotateCcw, 
  Fuel, 
  Network, 
  Zap, 
  FileText, 
  ExternalLink, 
  Eye, 
  Edit2, 
  Trash2, 
  Building2, 
  UserCheck, 
  Filter, 
  Layers, 
  TrendingUp, 
  DollarSign,
  FolderCheck,
  CheckCircle2,
  Clock,
  AlertCircle,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Download,
  X,
  PieChart,
  Calendar,
  Sparkles,
  Printer
} from "lucide-react";
import { WorkOrderJob, SubDivision, JobStatus, Technician } from "@/types";
import { MAIN_SUB_DIVISIONS } from "@/data/initialData";
import { formatRupiah, calcPercentage, formatDateIndo, calculateDurationDays, formatDateRange, isJobOverdue } from "@/utils/formatters";
import { exportOfficialCsv } from "@/utils/exportCsv";
import { OfficialReportModal } from "@/components/OfficialReportModal";

interface DashboardViewProps {
  jobs: WorkOrderJob[];
  teamMembers: Technician[];
  onOpenDetail: (job: WorkOrderJob) => void;
  onEditJob: (job: WorkOrderJob) => void;
  onDeleteJob: (id: string) => void;
  onOpenSubdivModal: (subdiv: SubDivision) => void;
  onStatusChange?: (id: string, newStatus: JobStatus) => void;
}

type SortField = "docNumber" | "date" | "customer" | "subdiv" | "status" | "kasbonUsed";
type SortOrder = "asc" | "desc";

export function DashboardView({
  jobs,
  teamMembers,
  onOpenDetail,
  onEditJob,
  onDeleteJob,
  onOpenSubdivModal,
  onStatusChange
}: DashboardViewProps) {
  // Official Report Modal State
  const [isReportModalOpen, setIsReportModalOpen] = useState<boolean>(false);

  // Client Date State to guarantee zero SSR hydration mismatch
  const [clientTodayStr, setClientTodayStr] = useState<string>("");

  useEffect(() => {
    setClientTodayStr(new Date().toISOString().split("T")[0]);
  }, []);

  // Filter States
  const [filterMonth, setFilterMonth] = useState<string>("ALL");
  const [filterYear, setFilterYear] = useState<string>("ALL");
  const [filterMarketing, setFilterMarketing] = useState<string>("ALL");
  const [filterDocType, setFilterDocType] = useState<string>("ALL");
  const [filterSubdiv, setFilterSubdiv] = useState<string>("ALL");
  const [filterStatus, setFilterStatus] = useState<string>("ALL");
  const [searchQuery, setSearchQuery] = useState<string>("");

  // Sorting State
  const [sortField, setSortField] = useState<SortField>("date");
  const [sortOrder, setSortOrder] = useState<SortOrder>("desc");

  // Extract unique marketing names from data
  const marketingList = useMemo(() => {
    const names = new Set<string>();
    jobs.forEach((j) => {
      if (j.marketing && j.marketing.trim() !== "-") {
        names.add(j.marketing.trim());
      }
    });
    return Array.from(names).sort();
  }, [jobs]);

  // Extract unique years from data
  const yearList = useMemo(() => {
    const years = new Set<string>();
    jobs.forEach((j) => {
      if (j.date) {
        const y = j.date.split("-")[0];
        if (y) years.add(y);
      }
    });
    years.add("2026");
    years.add("2025");
    return Array.from(years).sort().reverse();
  }, [jobs]);

  const monthOptions = [
    { value: "01", label: "Januari" },
    { value: "02", label: "Februari" },
    { value: "03", label: "Maret" },
    { value: "04", label: "April" },
    { value: "05", label: "Mei" },
    { value: "06", label: "Juni" },
    { value: "07", label: "Juli" },
    { value: "08", label: "Agustus" },
    { value: "09", label: "September" },
    { value: "10", label: "Oktober" },
    { value: "11", label: "November" },
    { value: "12", label: "Desember" }
  ];

  const handleResetFilters = () => {
    setFilterMonth("ALL");
    setFilterYear("ALL");
    setFilterMarketing("ALL");
    setFilterDocType("ALL");
    setFilterSubdiv("ALL");
    setFilterStatus("ALL");
    setSearchQuery("");
  };

  const handleQuickStatusFilter = (st: string) => {
    if (filterStatus === st) {
      setFilterStatus("ALL");
    } else {
      setFilterStatus(st);
    }
  };

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortOrder("asc");
    }
  };

  // Primary multi-dimensional filtering
  const filteredJobs = useMemo(() => {
    const list = jobs.filter((job) => {
      if (filterDocType !== "ALL" && job.docType !== filterDocType) return false;
      if (filterSubdiv !== "ALL" && job.subdiv !== filterSubdiv) return false;
      if (filterMarketing !== "ALL" && job.marketing !== filterMarketing) return false;
      if (filterStatus !== "ALL" && job.status !== filterStatus) return false;

      if (job.date) {
        const [y, m] = job.date.split("-");
        if (filterYear !== "ALL" && y !== filterYear) return false;
        if (filterMonth !== "ALL" && m !== filterMonth) return false;
      }

      if (searchQuery.trim() !== "") {
        const q = searchQuery.toLowerCase();
        const matchDoc = job.docNumber.toLowerCase().includes(q);
        const matchCust = job.customer.toLowerCase().includes(q);
        const matchDesc = job.desc.toLowerCase().includes(q);
        const matchMkt = job.marketing.toLowerCase().includes(q);
        const matchTech = job.techs.some((t) => t.name.toLowerCase().includes(q));
        if (!matchDoc && !matchCust && !matchDesc && !matchMkt && !matchTech) return false;
      }

      return true;
    });

    // Apply sorting
    return list.sort((a, b) => {
      let valA: any = a[sortField];
      let valB: any = b[sortField];

      if (sortField === "customer") {
        valA = a.customer.toLowerCase();
        valB = b.customer.toLowerCase();
      } else if (sortField === "status") {
        valA = a.status;
        valB = b.status;
      } else if (sortField === "kasbonUsed") {
        valA = Number(a.kasbonUsed || 0);
        valB = Number(b.kasbonUsed || 0);
      }

      if (valA < valB) return sortOrder === "asc" ? -1 : 1;
      if (valA > valB) return sortOrder === "asc" ? 1 : -1;
      return 0;
    });
  }, [jobs, filterDocType, filterSubdiv, filterMarketing, filterStatus, filterYear, filterMonth, searchQuery, sortField, sortOrder]);

  // Compute operational statistics from filtered set
  const woList = useMemo(() => filteredJobs.filter((j) => j.docType === "WO"), [filteredJobs]);
  const spkList = useMemo(() => filteredJobs.filter((j) => j.docType === "SPK"), [filteredJobs]);

  const woDone = woList.filter((j) => j.status === "Done").length;
  const woPending = woList.filter((j) => j.status === "Pending").length;
  const woHold = woList.filter((j) => j.status === "Hold").length;
  const woCancel = woList.filter((j) => j.status === "Cancel").length;

  const spkDone = spkList.filter((j) => j.status === "Done").length;
  const spkPending = spkList.filter((j) => j.status === "Pending").length;
  const spkHold = spkList.filter((j) => j.status === "Hold").length;
  const spkCancel = spkList.filter((j) => j.status === "Cancel").length;

  // Financial aggregates by Sub-Division for the informative section
  const financialBySubdiv = useMemo(() => {
    const result: Record<string, { pengajuan: number; realisasi: number; sisa: number; jobsCount: number }> = {
      "Fueling System Engineering": { pengajuan: 0, realisasi: 0, sisa: 0, jobsCount: 0 },
      "IT Engineering": { pengajuan: 0, realisasi: 0, sisa: 0, jobsCount: 0 },
      "Electrical Engineering": { pengajuan: 0, realisasi: 0, sisa: 0, jobsCount: 0 }
    };

    filteredJobs.forEach((j) => {
      if (result[j.subdiv]) {
        const techKasbon = j.techs.reduce((sum, t) => sum + Number(t.kasbon || 0), 0);
        const spd = j.spdType === "SPD" ? (Number(j.spdDays || 0) * Number(j.spdDaily || 0)) + (Number(j.spdNights || 0) * Number(j.spdHotel || 0)) : 0;
        const pengajuan = techKasbon + spd;
        const real = Number(j.kasbonUsed || 0);

        result[j.subdiv].pengajuan += pengajuan;
        result[j.subdiv].realisasi += real;
        result[j.subdiv].sisa += (pengajuan - real);
        result[j.subdiv].jobsCount += 1;
      }
    });

    return result;
  }, [filteredJobs]);

  // Total financial summaries
  const totalFinancials = useMemo(() => {
    let pengajuan = 0;
    let realisasi = 0;
    Object.values(financialBySubdiv).forEach((v) => {
      pengajuan += v.pengajuan;
      realisasi += v.realisasi;
    });
    return { pengajuan, realisasi, sisa: pengajuan - realisasi };
  }, [financialBySubdiv]);

  // Export current filtered jobs as official CSV
  const handleExportCSV = () => {
    exportOfficialCsv({
      jobs: filteredJobs,
      subdivFilter: filterSubdiv,
      statusFilter: filterStatus,
      yearFilter: filterYear,
      monthFilter: filterMonth,
    });
  };

  const getSortIcon = (field: SortField) => {
    if (sortField !== field) return <ArrowUpDown className="w-3 h-3 text-slate-400 inline ml-1" />;
    return sortOrder === "asc" ? <ArrowUp className="w-3 h-3 text-blue-600 inline ml-1" /> : <ArrowDown className="w-3 h-3 text-blue-600 inline ml-1" />;
  };

  return (
    <div className="space-y-6">
      
      {/* 1. Multi-Dimensional Filter Control Bar */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-2xs space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2 flex-wrap">
            <Filter className="w-4 h-4 text-blue-600" />
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-800">
              Filter Monitoring Multi-Dimensi
            </h2>
            <span className="text-[10px] font-mono text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
              Menampilkan {filteredJobs.length} dari {jobs.length} Pekerjaan
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleExportCSV}
              className="flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1.5 rounded-lg border border-slate-300 text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer"
              title="Unduh data terpilih sebagai CSV resmi"
            >
              <Download className="w-3.5 h-3.5 text-slate-600" />
              <span>Export CSV</span>
            </button>

            <button
              type="button"
              onClick={() => setIsReportModalOpen(true)}
              className="flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white shadow-xs transition-colors cursor-pointer"
              title="Cetak atau simpan Laporan Resmi PDF berstandar KOP PT. Usaha Jayamas Bhakti"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Cetak Laporan PDF</span>
            </button>

            <button
              type="button"
              onClick={handleResetFilters}
              className="flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1.5 rounded-lg border border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
              title="Kembalikan semua filter ke awal"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset</span>
            </button>
          </div>
        </div>

        {/* Dropdown Filters Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5 text-xs">
          {/* Bulan */}
          <div>
            <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">
              Bulan
            </label>
            <select
              value={filterMonth}
              onChange={(e) => setFilterMonth(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-800 focus:outline-hidden focus:ring-1 focus:ring-blue-500"
            >
              <option value="ALL">Semua Bulan</option>
              {monthOptions.map((m) => (
                <option key={m.value} value={m.value}>{m.label}</option>
              ))}
            </select>
          </div>

          {/* Tahun */}
          <div>
            <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">
              Tahun
            </label>
            <select
              value={filterYear}
              onChange={(e) => setFilterYear(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-800 focus:outline-hidden focus:ring-1 focus:ring-blue-500"
            >
              <option value="ALL">Semua Tahun</option>
              {yearList.map((y) => (
                <option key={y} value={y}>{y}</option>
              ))}
            </select>
          </div>

          {/* Marketing */}
          <div>
            <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">
              Marketing
            </label>
            <select
              value={filterMarketing}
              onChange={(e) => setFilterMarketing(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-800 focus:outline-hidden focus:ring-1 focus:ring-blue-500"
            >
              <option value="ALL">Semua Marketing</option>
              {marketingList.map((m) => (
                <option key={m} value={m}>{m}</option>
              ))}
            </select>
          </div>

          {/* Jenis Dokumen */}
          <div>
            <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">
              Jenis Dokumen
            </label>
            <select
              value={filterDocType}
              onChange={(e) => setFilterDocType(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-800 focus:outline-hidden focus:ring-1 focus:ring-blue-500"
            >
              <option value="ALL">Semua (WO & SPK)</option>
              <option value="WO">Work Order (WO)</option>
              <option value="SPK">Surat Perintah Kerja (SPK)</option>
            </select>
          </div>

          {/* Sub-Divisi */}
          <div>
            <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">
              Sub-Divisi
            </label>
            <select
              value={filterSubdiv}
              onChange={(e) => setFilterSubdiv(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-800 focus:outline-hidden focus:ring-1 focus:ring-blue-500"
            >
              <option value="ALL">Semua Sub-Divisi</option>
              <option value="Fueling System Engineering">Fueling System</option>
              <option value="IT Engineering">IT Engineering</option>
              <option value="Electrical Engineering">Electrical Engineering</option>
            </select>
          </div>

          {/* Status */}
          <div>
            <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">
              Status Pekerjaan
            </label>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-800 focus:outline-hidden focus:ring-1 focus:ring-blue-500"
            >
              <option value="ALL">Semua Status</option>
              <option value="Done">Done (Selesai)</option>
              <option value="Pending">Pending (Menunggu)</option>
              <option value="Hold">Hold (Tertunda)</option>
              <option value="Cancel">Cancel (Batal)</option>
            </select>
          </div>
        </div>

        {/* Quick Search Input */}
        <div className="relative pt-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3.5" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Ketik pencarian instan: No. Dokumen, Customer, Deskripsi Tugas, Marketing, atau Nama Teknisi..."
            className="w-full bg-slate-50 border border-slate-200 rounded-lg pl-9 pr-4 py-2 text-xs text-slate-800 placeholder-slate-400 focus:outline-hidden focus:ring-1 focus:ring-blue-500"
          />
        </div>

        {/* Active Filter Chips Bar (Interactive Polish) */}
        {(filterStatus !== "ALL" || filterSubdiv !== "ALL" || filterDocType !== "ALL" || filterMarketing !== "ALL" || filterMonth !== "ALL" || filterYear !== "ALL" || searchQuery) && (
          <div className="flex items-center gap-1.5 flex-wrap pt-1 text-[11px]">
            <span className="text-slate-400 font-semibold">Filter Diterapkan:</span>

            {filterStatus !== "ALL" && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 font-medium">
                Status: {filterStatus}
                <button type="button" onClick={() => setFilterStatus("ALL")} className="hover:text-blue-950"><X className="w-3 h-3" /></button>
              </span>
            )}

            {filterSubdiv !== "ALL" && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-800 font-medium">
                Divisi: {filterSubdiv.replace(" Engineering", "")}
                <button type="button" onClick={() => setFilterSubdiv("ALL")} className="hover:text-indigo-950"><X className="w-3 h-3" /></button>
              </span>
            )}

            {filterDocType !== "ALL" && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-purple-100 text-purple-800 font-medium">
                Dokumen: {filterDocType}
                <button type="button" onClick={() => setFilterDocType("ALL")} className="hover:text-purple-950"><X className="w-3 h-3" /></button>
              </span>
            )}

            {filterMarketing !== "ALL" && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-slate-200 text-slate-800 font-medium">
                Marketing: {filterMarketing}
                <button type="button" onClick={() => setFilterMarketing("ALL")} className="hover:text-slate-950"><X className="w-3 h-3" /></button>
              </span>
            )}

            {filterMonth !== "ALL" && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-slate-200 text-slate-800 font-medium">
                Bulan: {monthOptions.find(m => m.value === filterMonth)?.label}
                <button type="button" onClick={() => setFilterMonth("ALL")} className="hover:text-slate-950"><X className="w-3 h-3" /></button>
              </span>
            )}

            {filterYear !== "ALL" && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-slate-200 text-slate-800 font-medium">
                Tahun: {filterYear}
                <button type="button" onClick={() => setFilterYear("ALL")} className="hover:text-slate-950"><X className="w-3 h-3" /></button>
              </span>
            )}

            {searchQuery && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 font-medium">
                Cari: &quot;{searchQuery}&quot;
                <button type="button" onClick={() => setSearchQuery("")} className="hover:text-amber-950"><X className="w-3 h-3" /></button>
              </span>
            )}

            <button
              type="button"
              onClick={handleResetFilters}
              className="text-blue-600 hover:underline font-semibold ml-1"
            >
              Hapus Semua
            </button>
          </div>
        )}
      </div>

      {/* 2. Three Interactive Sub-Division Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {MAIN_SUB_DIVISIONS.map((sub) => {
          const subJobs = filteredJobs.filter((j) => j.subdiv === sub.name);
          const subTotal = subJobs.length;
          const subDone = subJobs.filter((j) => j.status === "Done").length;
          const subPending = subJobs.filter((j) => j.status === "Pending").length;
          const subHold = subJobs.filter((j) => j.status === "Hold").length;
          const subPersons = teamMembers.filter((m) => m.subdiv === sub.name).length;
          const donePct = calcPercentage(subDone, subTotal);

          const getIcon = () => {
            if (sub.iconName === "Fuel") return <Fuel className="w-5 h-5 text-amber-600" />;
            if (sub.iconName === "Network") return <Network className="w-5 h-5 text-indigo-600" />;
            return <Zap className="w-5 h-5 text-emerald-600" />;
          };

          return (
            <div
              key={sub.name}
              onClick={() => onOpenSubdivModal(sub.name)}
              className="bg-white rounded-xl border border-slate-200 p-4 hover:border-blue-400 hover:shadow-md transition-all cursor-pointer group flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className={`w-10 h-10 rounded-lg ${sub.bgSoft} border ${sub.borderSoft} flex items-center justify-center shrink-0`}>
                      {getIcon()}
                    </div>
                    <div>
                      <h3 className="text-xs sm:text-sm font-bold text-slate-900 group-hover:text-blue-600 transition-colors">
                        {sub.shortName}
                      </h3>
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        {subPersons} Personil Aktif
                      </p>
                    </div>
                  </div>

                  <span className={`text-[11px] font-mono font-bold px-2 py-0.5 rounded-full border ${sub.badgeBg}`}>
                    {subTotal} Dokumen
                  </span>
                </div>

                {/* Progress bar */}
                <div className="mt-4 space-y-1">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="text-slate-500 font-medium">Tingkat Penyelesaian</span>
                    <span className="font-mono font-bold text-slate-800">{donePct}</span>
                  </div>
                  <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-blue-600 rounded-full transition-all duration-300"
                      style={{ width: donePct }}
                    />
                  </div>
                </div>
              </div>

              {/* Status footer pill */}
              <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-[11px]">
                <div className="flex items-center gap-2 font-mono">
                  <span className="text-emerald-700 font-semibold">{subDone} Done</span>
                  <span>•</span>
                  <span className="text-amber-700 font-semibold">{subPending} Pending</span>
                  {subHold > 0 && (
                    <>
                      <span>•</span>
                      <span className="text-indigo-700 font-semibold">{subHold} Hold</span>
                    </>
                  )}
                </div>

                <span className="text-blue-600 font-bold group-hover:underline text-[11px]">
                  Kelola & Detail →
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* 3. Operational Performance Matrix Strip with Clickable Quick Status Filter */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        
        {/* Work Order Card */}
        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-2xs space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-2.5 h-2.5 rounded-full bg-blue-600"></div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                Work Order (WO)
              </h3>
            </div>
            <button
              type="button"
              onClick={() => setFilterDocType(filterDocType === "WO" ? "ALL" : "WO")}
              className={`text-xs font-mono font-bold px-2 py-0.5 rounded transition-colors ${
                filterDocType === "WO" ? "bg-blue-600 text-white" : "bg-blue-50 text-blue-700 hover:bg-blue-100"
              }`}
            >
              {woList.length} Total
            </button>
          </div>

          <div className="grid grid-cols-4 gap-2 text-center font-mono">
            <button
              type="button"
              onClick={() => handleQuickStatusFilter("Done")}
              className={`p-2 rounded border transition-colors ${
                filterStatus === "Done" ? "bg-emerald-600 text-white border-emerald-600" : "bg-slate-50 border-emerald-200 hover:bg-emerald-50"
              }`}
            >
              <span className={`text-[10px] font-sans font-bold block ${filterStatus === "Done" ? "text-white" : "text-emerald-700"}`}>Done</span>
              <span className="text-xs font-bold">{woDone}</span>
              <span className={`text-[10px] block ${filterStatus === "Done" ? "text-emerald-100" : "text-slate-400"}`}>{calcPercentage(woDone, woList.length)}</span>
            </button>

            <button
              type="button"
              onClick={() => handleQuickStatusFilter("Pending")}
              className={`p-2 rounded border transition-colors ${
                filterStatus === "Pending" ? "bg-amber-600 text-white border-amber-600" : "bg-slate-50 border-amber-200 hover:bg-amber-50"
              }`}
            >
              <span className={`text-[10px] font-sans font-bold block ${filterStatus === "Pending" ? "text-white" : "text-amber-700"}`}>Pending</span>
              <span className="text-xs font-bold">{woPending}</span>
              <span className={`text-[10px] block ${filterStatus === "Pending" ? "text-amber-100" : "text-slate-400"}`}>{calcPercentage(woPending, woList.length)}</span>
            </button>

            <button
              type="button"
              onClick={() => handleQuickStatusFilter("Hold")}
              className={`p-2 rounded border transition-colors ${
                filterStatus === "Hold" ? "bg-indigo-600 text-white border-indigo-600" : "bg-slate-50 border-indigo-200 hover:bg-indigo-50"
              }`}
            >
              <span className={`text-[10px] font-sans font-bold block ${filterStatus === "Hold" ? "text-white" : "text-indigo-700"}`}>Hold</span>
              <span className="text-xs font-bold">{woHold}</span>
              <span className={`text-[10px] block ${filterStatus === "Hold" ? "text-indigo-100" : "text-slate-400"}`}>{calcPercentage(woHold, woList.length)}</span>
            </button>

            <button
              type="button"
              onClick={() => handleQuickStatusFilter("Cancel")}
              className={`p-2 rounded border transition-colors ${
                filterStatus === "Cancel" ? "bg-rose-600 text-white border-rose-600" : "bg-slate-50 border-rose-200 hover:bg-rose-50"
              }`}
            >
              <span className={`text-[10px] font-sans font-bold block ${filterStatus === "Cancel" ? "text-white" : "text-rose-700"}`}>Cancel</span>
              <span className="text-xs font-bold">{woCancel}</span>
              <span className={`text-[10px] block ${filterStatus === "Cancel" ? "text-rose-100" : "text-slate-400"}`}>{calcPercentage(woCancel, woList.length)}</span>
            </button>
          </div>
        </div>

        {/* SPK Card */}
        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-2xs space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-2.5 h-2.5 rounded-full bg-purple-600"></div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                Surat Perintah Kerja (SPK)
              </h3>
            </div>
            <button
              type="button"
              onClick={() => setFilterDocType(filterDocType === "SPK" ? "ALL" : "SPK")}
              className={`text-xs font-mono font-bold px-2 py-0.5 rounded transition-colors ${
                filterDocType === "SPK" ? "bg-purple-600 text-white" : "bg-purple-50 text-purple-700 hover:bg-purple-100"
              }`}
            >
              {spkList.length} Total
            </button>
          </div>

          <div className="grid grid-cols-4 gap-2 text-center font-mono">
            <button
              type="button"
              onClick={() => handleQuickStatusFilter("Done")}
              className={`p-2 rounded border transition-colors ${
                filterStatus === "Done" ? "bg-emerald-600 text-white border-emerald-600" : "bg-slate-50 border-emerald-200 hover:bg-emerald-50"
              }`}
            >
              <span className={`text-[10px] font-sans font-bold block ${filterStatus === "Done" ? "text-white" : "text-emerald-700"}`}>Done</span>
              <span className="text-xs font-bold">{spkDone}</span>
              <span className={`text-[10px] block ${filterStatus === "Done" ? "text-emerald-100" : "text-slate-400"}`}>{calcPercentage(spkDone, spkList.length)}</span>
            </button>

            <button
              type="button"
              onClick={() => handleQuickStatusFilter("Pending")}
              className={`p-2 rounded border transition-colors ${
                filterStatus === "Pending" ? "bg-amber-600 text-white border-amber-600" : "bg-slate-50 border-amber-200 hover:bg-amber-50"
              }`}
            >
              <span className={`text-[10px] font-sans font-bold block ${filterStatus === "Pending" ? "text-white" : "text-amber-700"}`}>Pending</span>
              <span className="text-xs font-bold">{spkPending}</span>
              <span className={`text-[10px] block ${filterStatus === "Pending" ? "text-amber-100" : "text-slate-400"}`}>{calcPercentage(spkPending, spkList.length)}</span>
            </button>

            <button
              type="button"
              onClick={() => handleQuickStatusFilter("Hold")}
              className={`p-2 rounded border transition-colors ${
                filterStatus === "Hold" ? "bg-indigo-600 text-white border-indigo-600" : "bg-slate-50 border-indigo-200 hover:bg-indigo-50"
              }`}
            >
              <span className={`text-[10px] font-sans font-bold block ${filterStatus === "Hold" ? "text-white" : "text-indigo-700"}`}>Hold</span>
              <span className="text-xs font-bold">{spkHold}</span>
              <span className={`text-[10px] block ${filterStatus === "Hold" ? "text-indigo-100" : "text-slate-400"}`}>{calcPercentage(spkHold, spkList.length)}</span>
            </button>

            <button
              type="button"
              onClick={() => handleQuickStatusFilter("Cancel")}
              className={`p-2 rounded border transition-colors ${
                filterStatus === "Cancel" ? "bg-rose-600 text-white border-rose-600" : "bg-slate-50 border-rose-200 hover:bg-rose-50"
              }`}
            >
              <span className={`text-[10px] font-sans font-bold block ${filterStatus === "Cancel" ? "text-white" : "text-rose-700"}`}>Cancel</span>
              <span className="text-xs font-bold">{spkCancel}</span>
              <span className={`text-[10px] block ${filterStatus === "Cancel" ? "text-rose-100" : "text-slate-400"}`}>{calcPercentage(spkCancel, spkList.length)}</span>
            </button>
          </div>
        </div>

        {/* Finansial Summary Card */}
        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-2xs space-y-3 sm:col-span-2 lg:col-span-1">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <DollarSign className="w-4 h-4 text-emerald-600" />
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                Finansial Lapangan
              </h3>
            </div>
            <span className="text-[11px] font-mono text-slate-500">
              {filteredJobs.length} Job
            </span>
          </div>

          <div className="grid grid-cols-2 gap-2 text-xs font-mono">
            <div className="bg-slate-50 p-2 rounded border border-slate-200">
              <span className="text-[10px] font-sans text-slate-400 uppercase font-semibold block">Total Pengajuan</span>
              <span className="text-xs font-bold text-slate-900">{formatRupiah(totalFinancials.pengajuan)}</span>
            </div>
            <div className="bg-slate-50 p-2 rounded border border-slate-200">
              <span className="text-[10px] font-sans text-slate-400 uppercase font-semibold block">Realisasi Aktual</span>
              <span className="text-xs font-bold text-slate-900">{formatRupiah(totalFinancials.realisasi)}</span>
            </div>
          </div>

          <div className={`p-2 rounded text-xs font-mono flex items-center justify-between border ${
            totalFinancials.sisa >= 0 
              ? "bg-emerald-50 text-emerald-800 border-emerald-200" 
              : "bg-rose-50 text-rose-800 border-rose-200"
          }`}>
            <span className="font-sans font-semibold text-[11px]">
              {totalFinancials.sisa >= 0 ? "Sisa Dana Operasional:" : "Defisit Operasional:"}
            </span>
            <span className="font-bold text-xs">{formatRupiah(Math.abs(totalFinancials.sisa))}</span>
          </div>
        </div>

      </div>

      {/* 4. Informative Section: "Efisiensi Finansial & Alokasi Anggaran Lapangan per Sub-Divisi" */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-2xs space-y-3">
        <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
          <div className="flex items-center gap-2">
            <PieChart className="w-4 h-4 text-blue-600" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800">
              Distribusi Finansial & Efisiensi Anggaran per Sub-Divisi
            </h3>
          </div>
          <span className="text-[11px] font-mono text-slate-500">
            Realisasi Aktual vs Total Pengajuan
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {MAIN_SUB_DIVISIONS.map((sub) => {
            const data = financialBySubdiv[sub.name] || { pengajuan: 0, realisasi: 0, sisa: 0, jobsCount: 0 };
            const usagePct = data.pengajuan > 0 ? Math.min(100, Math.round((data.realisasi / data.pengajuan) * 100)) : 0;

            return (
              <div key={sub.name} className="p-3 bg-slate-50 rounded-lg border border-slate-200 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-800">{sub.shortName}</span>
                  <span className="text-[10px] font-mono text-slate-500 font-semibold">{data.jobsCount} Dokumen</span>
                </div>

                <div className="space-y-1">
                  <div className="flex items-center justify-between text-[11px] font-mono">
                    <span className="text-slate-500">Realisasi:</span>
                    <span className="font-bold text-slate-800">{formatRupiah(data.realisasi)}</span>
                  </div>
                  <div className="flex items-center justify-between text-[11px] font-mono">
                    <span className="text-slate-500">Pengajuan:</span>
                    <span className="text-slate-600">{formatRupiah(data.pengajuan)}</span>
                  </div>

                  {/* Progress bar */}
                  <div className="w-full h-1.5 bg-slate-200 rounded-full overflow-hidden mt-1.5">
                    <div 
                      className={`h-full rounded-full ${
                        usagePct > 95 ? "bg-rose-500" : usagePct > 70 ? "bg-amber-500" : "bg-emerald-500"
                      }`}
                      style={{ width: `${usagePct}%` }}
                    />
                  </div>

                  <div className="flex items-center justify-between text-[10px] pt-1 font-mono">
                    <span className="text-slate-400">Penyerapan: {usagePct}%</span>
                    <span className={`font-semibold ${data.sisa >= 0 ? "text-emerald-700" : "text-rose-700"}`}>
                      Sisa: {formatRupiah(data.sisa)}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 5. Tabel Matriks Beban Kerja Sub-Divisi */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-2xs">
        <div className="px-4 py-3 bg-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Layers className="w-4 h-4 text-blue-400" />
            <h3 className="text-xs font-bold uppercase tracking-wider">
              Matriks Beban Kerja & Distribusi Status per Sub-Divisi
            </h3>
          </div>
          <span className="text-[11px] text-slate-400 font-mono">
            3 Sub-Divisi Teknik
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left min-w-[750px]">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase text-[10px] tracking-wider">
              <tr>
                <th className="p-3">Sub-Divisi</th>
                <th className="p-3 text-center">Personil</th>
                <th className="p-3 text-center bg-blue-50/50 text-blue-700">Total WO</th>
                <th className="p-3 text-center bg-purple-50/50 text-purple-700">Total SPK</th>
                <th className="p-3 text-center">Total Dokumen</th>
                <th className="p-3 text-center text-emerald-700 bg-emerald-50/40">Done</th>
                <th className="p-3 text-center text-amber-700 bg-amber-50/40">Pending</th>
                <th className="p-3 text-center text-indigo-700 bg-indigo-50/40">Hold</th>
                <th className="p-3 text-center text-rose-700 bg-rose-50/40">Cancel</th>
                <th className="p-3 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {MAIN_SUB_DIVISIONS.map((sub) => {
                const subJobs = filteredJobs.filter((j) => j.subdiv === sub.name);
                const subTotal = subJobs.length;
                const personCount = teamMembers.filter((m) => m.subdiv === sub.name).length;
                const woC = subJobs.filter((j) => j.docType === "WO").length;
                const spkC = subJobs.filter((j) => j.docType === "SPK").length;
                const dC = subJobs.filter((j) => j.status === "Done").length;
                const pC = subJobs.filter((j) => j.status === "Pending").length;
                const hC = subJobs.filter((j) => j.status === "Hold").length;
                const cC = subJobs.filter((j) => j.status === "Cancel").length;

                return (
                  <tr key={sub.name} className="hover:bg-slate-50 transition-colors">
                    <td 
                      onClick={() => onOpenSubdivModal(sub.name)}
                      className="p-3 font-bold text-slate-900 cursor-pointer hover:text-blue-600 transition-colors"
                    >
                      {sub.name}
                    </td>
                    <td className="p-3 text-center font-mono text-slate-700">{personCount} Org</td>
                    <td className="p-3 text-center font-bold font-mono text-blue-700 bg-blue-50/30">{woC}</td>
                    <td className="p-3 text-center font-bold font-mono text-purple-700 bg-purple-50/30">{spkC}</td>
                    <td className="p-3 text-center font-bold font-mono text-slate-900">{subTotal}</td>
                    <td className="p-3 text-center font-bold font-mono text-emerald-700 bg-emerald-50/30">
                      {dC} <span className="text-[10px] font-normal text-emerald-600 font-sans">({calcPercentage(dC, subTotal)})</span>
                    </td>
                    <td className="p-3 text-center font-bold font-mono text-amber-700 bg-amber-50/30">
                      {pC} <span className="text-[10px] font-normal text-amber-600 font-sans">({calcPercentage(pC, subTotal)})</span>
                    </td>
                    <td className="p-3 text-center font-bold font-mono text-indigo-700 bg-indigo-50/30">
                      {hC} <span className="text-[10px] font-normal text-indigo-600 font-sans">({calcPercentage(hC, subTotal)})</span>
                    </td>
                    <td className="p-3 text-center font-bold font-mono text-rose-700 bg-rose-50/30">
                      {cC} <span className="text-[10px] font-normal text-rose-600 font-sans">({calcPercentage(cC, subTotal)})</span>
                    </td>
                    <td className="p-3 text-center">
                      <button
                        type="button"
                        onClick={() => onOpenSubdivModal(sub.name)}
                        className="px-2.5 py-1 rounded bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 text-xs font-semibold transition-colors"
                      >
                        Kelola
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* 6. Tabel Utama Monitoring Pekerjaan (WO & SPK) dengan Sortable Columns & Inline Status Changer */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-2xs space-y-0">
        <div className="px-4 py-3 bg-slate-900 text-white flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-blue-400" />
            <h3 className="text-xs font-bold uppercase tracking-wider">
              Daftar Monitoring Pekerjaan Teknik (WO & SPK)
            </h3>
          </div>
          
          {/* Action Buttons: Official CSV & Official PDF */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleExportCSV}
              className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 active:bg-slate-900 text-slate-200 border border-slate-700 text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-2xs"
              title="Unduh laporan CSV rapi dengan metadata resmi dan encoding UTF-8 Excel"
            >
              <Download className="w-3.5 h-3.5 text-blue-400" />
              <span>Ekspor CSV Resmi</span>
            </button>
            <button
              type="button"
              onClick={() => setIsReportModalOpen(true)}
              className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 active:bg-blue-700 text-white text-xs font-bold flex items-center gap-1.5 transition-colors shadow-xs"
              title="Cetak atau simpan Laporan Resmi PDF berstandar kop surat PT. Usaha Jayamas Bhakti"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Laporan PDF Resmi</span>
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left min-w-[1050px]">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase text-[10px] tracking-wider select-none">
              <tr>
                <th className="p-3 text-center w-10">No</th>
                <th className="p-3 cursor-pointer hover:bg-slate-100" onClick={() => handleSort("docNumber")}>
                  Dokumen {getSortIcon("docNumber")}
                </th>
                <th className="p-3 cursor-pointer hover:bg-slate-100" onClick={() => handleSort("date")}>
                  Jadwal Pelaksanaan {getSortIcon("date")}
                </th>
                <th className="p-3 cursor-pointer hover:bg-slate-100" onClick={() => handleSort("subdiv")}>
                  Sub-Divisi {getSortIcon("subdiv")}
                </th>
                <th className="p-3">Marketing</th>
                <th className="p-3 cursor-pointer hover:bg-slate-100" onClick={() => handleSort("customer")}>
                  Customer & Lokasi {getSortIcon("customer")}
                </th>
                <th className="p-3 min-w-[180px]">Uraian Pekerjaan</th>
                <th className="p-3">Tim Bertugas</th>
                <th className="p-3">Berkas Drive</th>
                <th className="p-3 cursor-pointer hover:bg-slate-100" onClick={() => handleSort("status")}>
                  Status {getSortIcon("status")}
                </th>
                <th className="p-3 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {filteredJobs.length === 0 ? (
                <tr>
                  <td colSpan={11} className="p-10 text-center text-slate-400">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <AlertCircle className="w-6 h-6 text-slate-300" />
                      <p className="text-xs font-semibold">Tidak ada data dokumen yang cocok dengan filter aktif.</p>
                      <button
                        type="button"
                        onClick={handleResetFilters}
                        className="text-xs text-blue-600 font-bold underline hover:text-blue-700"
                      >
                        Reset semua filter
                      </button>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredJobs.map((job, idx) => {
                  const statusBadgeColor = 
                    job.status === "Done" ? "bg-emerald-50 text-emerald-700 border-emerald-200" :
                    job.status === "Pending" ? "bg-amber-50 text-amber-700 border-amber-200" :
                    job.status === "Hold" ? "bg-indigo-50 text-indigo-700 border-indigo-200" :
                    "bg-rose-50 text-rose-700 border-rose-200";

                  const subdivColor = 
                    job.subdiv.includes("Fueling") ? "text-amber-800 bg-amber-50 border-amber-200" :
                    job.subdiv.includes("IT") ? "text-indigo-800 bg-indigo-50 border-indigo-200" :
                    "text-emerald-800 bg-emerald-50 border-emerald-200";

                  return (
                    <tr key={job.id} className="hover:bg-slate-50/80 transition-colors align-top">
                      <td className="p-3 text-center font-mono text-slate-400 font-bold">
                        {idx + 1}
                      </td>

                      {/* Dokumen & Tanggal Pembuatan */}
                      <td className="p-3 whitespace-nowrap">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase ${
                          job.docType === "WO" ? "bg-blue-100 text-blue-800" : "bg-purple-100 text-purple-800"
                        }`}>
                          {job.docType}
                        </span>
                        <div className="mt-1">
                          <button
                            type="button"
                            onClick={() => onOpenDetail(job)}
                            className="font-mono font-bold text-blue-600 hover:text-blue-800 hover:underline text-left block"
                          >
                            {job.docNumber}
                          </button>
                        </div>
                        <div className="text-[11px] font-mono text-slate-400 mt-0.5">
                          {formatDateIndo(job.date)}
                        </div>
                      </td>

                      {/* Jadwal Pelaksanaan (Mulai & Target Selesai) */}
                      <td className="p-3 whitespace-nowrap">
                        <div className="flex flex-col gap-1">
                          <div className="flex items-center gap-1 text-[11px] font-mono text-slate-700">
                            <span className="text-slate-400 text-[10px] uppercase font-sans">Mulai:</span>
                            <span className="font-semibold">{formatDateIndo(job.startDate || job.date)}</span>
                          </div>
                          <div className="flex items-center gap-1 text-[11px] font-mono text-slate-700">
                            <span className="text-slate-400 text-[10px] uppercase font-sans">Target:</span>
                            <span className="font-semibold">{formatDateIndo(job.targetDate || job.date)}</span>
                          </div>
                          <div className="flex items-center gap-1.5 mt-0.5">
                            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-mono font-bold bg-slate-100 text-slate-700 border border-slate-200">
                              <Clock className="w-2.5 h-2.5 text-slate-500" />
                              {calculateDurationDays(job.startDate || job.date, job.targetDate || job.date)} Hari
                            </span>
                            {isJobOverdue(job.targetDate || job.date, job.status, clientTodayStr) && (
                              <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[10px] font-bold bg-rose-100 text-rose-800 border border-rose-200">
                                ⚠️ Lewat Jadwal
                              </span>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Sub-Divisi */}
                      <td className="p-3">
                        <span className={`px-2 py-0.5 rounded text-[11px] font-semibold border ${subdivColor} whitespace-nowrap`}>
                          {job.subdiv}
                        </span>
                      </td>

                      {/* Marketing */}
                      <td className="p-3 font-semibold text-slate-800 whitespace-nowrap">
                        <div className="flex items-center gap-1.5 text-blue-800">
                          <UserCheck className="w-3.5 h-3.5 text-blue-500 shrink-0" />
                          <span>{job.marketing}</span>
                        </div>
                      </td>

                      {/* Customer */}
                      <td className="p-3 font-bold text-slate-900 max-w-xs">
                        <div className="flex items-start gap-1">
                          <Building2 className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
                          <span className="line-clamp-2">{job.customer}</span>
                        </div>
                      </td>

                      {/* Uraian Pekerjaan */}
                      <td className="p-3 max-w-xs">
                        <p className="text-slate-700 line-clamp-2">{job.desc}</p>
                        <div className="mt-1 flex items-center gap-1 text-[11px] font-mono text-blue-700 font-semibold">
                          <Clock className="w-3 h-3" />
                          <span>Target: {job.target}</span>
                        </div>
                      </td>

                      {/* Tim Bertugas */}
                      <td className="p-3">
                        <div className="flex flex-col gap-1 max-w-[130px]">
                          {job.techs.map((t, tIdx) => (
                            <span 
                              key={tIdx} 
                              className="text-[11px] bg-slate-100 text-slate-700 px-1.5 py-0.5 rounded truncate font-medium"
                              title={`${t.name} (${t.subdiv}) - Kasbon: ${formatRupiah(t.kasbon)}`}
                            >
                              {t.name}
                            </span>
                          ))}
                        </div>
                      </td>

                      {/* Berkas Drive */}
                      <td className="p-3 whitespace-nowrap">
                        {job.baLink ? (
                          <div className="flex flex-col gap-1">
                            <a
                              href={job.baLink}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-[11px] font-semibold text-blue-600 hover:text-blue-800 hover:underline flex items-center gap-1"
                            >
                              <FileText className="w-3 h-3 text-rose-500" />
                              <span>Lihat BA</span>
                            </a>
                            {job.photos && job.photos.length > 0 && (
                              <span className="text-[10px] text-slate-400 font-mono">
                                {job.photos.length} Foto Lampiran
                              </span>
                            )}
                          </div>
                        ) : (
                          <span className="text-[11px] text-slate-400 italic">Belum Upload</span>
                        )}
                      </td>

                      {/* Status with Direct Interactive Quick Switcher */}
                      <td className="p-3 whitespace-nowrap">
                        {onStatusChange ? (
                          <select
                            value={job.status}
                            onChange={(e) => onStatusChange(job.id, e.target.value as JobStatus)}
                            className={`px-2 py-0.5 rounded-full text-[11px] font-semibold border cursor-pointer focus:outline-hidden ${statusBadgeColor}`}
                          >
                            <option value="Pending">Pending</option>
                            <option value="Done">Done</option>
                            <option value="Hold">Hold</option>
                            <option value="Cancel">Cancel</option>
                          </select>
                        ) : (
                          <span className={`px-2 py-0.5 rounded-full text-xs font-semibold border ${statusBadgeColor} block text-center mb-1`}>
                            {job.status}
                          </span>
                        )}
                        {job.statusNote && (
                          <p className="text-[11px] text-slate-500 line-clamp-1 max-w-[140px] mt-0.5" title={job.statusNote}>
                            {job.statusNote}
                          </p>
                        )}
                      </td>

                      {/* Aksi */}
                      <td className="p-3 text-center whitespace-nowrap">
                        <div className="flex items-center justify-center gap-1">
                          <button
                            type="button"
                            onClick={() => onOpenDetail(job)}
                            className="p-1 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
                            title="Lihat Detail Lengkap"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => onEditJob(job)}
                            className="p-1 text-slate-500 hover:text-amber-600 hover:bg-amber-50 rounded transition-colors"
                            title="Edit Dokumen"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => onDeleteJob(job.id)}
                            className="p-1 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded transition-colors"
                            title="Hapus Dokumen"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Cetak Laporan Resmi PDF */}
      <OfficialReportModal
        isOpen={isReportModalOpen}
        onClose={() => setIsReportModalOpen(false)}
        jobs={filteredJobs}
      />
    </div>
  );
}
