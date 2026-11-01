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
  HardDrive,
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
  onOpenDriveSettings?: () => void;
  lastUpdatedAt?: Date | null;
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
  onOpenDriveSettings,
  lastUpdatedAt,
}: HeaderProps) {
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);

  const isSuperAdmin =
    currentUser?.isRoot ||
    currentUser?.username === "admin" ||
    currentUser?.username === "root" ||
    currentUser?.role?.toLowerCase().replace(/[\s_-]/g, "") === "superadmin";

  const tabs: {
    id: "dashboard" | "executive" | "input" | "team" | "audit";
    label: string;
    mobileLabel: string;
    icon: React.ReactNode;
    mobileIcon: React.ReactNode;
    activeColor: string;
  }[] = [
    {
      id: "dashboard",
      label: "Operasional",
      mobileLabel: "Operasional",
      icon: <ClipboardList className="w-3.5 h-3.5 shrink-0" />,
      mobileIcon: <ClipboardList className="w-5 h-5" />,
      activeColor: "bg-blue-600",
    },
    {
      id: "executive",
      label: "Executive Cockpit",
      mobileLabel: "Cockpit",
      icon: <BarChart3 className="w-3.5 h-3.5 shrink-0" />,
      mobileIcon: <BarChart3 className="w-5 h-5" />,
      activeColor: "bg-blue-600",
    },
    {
      id: "input",
      label: editingJobNumber ? `Edit (${editingJobNumber})` : "Input WO / SPK",
      mobileLabel: editingJobNumber ? "Edit" : "Input",
      icon: <FileEdit className="w-3.5 h-3.5 shrink-0" />,
      mobileIcon: <FileEdit className="w-5 h-5" />,
      activeColor: "bg-blue-600",
    },
    {
      id: "team",
      label: "Master Tim",
      mobileLabel: "Tim",
      icon: <Users className="w-3.5 h-3.5 shrink-0" />,
      mobileIcon: <Users className="w-5 h-5" />,
      activeColor: "bg-blue-600",
    },
    ...(isSuperAdmin
      ? [
          {
            id: "audit" as const,
            label: "Audit Log",
            mobileLabel: "Audit",
            icon: <ShieldCheck className="w-3.5 h-3.5 shrink-0" />,
            mobileIcon: <ShieldCheck className="w-5 h-5" />,
            activeColor: "bg-purple-600",
          },
        ]
      : []),
  ];

  const renderDropdown = () => {
    if (!currentUser) return null;
    return (
      <>
        <div className="px-3 py-2 border-b border-slate-800/80 mb-1">
          <span className="text-[10px] text-slate-400 uppercase font-mono tracking-wider block">
            Masuk Sebagai
          </span>
          <span className="text-xs font-bold text-white block truncate">{currentUser.name}</span>
          <span className="text-[10px] text-slate-400 font-mono">
            @{currentUser.username} • {currentUser.role}
          </span>
        </div>

        {onOpenProfileSettings && (
          <button type="button" onClick={() => { setIsUserMenuOpen(false); onOpenProfileSettings(); }}
            className="w-full flex items-center gap-2 px-3 py-2 text-xs font-medium text-slate-200 hover:text-white hover:bg-slate-800 rounded-xl transition-colors text-left cursor-pointer">
            <UserCog className="w-4 h-4 text-blue-400 shrink-0" />
            <div>
              <div className="font-semibold">Pengaturan Profil</div>
              <div className="text-[10px] text-slate-400">Ganti nama & kata sandi</div>
            </div>
          </button>
        )}

        {isSuperAdmin && onOpenUserManagement && (
          <button type="button" onClick={() => { setIsUserMenuOpen(false); onOpenUserManagement(); }}
            className="w-full flex items-center gap-2 px-3 py-2 text-xs font-medium text-slate-200 hover:text-white hover:bg-slate-800 rounded-xl transition-colors text-left cursor-pointer">
            <UserPlus className="w-4 h-4 text-purple-400 shrink-0" />
            <div>
              <div className="font-semibold">Kelola Pengguna</div>
              <div className="text-[10px] text-purple-300">Tambah user & atur role</div>
            </div>
          </button>
        )}

        {onOpenDriveSettings && (
          <button type="button" onClick={() => { setIsUserMenuOpen(false); onOpenDriveSettings(); }}
            className="w-full flex items-center gap-2 px-3 py-2 text-xs font-medium text-slate-200 hover:text-white hover:bg-slate-800 rounded-xl transition-colors text-left cursor-pointer">
            <HardDrive className="w-4 h-4 text-sky-400 shrink-0" />
            <div>
              <div className="font-semibold">Integrasi Google Drive</div>
              <div className="text-[10px] text-slate-400">OAuth 2.0 & folder arsip</div>
            </div>
          </button>
        )}

        <div className="my-1 border-t border-slate-800/80" />

        {onLogout && (
          <button type="button" onClick={() => { setIsUserMenuOpen(false); onLogout(); }}
            className="w-full flex items-center gap-2 px-3 py-2 text-xs font-medium text-rose-300 hover:text-rose-200 hover:bg-rose-500/10 rounded-xl transition-colors text-left cursor-pointer">
            <LogOut className="w-4 h-4 text-rose-400 shrink-0" />
            <span>Logout dari Sistem</span>
          </button>
        )}
      </>
    );
  };

  return (
    <>
      {/* ── TOP HEADER ── */}
      <header className="bg-slate-900 border-b border-slate-800 text-white sticky top-0 z-30 shadow-md">
        <div className="w-full px-3 sm:px-5 lg:px-8">
          <div className="flex items-center justify-between h-14 gap-3">

            {/* LEFT: Logo + brand */}
            <div className="flex items-center gap-2.5 min-w-0 shrink-0">
              <div className="w-8 h-8 rounded-lg bg-slate-800 border border-slate-700 p-1 flex items-center justify-center shrink-0 overflow-hidden">
                <Image src="/logo.png" alt="Logo" width={28} height={28} className="object-contain" priority />
              </div>
              <div className="min-w-0">
                <div className="text-[11px] font-bold text-white leading-none truncate">
                  ME &amp; IT Engineering
                </div>
                <div className="text-[10px] text-slate-400 font-mono leading-tight truncate">
                  PT. Usaha Jayamas Bhakti
                </div>
              </div>
            </div>

            {/* CENTER: Desktop nav tabs — hidden on mobile */}
            <nav className="hidden md:flex items-center bg-slate-950/80 p-1 rounded-xl border border-slate-800 gap-0.5 overflow-x-auto no-scrollbar flex-1 max-w-2xl mx-auto justify-center">
              {tabs.map((tab) => {
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => onTabChange(tab.id)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors shrink-0 cursor-pointer whitespace-nowrap ${
                      isActive
                        ? `${tab.activeColor} text-white shadow-sm`
                        : "text-slate-400 hover:text-white hover:bg-slate-800/80"
                    }`}
                  >
                    {tab.icon}
                    <span className="hidden lg:inline">{tab.label}</span>
                    <span className="lg:hidden">{tab.mobileLabel}</span>
                  </button>
                );
              })}
            </nav>

            {/* RIGHT: Turso + Buat WO + User */}
            <div className="flex items-center gap-2 shrink-0">
              {/* Turso badge — desktop only */}
              <button
                type="button"
                onClick={onSyncTurso}
                title="Klik untuk sinkronisasi Turso Cloud DB"
                className="hidden lg:flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-slate-800/80 border border-slate-700 text-[10px] font-mono hover:border-emerald-500/50 transition-colors cursor-pointer"
              >
                <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${isSyncing ? "bg-blue-400 animate-spin" : "bg-emerald-400 animate-pulse"}`} />
                <span className="text-slate-300">{isSyncing ? "Syncing..." : "Turso DB"}</span>
                {dbLatency !== null && !isSyncing && (
                  <span className="text-emerald-400 font-bold">{dbLatency}ms</span>
                )}
                {lastUpdatedAt && !isSyncing && (
                  <span className="text-slate-500 text-[9px]">
                    {lastUpdatedAt.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
                  </span>
                )}
              </button>

              {/* Buat WO — hidden on mobile */}
              <button
                type="button"
                onClick={onNewJobClick}
                className="hidden sm:flex items-center gap-1.5 bg-blue-600 hover:bg-blue-500 active:bg-blue-700 text-white text-xs font-semibold px-3 py-1.5 rounded-xl transition-colors shadow-sm cursor-pointer whitespace-nowrap"
              >
                <PlusCircle className="w-3.5 h-3.5 shrink-0" />
                <span>Buat WO</span>
              </button>

              {/* User avatar + dropdown */}
              {currentUser && (
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                    className="flex items-center gap-1.5 bg-slate-800/90 hover:bg-slate-700 border border-slate-700 rounded-xl px-2 py-1.5 cursor-pointer transition-colors"
                  >
                    <div className="w-6 h-6 rounded-lg bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white text-[10px] font-bold font-mono shrink-0">
                      {currentUser.username.slice(0, 2).toUpperCase()}
                    </div>
                    <span className="hidden md:block text-xs font-semibold text-white max-w-[80px] truncate">
                      {currentUser.name.split(" ")[0]}
                    </span>
                    <ChevronDown className={`w-3.5 h-3.5 text-slate-400 transition-transform shrink-0 ${isUserMenuOpen ? "rotate-180" : ""}`} />
                  </button>

                  {isUserMenuOpen && (
                    <>
                      <div className="fixed inset-0 z-40" onClick={() => setIsUserMenuOpen(false)} />
                      <div className="absolute right-0 top-full mt-2 w-56 bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl p-1.5 z-50 animate-in fade-in zoom-in-95 duration-150">
                        {renderDropdown()}
                      </div>
                    </>
                  )}
                </div>
              )}
            </div>

          </div>
        </div>
      </header>

      {/* ── BOTTOM NAVBAR (mobile only, < md) ── */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-slate-900 border-t border-slate-800 shadow-[0_-4px_24px_rgba(0,0,0,0.4)]">
        <div className="flex items-stretch">
          {/* Nav tabs */}
          {tabs.map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => onTabChange(tab.id)}
                className={`flex-1 flex flex-col items-center justify-center gap-0.5 py-2.5 px-1 transition-colors cursor-pointer relative ${
                  isActive ? "text-blue-400" : "text-slate-500 hover:text-slate-300"
                }`}
              >
                {isActive && (
                  <span className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-0.5 rounded-full bg-blue-400" />
                )}
                {tab.mobileIcon}
                <span className="text-[10px] font-semibold leading-none">{tab.mobileLabel}</span>
              </button>
            );
          })}


        </div>
      </nav>

      {/* Spacer agar konten tidak tertutup bottom navbar di mobile */}
      
    </>
  );
}
