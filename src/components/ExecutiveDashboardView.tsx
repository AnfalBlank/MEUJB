"use client";

import React, { useState, useMemo } from "react";
import Image from "next/image";
import { 
  TrendingUp, 
  PieChart as PieIcon, 
  BarChart3, 
  DollarSign, 
  CheckCircle2, 
  Clock, 
  Briefcase, 
  Users, 
  ArrowUpRight, 
  ArrowDownRight, 
  Percent, 
  Calendar, 
  Filter, 
  Printer, 
  Layers,
  ChevronRight,
  ShieldCheck,
  Building2,
  FileSpreadsheet,
  RotateCcw
} from "lucide-react";
import { WorkOrderJob, Technician, SubDivision } from "@/types";
import { ALL_SUB_DIVISIONS } from "@/data/initialData";
import { 
  formatRupiah, 
  formatCompactNumber, 
  calcPercentage, 
  calculateDurationDays 
} from "@/utils/formatters";

interface ExecutiveDashboardViewProps {
  jobs: WorkOrderJob[];
  teamMembers: Technician[];
  onOpenReportModal?: (filteredJobs?: WorkOrderJob[]) => void;
  onOpenCsvModal?: (filteredJobs?: WorkOrderJob[]) => void;
  onOpenJobDetail?: (job: WorkOrderJob) => void;
}

