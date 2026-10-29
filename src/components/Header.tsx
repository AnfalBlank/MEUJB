"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import { 
  ClipboardList, 
  FileEdit, 
  Users, 
  PlusCircle, 
  BarChart3,
  LogOut,
  ShieldCheck,
  UserCog,
  UserPlus,
  ChevronDown,
  Settings,
  KeyRound
} from "lucide-react";
import { AuthUser } from "@/types";


interface HeaderProps {
  activeTab: "dashboard" | "executive" | "input" | "team" | "audit";
  onTabChange: (tab: "dashboard" | "executive" | "input" | "team" | "audit") => void;
  onNewJobClick: () => void;
  editingJobNumber?: string | null;
  isSyncing?: boolean;
  onSyncTurso?: () => void;
  dbLatency?: number | null;
  currentUser?: AuthUser | null;
  onLogout?: () => void;
  onOpenProfileSettings?: () => void;
  onOpenUserManagement?: () => void;
}

export function Header({
  activeTab,
  onTabChange,
  onNewJobClick,
  editingJobNumber,
  isSyncing = false,
  onSyncTurso,
  dbLatency = null,
  currentUser,
  onLogout,
  onOpenProfileSettings,
  onOpenUserManagement,
}: HeaderProps) {
  const [timeStr, setTimeStr] = useState<string>("");
  const [isUserMenuOpen, setIsUserMenuOpen] = useState<boolean>(false);


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

  const renderUserDropdownContent = () => {
    if (!currentUser) return null;
    return (
      <>
        <div className="px-3 py-2 border-b border-slate-800/80 mb-1">
          <span className="text-[10px] text-slate-400 uppercase font-mono tracking-wider block">
            Masuk Sebagai
          </span>
          <span className="text-xs font-bold text-white block truncate">
            {currentUser.name}
          </span>
          <span className="text-[10px] text-slate-400 font-mono">
            @{currentUser.username} • {currentUser.role}
          </span>
        </div>

        {/* Profile Settings */}
        {onOpenProfileSettings && (
          <button
            type="button"
            onClick={() => {
              setIsUserMenuOpen(false);
              onOpenProfileSettings();
            }}
            className="w-full flex items-center gap-2 px-3 py-2 text-xs font-medium text-slate-200 hover:text-white hover:bg-slate-800 rounded-xl transition-colors text-left cursor-pointer"
          >
            <UserCog className="w-4 h-4 text-blue-400" />
            <div>
              <div className="font-semibold">Pengaturan Profil</div>
              <div className="text-[10px] text-slate-400">Ganti nama & kata sandi</div>
            </div>
          </button>
        )}

        {/* User Management (Root / Superadmin) */}
        {(currentUser.isRoot || currentUser.username === "admin" || currentUser.username === "root" || currentUser.role?.toLowerCase().replace(/[\s_-]/g, "") === "superadmin") && onOpenUserManagement && (
          <button
            type="button"
            onClick={() => {
              setIsUserMenuOpen(false);
              onOpenUserManagement();
            }}
            className="w-full flex items-center gap-2 px-3 py-2 text-xs font-medium text-slate-200 hover:text-white hover:bg-slate-800 rounded-xl transition-colors text-left cursor-pointer"
          >
            <UserPlus className="w-4 h-4 text-purple-400" />
            <div>
              <div className="font-semibold">Kelola Pengguna</div>
              <div className="text-[10px] text-purple-300">Tambah user & atur role</div>
            </div>
          </button>
        )}

        {/* Audit Log shortcut (Superadmin) */}
        {(currentUser.role?.toLowerCase().replace(/[\s_-]/g, "") === "superadmin" || currentUser.isRoot || currentUser.username === "admin" || currentUser.username === "root") && (
          <button
            type="button"
            onClick={() => {
              setIsUserMenuOpen(false);
              onTabChange("audit");
            }}
            className="w-full flex items-center gap-2 px-3 py-2 text-xs font-medium text-slate-200 hover:text-white hover:bg-slate-800 rounded-xl transition-colors text-left cursor-pointer"
          >
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <div>
              <div className="font-semibold">Audit Log</div>
              <div className="text-[10px] text-slate-400">Lihat jejak aktivitas</div>
            </div>
          </button>
        )}

        <div className="my-1 border-t border-slate-800/80" />

        {/* Logout */}
        {onLogout && (
          <button
            type="button"
            onClick={() => {
              setIsUserMenuOpen(false);
              onLogout();
            }}
            className="w-full flex items-center gap-2 px-3 py-2 text-xs font-medium text-rose-300 hover:text-rose-200 hover:bg-rose-500/10 rounded-xl transition-colors text-left cursor-pointer"
          >
            <LogOut className="w-4 h-4 text-rose-400" />
            <span>Logout dari Sistem</span>
          </button>
        )}
      </>
    );
  };

  return (
    <header className="bg-slate-900 border-b border-slate-800 text-white sticky top-0 z-30 shadow-md">
      <div className="w-full px-3 sm:px-6 lg:px-8 xl:px-10">
        
        {/* Responsive Header: Stacked row on < 2xl to prevent any menu overlap, single line on >= 2xl */}
        <div className="flex flex-col 2xl:flex-row 2xl:items-center 2xl:justify-between py-2 sm:py-2.5 gap-2.5 2xl:gap-4">
          
          {/* Top Row (Mobile/Laptop) or Left Side (Large Display) */}
          <div className="flex items-center justify-between gap-3 w-full 2xl:w-auto">
            {/* Logo & System Brand */}
            <div className="flex items-center gap-2.5 sm:gap-3 shrink-0">
              <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-slate-800/90 border border-slate-700/80 p-1 flex items-center justify-center shrink-0 shadow-inner overflow-hidden">
                <Image
                  src="/logo.png"
                  alt="Logo PT. Usaha Jayamas Bhakti"
                  width={38}
                  height={38}
                  className="object-contain"
                  priority
                />
              </div>
              <div>
                <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
                  <span className="text-[10px] sm:text-[11px] font-bold tracking-wider text-blue-400 uppercase font-mono">
                    PT. USAHA JAYAMAS BHAKTI
                  </span>
                  <span className="text-[8px] sm:text-[9px] font-mono uppercase bg-blue-900/70 text-blue-300 border border-blue-700 px-1.5 py-0.2 rounded font-bold">
                    ME & IT Engineering
                  </span>
                  
                  {/* Turso Cloud Badge */}
                  <div 
                    className="flex items-center gap-1.5 px-2 py-0.5 rounded bg-slate-800/90 border border-slate-700 text-[9px] sm:text-[10px] font-mono cursor-pointer hover:border-emerald-500/50 transition-colors"
                    onClick={onSyncTurso}
                    title="Klik untuk sinkronisasi paksa dengan Turso Cloud DB (AWS AP-Northeast-1)"
                  >
                    <span className={`w-1.5 h-1.5 rounded-full ${isSyncing ? "bg-blue-400 animate-spin" : "bg-emerald-400 animate-pulse"}`}></span>
                    <span className="text-slate-300 font-semibold">{isSyncing ? "Syncing..." : "Turso DB"}</span>
                    {dbLatency !== null && !isSyncing && (
                      <span className="text-emerald-400 font-bold hidden sm:inline">({dbLatency}ms)</span>
                    )}
                  </div>
                </div>

                <h1 className="text-xs sm:text-sm font-bold tracking-tight text-white leading-tight mt-0.5 truncate">
                  Monitoring Operasional Teknik (WO / SPK)
                </h1>
              </div>
            </div>

            {/* When screen < 2xl: Quick action buttons on top row right side */}
            <div className="flex items-center gap-2 2xl:hidden shrink-0">
              <button
                type="button"
                onClick={onNewJobClick}
                className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-500 active:bg-blue-700 text-white text-xs font-semibold px-2.5 sm:px-3 py-1.5 rounded-xl transition-colors shadow-xs shrink-0 cursor-pointer"
              >
                <PlusCircle className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Buat WO / SPK</span>
                <span className="sm:hidden">Buat WO</span>
              </button>

              {currentUser && (
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                    className="flex items-center gap-1.5 bg-slate-800/90 hover:bg-slate-700/80 border border-slate-700/80 rounded-xl p-1 sm:px-2.5 sm:py-1 cursor-pointer transition-colors"
                    title={`Profil: ${currentUser.name} (${currentUser.role})`}
                  >
                    <div className="w-7 h-7 rounded-lg bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white text-xs font-bold font-mono shadow-xs">
                      {currentUser.username.slice(0, 2).toUpperCase()}
                    </div>
                    <span className="text-xs font-bold text-white hidden sm:inline max-w-[90px] truncate">
                      {currentUser.name.split(" ")[0]}
                    </span>
                    <ChevronDown className={`w-3.5 h-3.5 text-slate-400 transition-transform ${isUserMenuOpen ? "rotate-180" : ""}`} />
                  </button>

                  {/* Dropdown Menu for < 2xl */}
                  {isUserMenuOpen && (
                    <>
                      <div className="fixed inset-0 z-40" onClick={() => setIsUserMenuOpen(false)} />
                      <div className="absolute right-0 top-full mt-2 w-56 bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl p-1.5 z-50 animate-in fade-in zoom-in-95 duration-150">
                        {renderUserDropdownContent()}
                      </div>
                    </>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Navigation Bar Row (or Center/Right on >= 2xl) */}
          <div className="flex items-center justify-between 2xl:justify-end gap-2 overflow-x-auto no-scrollbar w-full 2xl:w-auto">
            
            {/* Primary Navigation Tabs */}
            <nav className="flex items-center bg-slate-950/80 p-1 rounded-xl border border-slate-800 gap-1 shrink-0 overflow-x-auto no-scrollbar w-full sm:w-auto justify-start sm:justify-start">
              <button
                type="button"
                onClick={() => onTabChange("dashboard")}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors shrink-0 cursor-pointer ${
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
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors shrink-0 cursor-pointer ${
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
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors shrink-0 cursor-pointer ${
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
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors shrink-0 cursor-pointer ${
                  activeTab === "team"
                    ? "bg-blue-600 text-white shadow-xs"
                    : "text-slate-300 hover:text-white hover:bg-slate-800/80"
                }`}
              >
                <Users className="w-3.5 h-3.5" />
                <span>Master Tim</span>
              </button>

              {/* Audit Log Tab - Only for Superadmin */}
              {(currentUser?.role?.toLowerCase().replace(/[\s_-]/g, "") === "superadmin" || currentUser?.isRoot || currentUser?.username === "admin" || currentUser?.username === "root") && (
                <button
                  type="button"
                  onClick={() => onTabChange("audit")}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors shrink-0 cursor-pointer ${
                    activeTab === "audit"
                      ? "bg-purple-600 text-white shadow-xs"
                      : "text-slate-300 hover:text-white hover:bg-slate-800/80"
                  }`}
                  title="Audit Log Aktivitas Sistem (Khusus Superadmin)"
                >
                  <ShieldCheck className="w-3.5 h-3.5 text-purple-300" />
                  <span>Audit Log</span>
                  <span className="text-[8px] bg-purple-500/30 text-purple-200 border border-purple-400/40 px-1 py-0.2 rounded font-mono font-bold">
                    ROOT
                  </span>
                </button>
              )}
            </nav>

            {/* On >= 2xl screen: Show Buat WO & User Profile Card here */}
            <div className="hidden 2xl:flex items-center gap-2 pl-2 border-l border-slate-800 ml-1 shrink-0 relative">
              <button
                type="button"
                onClick={onNewJobClick}
                className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-500 active:bg-blue-700 text-white text-xs font-semibold px-3 py-1.5 rounded-xl transition-colors shadow-xs shrink-0 cursor-pointer"
              >
                <PlusCircle className="w-3.5 h-3.5" />
                <span>Buat WO / SPK</span>
              </button>

              {currentUser && (
                <div className="relative">
                  <div 
                    onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                    className="flex items-center gap-2 bg-slate-950/70 hover:bg-slate-800 border border-slate-800 hover:border-slate-700 rounded-xl px-2.5 py-1 cursor-pointer transition-colors select-none"
                    title="Klik untuk membuka Pengaturan Profil & Manajemen Akun"
                  >
                    <div className="w-7 h-7 rounded-lg bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white text-xs font-bold font-mono shadow-xs">
                      {currentUser.username.slice(0, 2).toUpperCase()}
                    </div>
                    <div className="text-left">
                      <div className="text-[11px] font-bold text-white leading-tight flex items-center gap-1.5">
                        <span className="max-w-[100px] truncate">{currentUser.name}</span>
                        {currentUser.isRoot || currentUser.username === "admin" || currentUser.username === "root" ? (
                          <span className="text-[8px] bg-amber-500/20 text-amber-300 font-mono px-1 py-0.2 rounded font-bold">ROOT</span>
                        ) : currentUser.role?.toLowerCase() === "superadmin" ? (
                          <span className="text-[8px] bg-purple-500/20 text-purple-300 font-mono px-1 py-0.2 rounded font-bold">SUPER</span>
                        ) : (
                          <span className="text-[8px] bg-blue-500/20 text-blue-300 font-mono px-1 py-0.2 rounded font-semibold">USER</span>
                        )}
                      </div>
                      <div className="text-[10px] text-slate-400 font-medium leading-tight">
                        {currentUser.role}
                      </div>
                    </div>
                    <ChevronDown className={`w-3.5 h-3.5 text-slate-400 transition-transform ${isUserMenuOpen ? "rotate-180" : ""}`} />
                  </div>

                  {/* Dropdown Menu for >= 2xl */}
                  {isUserMenuOpen && (
                    <>
                      <div className="fixed inset-0 z-40" onClick={() => setIsUserMenuOpen(false)} />
                      <div className="absolute right-0 top-full mt-2 w-56 bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl p-1.5 z-50 animate-in fade-in zoom-in-95 duration-150">
                        {renderUserDropdownContent()}
                      </div>
                    </>
                  )}
                </div>
              )}

              {/* Quick Logout Icon Button */}
              {onLogout && (
                <button
                  type="button"
                  onClick={onLogout}
                  title={`Logout (${currentUser?.username})`}
                  className="p-2 bg-slate-950/70 hover:bg-rose-500/20 text-slate-400 hover:text-rose-300 border border-slate-800 hover:border-rose-500/30 rounded-xl text-xs transition-colors cursor-pointer shrink-0"
                  aria-label="Logout"
                >
                  <LogOut className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

          </div>

        </div>

      </div>
    </header>
  );
}
