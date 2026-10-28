"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import { 
  ClipboardList, 
  FileEdit, 
  Users, 
  PlusCircle, 
  Download, 
  Upload, 
  RefreshCw,
  HardDrive,
  Database,
  Cloud,
  CheckCircle2,
  AlertCircle,
  BarChart3,
  LogOut
} from "lucide-react";
import { AuthUser } from "@/types";

interface HeaderProps {
  activeTab: "dashboard" | "executive" | "input" | "team";
  onTabChange: (tab: "dashboard" | "executive" | "input" | "team") => void;
  onNewJobClick: () => void;
  editingJobNumber?: string | null;
  onExportData: () => void;
  onImportData: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onResetFactoryData: () => void;
  isSyncing?: boolean;
  onSyncTurso?: () => void;
  dbLatency?: number | null;
  currentUser?: AuthUser | null;
  onLogout?: () => void;
}

export function Header({
  activeTab,
  onTabChange,
  onNewJobClick,
  editingJobNumber,
  onExportData,
  onImportData,
  onResetFactoryData,
  isSyncing = false,
  onSyncTurso,
  dbLatency = null,
  currentUser,
  onLogout
}: HeaderProps) {
  const [timeStr, setTimeStr] = useState<string>("");

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setTimeStr(
        now.toLocaleDateString("id-ID", {
          weekday: "short",
          day: "numeric",
          month: "short",
          year: "numeric"
        }) + " • " + now.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit", second: "2-digit" }) + " WIB"
      );
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <header className="bg-slate-900 border-b border-slate-800 text-white sticky top-0 z-30 shadow-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between py-3 gap-3">
          
          {/* Logo & System Brand */}
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-slate-800/90 border border-slate-700/80 p-1 flex items-center justify-center shrink-0 shadow-inner overflow-hidden">
              <Image
                src="/logo.png"
                alt="Logo PT. Usaha Jayamas Bhakti"
                width={44}
                height={44}
                className="object-contain"
                priority
              />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-[11px] font-bold tracking-wider text-blue-400 uppercase font-mono">
                  PT. USAHA JAYAMAS BHAKTI
                </span>
                <span className="text-[9px] font-mono uppercase bg-blue-900/70 text-blue-300 border border-blue-700 px-1.5 py-0.5 rounded font-bold">
                  ME & IT Engineering
                </span>
                
                {/* Turso Cloud Badge */}
                <div 
                  className="flex items-center gap-1.5 px-2 py-0.5 rounded bg-slate-800/90 border border-slate-700 text-[10px] font-mono cursor-pointer hover:border-emerald-500/50 transition-colors"
                  onClick={onSyncTurso}
                  title="Klik untuk sinkronisasi paksa dengan Turso Cloud DB (AWS AP-Northeast-1)"
                >
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                  <span className="text-slate-300 font-semibold">Turso DB</span>
                  {dbLatency !== null && (
                    <span className="text-emerald-400 font-bold">({dbLatency}ms)</span>
                  )}
                </div>
              </div>

              <h1 className="text-sm sm:text-base font-bold tracking-tight text-white leading-tight mt-0.5">
                Monitoring Operasional Teknik (WO / SPK)
              </h1>
            </div>
          </div>

          {/* Action Tools & Tabs */}
          <div className="flex flex-wrap items-center gap-2">
            
            {/* Primary Navigation Tabs */}
            <nav className="flex items-center bg-slate-950/80 p-1 rounded-xl border border-slate-800 gap-0.5">
              <button
                type="button"
                onClick={() => onTabChange("dashboard")}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                  activeTab === "dashboard"
                    ? "bg-blue-600 text-white shadow-xs"
                    : "text-slate-300 hover:text-white hover:bg-slate-800/80"
                }`}
              >
                <ClipboardList className="w-3.5 h-3.5" />
                <span>Operasional</span>
              </button>

              <button
                type="button"
                onClick={() => onTabChange("executive")}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                  activeTab === "executive"
                    ? "bg-blue-600 text-white shadow-xs"
                    : "text-slate-300 hover:text-white hover:bg-slate-800/80"
                }`}
              >
                <BarChart3 className="w-3.5 h-3.5 text-blue-300" />
                <span>Executive Cockpit</span>
              </button>

              <button
                type="button"
                onClick={() => onTabChange("input")}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                  activeTab === "input"
                    ? "bg-blue-600 text-white shadow-xs"
                    : "text-slate-300 hover:text-white hover:bg-slate-800/80"
                }`}
              >
                <FileEdit className="w-3.5 h-3.5" />
                <span>
                  {editingJobNumber ? `Edit (${editingJobNumber})` : "Input WO / SPK"}
                </span>
              </button>

              <button
                type="button"
                onClick={() => onTabChange("team")}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                  activeTab === "team"
                    ? "bg-blue-600 text-white shadow-xs"
                    : "text-slate-300 hover:text-white hover:bg-slate-800/80"
                }`}
              >
                <Users className="w-3.5 h-3.5" />
                <span>Master Tim</span>
              </button>
            </nav>

            {/* Quick Action Button */}
            <button
              type="button"
              onClick={onNewJobClick}
              className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-500 active:bg-blue-700 text-white text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors shadow-xs ml-1"
            >
              <PlusCircle className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Buat WO / SPK</span>
              <span className="sm:hidden">Baru</span>
            </button>

            {/* Data Management Utilities */}
            <div className="flex items-center gap-1 border-l border-slate-800 pl-2 ml-1">
              {/* Sync Turso Button */}
              {onSyncTurso && (
                <button
                  type="button"
                  onClick={onSyncTurso}
                  disabled={isSyncing}
                  title="Sinkronisasi Cloud Turso DB"
                  className={`p-1.5 text-slate-300 hover:text-white hover:bg-slate-800 rounded-lg transition-colors ${
                    isSyncing ? "animate-spin text-blue-400" : ""
                  }`}
                  aria-label="Sinkronisasi Cloud"
                >
                  <RefreshCw className="w-4 h-4" />
                </button>
              )}

              <button
                type="button"
                onClick={onExportData}
                title="Export Data Operasional (Backup JSON)"
                className="p-1.5 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded-lg transition-colors"
                aria-label="Export Data"
              >
                <Download className="w-4 h-4" />
              </button>

              <label 
                title="Import Data Operasional (Restore JSON)"
                className="p-1.5 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
                aria-label="Import Data"
              >
                <Upload className="w-4 h-4" />
                <input 
                  type="file" 
                  accept=".json" 
                  onChange={onImportData} 
                  className="hidden" 
                />
              </label>

              <button
                type="button"
                onClick={onResetFactoryData}
                title="Kembalikan ke Data Awal Standar"
                className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-slate-800 rounded-lg transition-colors"
                aria-label="Reset Data"
              >
                <Database className="w-4 h-4" />
              </button>
            </div>

            {/* Authenticated User Profile & Logout */}
            {currentUser && (
              <div className="flex items-center gap-2 pl-2 border-l border-slate-800 ml-1">
                <div 
                  className="flex items-center gap-2 bg-slate-950/70 border border-slate-800 rounded-xl px-2.5 py-1"
                  title={`Login sebagai ${currentUser.name} (${currentUser.role})`}
                >
                  <div className="w-7 h-7 rounded-lg bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white text-xs font-bold font-mono shadow-xs">
                    {currentUser.username === "admin" ? "AD" : "PR"}
                  </div>
                  <div className="hidden xl:block text-left">
                    <div className="text-[11px] font-bold text-white leading-tight flex items-center gap-1.5">
                      <span>{currentUser.name}</span>
                      {currentUser.username === "admin" ? (
                        <span className="text-[8px] bg-blue-500/20 text-blue-300 font-mono px-1 py-0.2 rounded font-semibold">ROOT</span>
                      ) : (
                        <span className="text-[8px] bg-emerald-500/20 text-emerald-300 font-mono px-1 py-0.2 rounded font-semibold">PM</span>
                      )}
                    </div>
                    <div className="text-[10px] text-slate-400 font-medium leading-tight">
                      {currentUser.role}
                    </div>
                  </div>
                </div>

                {onLogout && (
                  <button
                    type="button"
                    onClick={onLogout}
                    title={`Keluar dari sesi ${currentUser.name}`}
                    className="flex items-center gap-1.5 px-2.5 py-1.5 bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 hover:text-rose-200 border border-rose-500/30 rounded-xl text-xs font-semibold transition-colors"
                    aria-label="Logout"
                  >
                    <LogOut className="w-3.5 h-3.5 text-rose-400" />
                    <span className="hidden sm:inline">Logout</span>
                  </button>
                )}
              </div>
            )}

          </div>
        </div>
      </div>
    </header>
  );
}