export function ExecutiveDashboardView({
  jobs,
  teamMembers,
  onOpenReportModal,
  onOpenCsvModal,
  onOpenJobDetail,
}: ExecutiveDashboardViewProps) {

  // Global Filters
  const [selectedSubdiv, setSelectedSubdiv] = useState<string>("ALL");
  const [periodPreset, setPeriodPreset] = useState<string>("ALL");
  const [startDateFilter, setStartDateFilter] = useState<string>("");
  const [endDateFilter, setEndDateFilter] = useState<string>("");

  // Chart interactivity states
  const [hoveredSubdivSlice, setHoveredSubdivSlice] = useState<string | null>(null);
  const [hoveredStatusSlice, setHoveredStatusSlice] = useState<string | null>(null);
  const [hoveredLineMonth, setHoveredLineMonth] = useState<number | null>(null);
  const [hoveredFinanceMonth, setHoveredFinanceMonth] = useState<number | null>(null);

  // Preset Date Handlers
  const handlePresetChange = (preset: string) => {
    setPeriodPreset(preset);
    const now = new Date();
    const pad = (n: number) => String(n).padStart(2, "0");

    if (preset === "ALL") {
      setStartDateFilter("");
      setEndDateFilter("");
    } else if (preset === "THIS_MONTH") {
      const year = now.getFullYear();
      const month = now.getMonth();
      const firstDay = `${year}-${pad(month + 1)}-01`;
      const lastDayDate = new Date(year, month + 1, 0);
      const lastDay = `${year}-${pad(month + 1)}-${pad(lastDayDate.getDate())}`;
      setStartDateFilter(firstDay);
      setEndDateFilter(lastDay);
    } else if (preset === "LAST_MONTH") {
      const year = now.getMonth() === 0 ? now.getFullYear() - 1 : now.getFullYear();
      const month = now.getMonth() === 0 ? 11 : now.getMonth() - 1;
      const firstDay = `${year}-${pad(month + 1)}-01`;
      const lastDayDate = new Date(year, month + 1, 0);
      const lastDay = `${year}-${pad(month + 1)}-${pad(lastDayDate.getDate())}`;
      setStartDateFilter(firstDay);
      setEndDateFilter(lastDay);
    } else if (preset === "THIS_QUARTER") {
      const year = now.getFullYear();
      const currentMonth = now.getMonth();
      const quarterStartMonth = Math.floor(currentMonth / 3) * 3;
      const firstDay = `${year}-${pad(quarterStartMonth + 1)}-01`;
      const lastDayDate = new Date(year, quarterStartMonth + 3, 0);
      const lastDay = `${year}-${pad(quarterStartMonth + 3)}-${pad(lastDayDate.getDate())}`;
      setStartDateFilter(firstDay);
      setEndDateFilter(lastDay);
    } else if (preset === "THIS_YEAR") {
      const year = now.getFullYear();
      setStartDateFilter(`${year}-01-01`);
      setEndDateFilter(`${year}-12-31`);
    }
  };

  const handleCustomDateChange = (start: string, end: string) => {
    setStartDateFilter(start);
    setEndDateFilter(end);
    setPeriodPreset("CUSTOM");
  };

  // Filtered jobs for executive analysis based on Subdiv and Date Period Range
  const filteredJobs = useMemo(() => {
    return jobs.filter((j) => {
      // 1. Subdiv
      if (selectedSubdiv !== "ALL" && j.subdiv !== selectedSubdiv) return false;

      // 2. Date Range
      const jobDate = j.startDate || j.date || "";
      if (startDateFilter && jobDate && jobDate < startDateFilter) return false;
      if (endDateFilter && jobDate && jobDate > endDateFilter) return false;

      return true;
    });
  }, [jobs, selectedSubdiv, startDateFilter, endDateFilter]);

  // Executive High-Level KPIs
  const kpis = useMemo(() => {
    const totalJobs = filteredJobs.length;
    const woCount = filteredJobs.filter((j) => j.docType === "WO").length;
    const spkCount = filteredJobs.filter((j) => j.docType === "SPK").length;
    const doneCount = filteredJobs.filter((j) => j.status === "Done").length;
    const pendingCount = filteredJobs.filter((j) => j.status === "Pending").length;
    const holdCount = filteredJobs.filter((j) => j.status === "Hold").length;
    const cancelCount = filteredJobs.filter((j) => j.status === "Cancel").length;

    let totalBudget = 0;
    let totalActual = 0;
    let totalDays = 0;
    let jobsWithDuration = 0;

    filteredJobs.forEach((j) => {
      const kasbon = (j.techs || []).reduce((acc, t) => acc + (t.kasbon || 0), 0);
      const spd = j.spdType === "Proyek" ? 0 : (j.spdDays || 0) * (j.spdDaily || 0) + (j.spdNights || 0) * (j.spdHotel || 0);
      totalBudget += kasbon + spd;
      totalActual += j.kasbonUsed || 0;

      const d = calculateDurationDays(j.startDate || j.date, j.targetDate || j.date);
      if (d > 0) {
        totalDays += d;
        jobsWithDuration++;
      }
    });

    const completionRate = totalJobs > 0 ? Math.round((doneCount / totalJobs) * 100) : 0;
    const budgetVariance = totalBudget - totalActual;
    const avgDurationDays = jobsWithDuration > 0 ? (totalDays / jobsWithDuration).toFixed(1) : "0";

    return {
      totalJobs,
      woCount,
      spkCount,
      doneCount,
      pendingCount,
      holdCount,
      cancelCount,
      completionRate,
      totalBudget,
      totalActual,
      budgetVariance,
      avgDurationDays,
    };
  }, [filteredJobs]);

  // Sub-Division Distribution for Pie/Donut Chart
  const subdivDistribution = useMemo(() => {
    const map: Record<string, { count: number; budget: number; actual: number; color: string }> = {
      "Fueling System Engineering": { count: 0, budget: 0, actual: 0, color: "#2563eb" }, // Blue
      "IT Engineering": { count: 0, budget: 0, actual: 0, color: "#06b6d4" }, // Cyan
      "Electrical Engineering": { count: 0, budget: 0, actual: 0, color: "#f59e0b" }, // Amber
    };

    filteredJobs.forEach((j) => {
      if (map[j.subdiv]) {
        map[j.subdiv].count++;
        const k = (j.techs || []).reduce((acc, t) => acc + (t.kasbon || 0), 0);
        const s = j.spdType === "Proyek" ? 0 : (j.spdDays || 0) * (j.spdDaily || 0) + (j.spdNights || 0) * (j.spdHotel || 0);
        map[j.subdiv].budget += k + s;
        map[j.subdiv].actual += j.kasbonUsed || 0;
      }
    });

    const total = filteredJobs.length || 1;
    let accumulatedAngle = 0;

    return Object.entries(map).map(([name, data]) => {
      const percentage = (data.count / total) * 100;
      const angle = (data.count / total) * 360;
      const startAngle = accumulatedAngle;
      accumulatedAngle += angle;

      return {
        name,
        count: data.count,
        budget: data.budget,
        actual: data.actual,
        color: data.color,
        percentage: Math.round(percentage),
        startAngle,
        angle,
      };
    });
  }, [filteredJobs]);

  // Status Distribution for Donut Chart
  const statusDistribution = useMemo(() => {
    const total = filteredJobs.length || 1;
    const items = [
      { status: "Done", label: "Selesai", count: kpis.doneCount, color: "#10b981" }, // Emerald
      { status: "Pending", label: "Dalam Proses", count: kpis.pendingCount, color: "#3b82f6" }, // Blue
      { status: "Hold", label: "Tertunda (Hold)", count: kpis.holdCount, color: "#f59e0b" }, // Amber
      { status: "Cancel", label: "Batal (Cancel)", count: kpis.cancelCount, color: "#ef4444" }, // Rose
    ];

    let accumulatedAngle = 0;
    return items.map((it) => {
      const percentage = Math.round((it.count / total) * 100);
      const angle = (it.count / total) * 360;
      const startAngle = accumulatedAngle;
      accumulatedAngle += angle;

      return {
        ...it,
        percentage,
        startAngle,
        angle,
      };
    });
  }, [filteredJobs, kpis]);

  // Monthly Trend Data for Line Chart (12 Months)
  const monthlyTrend = useMemo(() => {
    const monthNames = ["Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Agu", "Sep", "Okt", "Nov", "Des"];
    const months = monthNames.map((name, idx) => ({
      monthIdx: idx,
      name,
      wo: 0,
      spk: 0,
      totalJobs: 0,
      budget: 0,
      actual: 0,
    }));

    filteredJobs.forEach((j) => {
      const dateStr = j.startDate || j.date || "";
      const parts = dateStr.split("-");
      if (parts.length >= 2) {
        const m = parseInt(parts[1], 10) - 1;
        if (m >= 0 && m < 12) {
          if (j.docType === "WO") months[m].wo++;
          else months[m].spk++;
          months[m].totalJobs++;

          const k = (j.techs || []).reduce((acc, t) => acc + (t.kasbon || 0), 0);
          const s = j.spdType === "Proyek" ? 0 : (j.spdDays || 0) * (j.spdDaily || 0) + (j.spdNights || 0) * (j.spdHotel || 0);
          months[m].budget += k + s;
          months[m].actual += j.kasbonUsed || 0;
        }
      }
    });

    return months;
  }, [filteredJobs]);

  // Top Marketing Performers
  const marketingLeaderboard = useMemo(() => {
    const map: Record<string, { name: string; jobsCount: number; doneCount: number; totalValue: number }> = {};
    filteredJobs.forEach((j) => {
      const mName = j.marketing?.trim() || "Tanpa Marketing";
      if (!map[mName]) {
        map[mName] = { name: mName, jobsCount: 0, doneCount: 0, totalValue: 0 };
      }
      map[mName].jobsCount++;
      if (j.status === "Done") map[mName].doneCount++;
      const k = (j.techs || []).reduce((acc, t) => acc + (t.kasbon || 0), 0);
      const s = j.spdType === "Proyek" ? 0 : (j.spdDays || 0) * (j.spdDaily || 0) + (j.spdNights || 0) * (j.spdHotel || 0);
      map[mName].totalValue += k + s;
    });

    return Object.values(map).sort((a, b) => b.jobsCount - a.jobsCount);
  }, [filteredJobs]);

  // Helper function to build SVG Donut Path
  const createDonutPath = (startAngle: number, angle: number, radius: number = 80, innerRadius: number = 52) => {
    if (angle <= 0) return "";
    const effectiveAngle = Math.min(angle, 359.99); // SVG arc cannot do a full 360 circle in one arc command
    const startRad = ((startAngle - 90) * Math.PI) / 180;
    const endRad = (((startAngle + effectiveAngle) - 90) * Math.PI) / 180;

    const x1 = 100 + radius * Math.cos(startRad);
    const y1 = 100 + radius * Math.sin(startRad);
    const x2 = 100 + radius * Math.cos(endRad);
    const y2 = 100 + radius * Math.sin(endRad);

    const x3 = 100 + innerRadius * Math.cos(endRad);
    const y3 = 100 + innerRadius * Math.sin(endRad);
    const x4 = 100 + innerRadius * Math.cos(startRad);
    const y4 = 100 + innerRadius * Math.sin(startRad);

    const largeArc = effectiveAngle > 180 ? 1 : 0;

    return `M ${x1} ${y1} A ${radius} ${radius} 0 ${largeArc} 1 ${x2} ${y2} L ${x3} ${y3} A ${innerRadius} ${innerRadius} 0 ${largeArc} 0 ${x4} ${y4} Z`;
  };

  // Max value calculation for Volume Line Chart scaling
  const maxJobCount = useMemo(() => {
    const max = Math.max(...monthlyTrend.map((m) => Math.max(m.wo, m.spk, m.totalJobs)), 4);
    return Math.ceil(max * 1.25);
  }, [monthlyTrend]);

  // Max value calculation for Finance Line Chart scaling
  const maxFinanceValue = useMemo(() => {
    const max = Math.max(...monthlyTrend.map((m) => Math.max(m.budget, m.actual)), 10_000_000);
    return Math.ceil(max * 1.25);
  }, [monthlyTrend]);

  return (
    <div className="space-y-6">
      
      {/* 1. Header Banner & Executive Controls */}
      <div className="bg-slate-900 rounded-2xl border border-slate-800 text-white p-5 sm:p-6 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-white/10 rounded-xl p-1.5 backdrop-blur-xs border border-white/20 flex items-center justify-center shrink-0">
              <Image
                src="/logo.png"
                alt="PT. Usaha Jayamas Bhakti"
                width={50}
                height={50}
                className="object-contain"
                priority
              />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-500/20 text-blue-300 border border-blue-400/30 font-mono uppercase">
                  Executive Cockpit & Analytics
                </span>
                <span className="text-slate-400 text-xs">• PT. Usaha Jayamas Bhakti</span>
              </div>
              <h1 className="text-lg sm:text-xl font-black tracking-wide text-white mt-1">
                Executive Monitoring Operasional Teknik
              </h1>
              <p className="text-xs text-slate-300 mt-0.5">
                Evaluasi KPI strategis, tren bulanan volume WO/SPK, dan efisiensi pengeluaran kasbon & SPD
              </p>
            </div>
          </div>

          {/* Filter Bar & Action Button */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Periode Preset Selector */}
            <div className="flex items-center bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-slate-200">
              <Calendar className="w-3.5 h-3.5 text-blue-400 mr-1.5 shrink-0" />
              <select
                value={periodPreset}
                onChange={(e) => handlePresetChange(e.target.value)}
                className="bg-transparent text-white font-semibold focus:outline-hidden cursor-pointer"
                title="Pilih Preset Periode"
              >
                <option value="ALL" className="bg-slate-900">Semua Periode</option>
                <option value="THIS_MONTH" className="bg-slate-900">Bulan Ini</option>
                <option value="LAST_MONTH" className="bg-slate-900">Bulan Lalu</option>
                <option value="THIS_QUARTER" className="bg-slate-900">Kuartal Ini (Q)</option>
                <option value="THIS_YEAR" className="bg-slate-900">Tahun Ini</option>
                <option value="CUSTOM" className="bg-slate-900">Pilih Tanggal Bebas...</option>
              </select>
            </div>

            {/* Input Rentang Tanggal (Dari & Sampai) */}
            <div className="flex items-center gap-1.5 bg-slate-800 border border-slate-700 rounded-lg px-2 py-1 text-xs">
              <span className="text-[10px] uppercase font-bold text-slate-400">Dari:</span>
              <input
                type="date"
                value={startDateFilter}
                onChange={(e) => handleCustomDateChange(e.target.value, endDateFilter)}
                className="bg-slate-900/90 border border-slate-600 rounded px-1.5 py-0.5 text-xs text-white focus:outline-hidden focus:border-blue-500 font-mono"
                title="Pilih Tanggal Mulai Periode"
              />
              <span className="text-slate-400 text-[10px]">s/d</span>
              <input
                type="date"
                value={endDateFilter}
                onChange={(e) => handleCustomDateChange(startDateFilter, e.target.value)}
                className="bg-slate-900/90 border border-slate-600 rounded px-1.5 py-0.5 text-xs text-white focus:outline-hidden focus:border-blue-500 font-mono"
                title="Pilih Tanggal Selesai Periode"
              />
              {(startDateFilter || endDateFilter) && (
                <button
                  type="button"
                  onClick={() => handlePresetChange("ALL")}
                  className="p-1 text-slate-400 hover:text-white rounded hover:bg-slate-700 transition-colors ml-0.5 cursor-pointer"
                  title="Reset Filter Tanggal (Tampilkan Semua)"
                >
                  <RotateCcw className="w-3 h-3 text-slate-300" />
                </button>
              )}
            </div>

            {/* Sub-Divisi Selector */}
            <div className="flex items-center bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs">
              <Layers className="w-3.5 h-3.5 text-slate-400 mr-1.5 shrink-0" />
              <select
                value={selectedSubdiv}
                onChange={(e) => setSelectedSubdiv(e.target.value)}
                className="bg-transparent text-white font-semibold focus:outline-hidden max-w-[130px] truncate cursor-pointer"
              >
                <option value="ALL" className="bg-slate-900">Semua Divisi</option>
                {ALL_SUB_DIVISIONS.map((s) => (
                  <option key={s} value={s} className="bg-slate-900">{s}</option>
                ))}
              </select>
            </div>

            {/* Export CSV Button */}
            <button
              onClick={() => onOpenCsvModal ? onOpenCsvModal(filteredJobs) : undefined}
              className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center gap-1.5 transition-colors shadow-xs shrink-0 cursor-pointer"
              title="Ekspor CSV rapi sesuai format Google Spreadsheet"
            >
              <FileSpreadsheet className="w-3.5 h-3.5" />
              <span>Ekspor CSV</span>
            </button>

            {/* Official Report Button */}
            <button
              onClick={() => onOpenReportModal ? onOpenReportModal(filteredJobs) : undefined}
              className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold flex items-center gap-1.5 transition-colors shadow-xs shrink-0 cursor-pointer"
              title="Cetak Laporan PDF Resmi KOP PT. Usaha Jayamas Bhakti"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Cetak Laporan PDF</span>
            </button>
          </div>
        </div>
      </div>

      {/* 2. Executive KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* KPI 1: Volume Dokumen */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs hover:border-slate-300 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
              Total Volume Pekerjaan
            </span>
            <div className="w-8 h-8 rounded-lg bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-600">
              <Briefcase className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-black text-slate-900">{kpis.totalJobs}</span>
            <span className="text-xs font-semibold text-slate-500">Dokumen Aktif</span>
          </div>
          <div className="mt-3 flex items-center justify-between text-xs pt-2.5 border-t border-slate-100">
            <span className="text-slate-600">
              WO: <strong className="text-blue-700">{kpis.woCount}</strong>
            </span>
            <span className="text-slate-300">•</span>
            <span className="text-slate-600">
              SPK: <strong className="text-purple-700">{kpis.spkCount}</strong>
            </span>
            <span className="text-slate-300">•</span>
            <span className="text-emerald-700 font-bold">
              {kpis.doneCount} Selesai
            </span>
          </div>
        </div>

        {/* KPI 2: Completion Rate */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs hover:border-slate-300 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
              Tingkat Keberhasilan (Rate)
            </span>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-600">
              <Percent className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-black text-slate-900">{kpis.completionRate}%</span>
            <span className="text-xs font-semibold text-emerald-700">Pekerjaan Selesai</span>
          </div>
          {/* Progress bar */}
          <div className="mt-3 w-full bg-slate-100 h-2 rounded-full overflow-hidden">
            <div
              className="bg-emerald-500 h-full rounded-full transition-all duration-500"
              style={{ width: `${kpis.completionRate}%` }}
            ></div>
          </div>
          <div className="mt-2 flex items-center justify-between text-[11px] text-slate-500">
            <span>{kpis.pendingCount} Sedang Berjalan</span>
            <span>{kpis.holdCount} Tertunda</span>
          </div>
        </div>

        {/* KPI 3: Anggaran & Realisasi Keuangan */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs hover:border-slate-300 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
              Alokasi vs Realisasi
            </span>
            <div className="w-8 h-8 rounded-lg bg-indigo-50 border border-indigo-200 flex items-center justify-center text-indigo-600">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2">
            <div className="text-xl font-black text-slate-900">
              {formatCompactNumber(kpis.totalActual)}
            </div>
            <div className="text-[11px] text-slate-500 font-mono mt-0.5">
              dari Anggaran {formatCompactNumber(kpis.totalBudget)}
            </div>
          </div>
          <div className="mt-3 pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
            <span className="text-slate-600">Efisiensi Biaya:</span>
            <span className={`font-mono font-bold ${kpis.budgetVariance >= 0 ? "text-emerald-700" : "text-rose-600"}`}>
              {kpis.budgetVariance >= 0 ? "+" : ""}{formatRupiah(kpis.budgetVariance)}
            </span>
          </div>
        </div>

        {/* KPI 4: Rata-rata Durasi Kerja */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs hover:border-slate-300 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
              Rata-rata Durasi Proyek
            </span>
            <div className="w-8 h-8 rounded-lg bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-600">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-black text-slate-900">{kpis.avgDurationDays}</span>
            <span className="text-xs font-semibold text-slate-500">Hari Kalender / Tugas</span>
          </div>
          <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between text-xs text-slate-600">
            <span>Standar SLA Maksimal:</span>
            <span className="font-bold text-slate-900">≤ 5 Hari Kerja</span>
          </div>
        </div>

      </div>

      {/* 3. Interactive Charts Grid (Pie & Line Charts) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Chart 1: Donut/Pie Chart Distribusi Sub-Divisi */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-2xs flex flex-col justify-between">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <PieIcon className="w-4 h-4 text-blue-600" />
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800">
                Distribusi Pekerjaan per Sub-Divisi
              </h3>
            </div>
            <span className="text-[11px] font-mono text-slate-500">Beban Proyek</span>
          </div>

          <div className="py-4 flex flex-col sm:flex-row items-center justify-center gap-6">
            {/* SVG Interactive Donut */}
            <div className="relative w-48 h-48 shrink-0">
              <svg viewBox="0 0 200 200" className="w-full h-full transform -rotate-90">
                {subdivDistribution.map((slice) => {
                  if (slice.count === 0) return null;
                  const isHovered = hoveredSubdivSlice === slice.name;
                  return (
                    <path
                      key={slice.name}
                      d={createDonutPath(slice.startAngle, slice.angle, isHovered ? 84 : 80, 52)}
                      fill={slice.color}
                      className="cursor-pointer transition-all duration-200 opacity-90 hover:opacity-100"
                      onMouseEnter={() => setHoveredSubdivSlice(slice.name)}
                      onMouseLeave={() => setHoveredSubdivSlice(null)}
                      onClick={() => setSelectedSubdiv(selectedSubdiv === slice.name ? "ALL" : slice.name)}
                    />
                  );
                })}
              </svg>
              {/* Center Info in Donut */}
              <div className="absolute inset-0 flex flex-col items-center justify-center text-center pointer-events-none">
                <span className="text-2xl font-black text-slate-900">
                  {hoveredSubdivSlice
                    ? subdivDistribution.find((s) => s.name === hoveredSubdivSlice)?.percentage + "%"
                    : kpis.totalJobs}
                </span>
                <span className="text-[10px] text-slate-500 font-semibold uppercase">
                  {hoveredSubdivSlice ? "Porsi Tugas" : "Total Dokumen"}
                </span>
              </div>
            </div>

            {/* Legend & Details */}
            <div className="space-y-2.5 w-full sm:w-auto">
              {subdivDistribution.map((item) => (
                <div
                  key={item.name}
                  onMouseEnter={() => setHoveredSubdivSlice(item.name)}
                  onMouseLeave={() => setHoveredSubdivSlice(null)}
                  onClick={() => setSelectedSubdiv(selectedSubdiv === item.name ? "ALL" : item.name)}
                  className={`p-2 rounded-lg cursor-pointer transition-all border ${
                    selectedSubdiv === item.name || hoveredSubdivSlice === item.name
                      ? "bg-slate-100 border-slate-300 shadow-2xs"
                      : "bg-slate-50 border-slate-100 hover:bg-slate-100"
                  }`}
                >
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-2">
                      <span className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: item.color }}></span>
                      <span className="text-xs font-bold text-slate-800 truncate max-w-[170px]">{item.name}</span>
                    </div>
                    <span className="font-mono text-xs font-bold text-slate-900">{item.count} Dokumen</span>
                  </div>
                  <div className="flex items-center justify-between text-[11px] text-slate-500 mt-1 pl-5">
                    <span>{item.percentage}% Alokasi</span>
                    <span>Anggaran: {formatCompactNumber(item.budget)}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <p className="text-[11px] text-slate-400 text-center border-t border-slate-100 pt-2.5">
            💡 Klik segmen untuk memfilter seluruh dashboard sesuai sub-divisi yang dipilih.
          </p>
        </div>

        {/* Chart 2: Donut/Pie Chart Komposisi Status Dokumen */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-2xs flex flex-col justify-between">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800">
                Komposisi Status Dokumen
              </h3>
            </div>
            <span className="text-[11px] font-mono text-slate-500">Kesehatan Pelaksanaan</span>
          </div>

          <div className="py-4 flex flex-col sm:flex-row items-center justify-center gap-6">
            {/* SVG Interactive Donut */}
            <div className="relative w-48 h-48 shrink-0">
              <svg viewBox="0 0 200 200" className="w-full h-full transform -rotate-90">
                {statusDistribution.map((slice) => {
                  if (slice.count === 0) return null;
                  const isHovered = hoveredStatusSlice === slice.status;
                  return (
                    <path
                      key={slice.status}
                      d={createDonutPath(slice.startAngle, slice.angle, isHovered ? 84 : 80, 52)}
                      fill={slice.color}
                      className="cursor-pointer transition-all duration-200 opacity-90 hover:opacity-100"
                      onMouseEnter={() => setHoveredStatusSlice(slice.status)}
                      onMouseLeave={() => setHoveredStatusSlice(null)}
                    />
                  );
                })}
              </svg>
              {/* Center Info in Donut */}
              <div className="absolute inset-0 flex flex-col items-center justify-center text-center pointer-events-none">
                <span className="text-2xl font-black text-emerald-700">
                  {hoveredStatusSlice
                    ? statusDistribution.find((s) => s.status === hoveredStatusSlice)?.percentage + "%"
                    : kpis.completionRate + "%"}
                </span>
                <span className="text-[10px] text-slate-500 font-semibold uppercase">
                  {hoveredStatusSlice
                    ? statusDistribution.find((s) => s.status === hoveredStatusSlice)?.label
                    : "Tingkat Selesai"}
                </span>
              </div>
            </div>

            {/* Legend & Details */}
            <div className="space-y-2 w-full sm:w-auto">
              {statusDistribution.map((item) => (
                <div
                  key={item.status}
                  onMouseEnter={() => setHoveredStatusSlice(item.status)}
                  onMouseLeave={() => setHoveredStatusSlice(null)}
                  className={`p-2 rounded-lg transition-all border ${
                    hoveredStatusSlice === item.status
                      ? "bg-slate-100 border-slate-300"
                      : "bg-slate-50 border-slate-100"
                  }`}
                >
                  <div className="flex items-center justify-between gap-6">
                    <div className="flex items-center gap-2">
                      <span className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: item.color }}></span>
                      <span className="text-xs font-bold text-slate-800">{item.label}</span>
                    </div>
                    <div className="text-right">
                      <span className="font-mono text-xs font-bold text-slate-900">{item.count}</span>
                      <span className="text-[10px] text-slate-500 ml-1">({item.percentage}%)</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <p className="text-[11px] text-slate-400 text-center border-t border-slate-100 pt-2.5">
            Pekerjaan berstatus Hold harus segera ditindaklanjuti untuk mencegah bottleneck operasional.
          </p>
        </div>

      </div>

      {/* 4. Interactive Trend Line Charts (Volume & Keuangan Bulanan) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Line Chart 1: Tren Volume Pekerjaan Bulanan (WO vs SPK) */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-2xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-blue-600" />
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800">
                Tren Volume Pekerjaan Bulanan (WO & SPK)
              </h3>
            </div>
            <div className="flex items-center gap-3 text-xs">
              <span className="flex items-center gap-1.5 text-slate-600">
                <span className="w-2.5 h-2.5 rounded-full bg-blue-600"></span>
                <span>Work Order</span>
              </span>
              <span className="flex items-center gap-1.5 text-slate-600">
                <span className="w-2.5 h-2.5 rounded-full bg-purple-600"></span>
                <span>SPK</span>
              </span>
            </div>
          </div>

          {/* SVG Line Chart */}
          <div className="relative pt-2 pb-6">
            <svg viewBox="0 0 600 200" className="w-full h-44 overflow-visible">
              {/* Grid Lines */}
              {[0, 0.25, 0.5, 0.75, 1].map((ratio) => {
                const y = 170 - ratio * 140;
                const val = Math.round(ratio * maxJobCount);
                return (
                  <g key={ratio}>
                    <line x1="35" y1={y} x2="590" y2={y} stroke="#e2e8f0" strokeDasharray="3 3" />
                    <text x="25" y={y + 3} textAnchor="end" fontSize="9" fill="#94a3b8" fontFamily="monospace">
                      {val}
                    </text>
                  </g>
                );
              })}

              {/* WO Line Path */}
              {(() => {
                const points = monthlyTrend.map((m, idx) => {
                  const x = 50 + idx * 47;
                  const y = 170 - (m.wo / maxJobCount) * 140;
                  return `${x},${y}`;
                });
                return (
                  <>
                    <polyline
                      fill="none"
                      stroke="#2563eb"
                      strokeWidth="2.5"
                      points={points.join(" ")}
                      strokeLinecap="round"
                    />
                    {monthlyTrend.map((m, idx) => {
                      const x = 50 + idx * 47;
                      const y = 170 - (m.wo / maxJobCount) * 140;
                      return (
                        <circle
                          key={idx}
                          cx={x}
                          cy={y}
                          r={hoveredLineMonth === idx ? "5" : "3.5"}
                          fill="#ffffff"
                          stroke="#2563eb"
                          strokeWidth="2.5"
                          className="cursor-pointer transition-all"
                          onMouseEnter={() => setHoveredLineMonth(idx)}
                          onMouseLeave={() => setHoveredLineMonth(null)}
                        />
                      );
                    })}
                  </>
                );
              })()}

              {/* SPK Line Path */}
              {(() => {
                const points = monthlyTrend.map((m, idx) => {
                  const x = 50 + idx * 47;
                  const y = 170 - (m.spk / maxJobCount) * 140;
                  return `${x},${y}`;
                });
                return (
                  <>
                    <polyline
                      fill="none"
                      stroke="#9333ea"
                      strokeWidth="2.5"
                      strokeDasharray="4 2"
                      points={points.join(" ")}
                      strokeLinecap="round"
                    />
                    {monthlyTrend.map((m, idx) => {
                      const x = 50 + idx * 47;
                      const y = 170 - (m.spk / maxJobCount) * 140;
                      return (
                        <circle
                          key={idx}
                          cx={x}
                          cy={y}
                          r={hoveredLineMonth === idx ? "5" : "3.5"}
                          fill="#ffffff"
                          stroke="#9333ea"
                          strokeWidth="2.5"
                          className="cursor-pointer transition-all"
                          onMouseEnter={() => setHoveredLineMonth(idx)}
                          onMouseLeave={() => setHoveredLineMonth(null)}
                        />
                      );
                    })}
                  </>
                );
              })()}

              {/* X Axis Labels */}
              {monthlyTrend.map((m, idx) => {
                const x = 50 + idx * 47;
                return (
                  <text
                    key={m.name}
                    x={x}
                    y="190"
                    textAnchor="middle"
                    fontSize="10"
                    fontWeight={hoveredLineMonth === idx ? "bold" : "normal"}
                    fill={hoveredLineMonth === idx ? "#1e293b" : "#64748b"}
                  >
                    {m.name}
                  </text>
                );
              })}
            </svg>

            {/* Hover Tooltip Box */}
            {hoveredLineMonth !== null && (
              <div className="absolute top-2 right-4 bg-slate-900 text-white p-2.5 rounded-lg shadow-lg text-xs space-y-1 z-10 font-mono">
                <span className="font-bold block text-blue-400">
                  {monthlyTrend[hoveredLineMonth].name} {startDateFilter ? startDateFilter.split("-")[0] : new Date().getFullYear()}
                </span>
                <div className="flex justify-between gap-4">
                  <span className="text-slate-300">Work Order:</span>
                  <strong className="text-white">{monthlyTrend[hoveredLineMonth].wo} Dokumen</strong>
                </div>
                <div className="flex justify-between gap-4">
                  <span className="text-slate-300">SPK:</span>
                  <strong className="text-purple-300">{monthlyTrend[hoveredLineMonth].spk} Dokumen</strong>
                </div>
                <div className="flex justify-between gap-4 border-t border-slate-700 pt-1 text-emerald-400 font-bold">
                  <span>Total:</span>
                  <span>{monthlyTrend[hoveredLineMonth].totalJobs} Dokumen</span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Line Chart 2: Tren Pengeluaran Finansial (Anggaran vs Realisasi) */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-2xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2">
              <DollarSign className="w-4 h-4 text-emerald-600" />
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800">
                Tren Keuangan: Anggaran vs Realisasi Aktual
              </h3>
            </div>
            <div className="flex items-center gap-3 text-xs">
              <span className="flex items-center gap-1.5 text-slate-600">
                <span className="w-2.5 h-2.5 rounded-full bg-blue-600"></span>
                <span>Anggaran (Budget)</span>
              </span>
              <span className="flex items-center gap-1.5 text-slate-600">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-600"></span>
                <span>Realisasi Kasbon</span>
              </span>
            </div>
          </div>

          {/* SVG Line Chart */}
          <div className="relative pt-2 pb-6">
            <svg viewBox="0 0 600 200" className="w-full h-44 overflow-visible">
              {/* Grid Lines */}
              {[0, 0.25, 0.5, 0.75, 1].map((ratio) => {
                const y = 170 - ratio * 140;
                const val = ratio * maxFinanceValue;
                return (
                  <g key={ratio}>
                    <line x1="45" y1={y} x2="590" y2={y} stroke="#e2e8f0" strokeDasharray="3 3" />
                    <text x="38" y={y + 3} textAnchor="end" fontSize="9" fill="#94a3b8" fontFamily="monospace">
                      {formatCompactNumber(val)}
                    </text>
                  </g>
                );
              })}

              {/* Budget Line Path */}
              {(() => {
                const points = monthlyTrend.map((m, idx) => {
                  const x = 50 + idx * 47;
                  const y = 170 - (m.budget / maxFinanceValue) * 140;
                  return `${x},${y}`;
                });
                return (
                  <>
                    <polyline
                      fill="none"
                      stroke="#2563eb"
                      strokeWidth="2.5"
                      points={points.join(" ")}
                      strokeLinecap="round"
                    />
                    {monthlyTrend.map((m, idx) => {
                      const x = 50 + idx * 47;
                      const y = 170 - (m.budget / maxFinanceValue) * 140;
                      return (
                        <circle
                          key={idx}
                          cx={x}
                          cy={y}
                          r={hoveredFinanceMonth === idx ? "5" : "3.5"}
                          fill="#ffffff"
                          stroke="#2563eb"
                          strokeWidth="2.5"
                          className="cursor-pointer transition-all"
                          onMouseEnter={() => setHoveredFinanceMonth(idx)}
                          onMouseLeave={() => setHoveredFinanceMonth(null)}
                        />
                      );
                    })}
                  </>
                );
              })()}

              {/* Actual Line Path */}
              {(() => {
                const points = monthlyTrend.map((m, idx) => {
                  const x = 50 + idx * 47;
                  const y = 170 - (m.actual / maxFinanceValue) * 140;
                  return `${x},${y}`;
                });
                return (
                  <>
                    <polyline
                      fill="none"
                      stroke="#10b981"
                      strokeWidth="2.5"
                      points={points.join(" ")}
                      strokeLinecap="round"
                    />
                    {monthlyTrend.map((m, idx) => {
                      const x = 50 + idx * 47;
                      const y = 170 - (m.actual / maxFinanceValue) * 140;
                      return (
                        <circle
                          key={idx}
                          cx={x}
                          cy={y}
                          r={hoveredFinanceMonth === idx ? "5" : "3.5"}
                          fill="#ffffff"
                          stroke="#10b981"
                          strokeWidth="2.5"
                          className="cursor-pointer transition-all"
                          onMouseEnter={() => setHoveredFinanceMonth(idx)}
                          onMouseLeave={() => setHoveredFinanceMonth(null)}
                        />
                      );
                    })}
                  </>
                );
              })()}

              {/* X Axis Labels */}
              {monthlyTrend.map((m, idx) => {
                const x = 50 + idx * 47;
                return (
                  <text
                    key={m.name}
                    x={x}
                    y="190"
                    textAnchor="middle"
                    fontSize="10"
                    fontWeight={hoveredFinanceMonth === idx ? "bold" : "normal"}
                    fill={hoveredFinanceMonth === idx ? "#1e293b" : "#64748b"}
                  >
                    {m.name}
                  </text>
                );
              })}
            </svg>

            {/* Hover Tooltip Box */}
            {hoveredFinanceMonth !== null && (
              <div className="absolute top-2 right-4 bg-slate-900 text-white p-2.5 rounded-lg shadow-lg text-xs space-y-1 z-10 font-mono">
                <span className="font-bold block text-blue-400">
                  {monthlyTrend[hoveredFinanceMonth].name} {startDateFilter ? startDateFilter.split("-")[0] : new Date().getFullYear()}
                </span>
                <div className="flex justify-between gap-4">
                  <span className="text-slate-300">Anggaran:</span>
                  <strong className="text-white">{formatRupiah(monthlyTrend[hoveredFinanceMonth].budget)}</strong>
                </div>
                <div className="flex justify-between gap-4">
                  <span className="text-slate-300">Realisasi:</span>
                  <strong className="text-emerald-400">{formatRupiah(monthlyTrend[hoveredFinanceMonth].actual)}</strong>
                </div>
                <div className="flex justify-between gap-4 border-t border-slate-700 pt-1 text-[11px]">
                  <span className="text-slate-400">Selisih:</span>
                  <span className={monthlyTrend[hoveredFinanceMonth].budget >= monthlyTrend[hoveredFinanceMonth].actual ? "text-emerald-300" : "text-rose-400"}>
                    {formatRupiah(monthlyTrend[hoveredFinanceMonth].budget - monthlyTrend[hoveredFinanceMonth].actual)}
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>

      </div>

      {/* 5. Executive Matrices: Leaderboard Marketing & Subdiv Efficiency */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Matrix 1: Kontribusi Marketing */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-2xs space-y-3">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-blue-600" />
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800">
                Peringkat & Kontribusi Personil Marketing
              </h3>
            </div>
            <span className="text-[11px] font-mono text-slate-500">Volume & Nilai</span>
          </div>

          <div className="divide-y divide-slate-100 text-xs">
            {marketingLeaderboard.length === 0 ? (
              <p className="py-4 text-slate-500 text-center">Belum ada data marketing terdaftar.</p>
            ) : (
              marketingLeaderboard.map((m, idx) => (
                <div key={m.name} className="py-3 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <span className="w-6 h-6 rounded-full bg-slate-100 text-slate-700 font-mono font-bold flex items-center justify-center text-xs shrink-0">
                      {idx + 1}
                    </span>
                    <div>
                      <h4 className="font-bold text-slate-900">{m.name}</h4>
                      <p className="text-[10px] text-slate-500">
                        {m.jobsCount} Dokumen Ditangani • {m.doneCount} Selesai
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-mono font-bold text-slate-900">
                      {formatRupiah(m.totalValue)}
                    </div>
                    <span className="text-[10px] text-emerald-700 font-semibold">
                      {Math.round((m.doneCount / (m.jobsCount || 1)) * 100)}% Success Rate
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Matrix 2: Scorecard Kinerja Sub-Divisi */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-2xs space-y-3">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2">
              <Building2 className="w-4 h-4 text-amber-600" />
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800">
                Scorecard Efisiensi Sub-Divisi Teknik
              </h3>
            </div>
            <span className="text-[11px] font-mono text-slate-500">Evaluasi SLA</span>
          </div>

          <div className="space-y-3">
            {ALL_SUB_DIVISIONS.map((subName) => {
              const divJobs = filteredJobs.filter((j) => j.subdiv === subName);
              const totalDiv = divJobs.length;
              const doneDiv = divJobs.filter((j) => j.status === "Done").length;
              const rate = totalDiv > 0 ? Math.round((doneDiv / totalDiv) * 100) : 0;

              let budget = 0;
              let actual = 0;
              divJobs.forEach((j) => {
                const k = (j.techs || []).reduce((acc, t) => acc + (t.kasbon || 0), 0);
                const s = j.spdType === "Proyek" ? 0 : (j.spdDays || 0) * (j.spdDaily || 0) + (j.spdNights || 0) * (j.spdHotel || 0);
                budget += k + s;
                actual += j.kasbonUsed || 0;
              });

              return (
                <div key={subName} className="p-3 bg-slate-50 rounded-lg border border-slate-200 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-800">{subName}</span>
                    <span className="text-xs font-mono font-bold text-slate-900">
                      {doneDiv} / {totalDiv} Selesai ({rate}%)
                    </span>
                  </div>
                  {/* Progress bar */}
                  <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
                    <div
                      className="bg-blue-600 h-full rounded-full transition-all duration-300"
                      style={{ width: `${rate}%` }}
                    ></div>
                  </div>
                  <div className="flex items-center justify-between text-[11px] text-slate-500 font-mono">
                    <span>Realisasi: {formatCompactNumber(actual)}</span>
                    <span className={budget >= actual ? "text-emerald-700 font-semibold" : "text-rose-600 font-semibold"}>
                      Efisiensi: {formatCompactNumber(budget - actual)}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

      </div>
    </div>
  );
}
