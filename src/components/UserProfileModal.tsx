"use client";

import React, { useState } from "react";
import { 
  X, 
  User, 
  Lock, 
  Eye, 
  EyeOff, 
  ShieldCheck, 
  Save, 
  AlertCircle, 
  CheckCircle2, 
  KeyRound,
  Sparkles,
  UserPlus
} from "lucide-react";
import { AuthUser } from "@/types";

interface UserProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: AuthUser;
  onProfileUpdated: (updatedUser: AuthUser) => void;
  onShowToast: (msg: string, type?: "success" | "error" | "info") => void;
  onOpenUserManagement?: () => void;
}

export function UserProfileModal({
  isOpen,
  onClose,
  currentUser,
  onProfileUpdated,
  onShowToast,
  onOpenUserManagement,
}: UserProfileModalProps) {

  const [displayName, setDisplayName] = useState(currentUser.name || "");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  if (!isOpen) return null;

  const roleNormalized = String(currentUser.role || "").toLowerCase().replace(/[\s_-]/g, "");
  const roleLabel = 
    roleNormalized === "superadmin" ? "Super Admin" :
    roleNormalized === "admin" ? "Admin" :
    roleNormalized === "manager" ? "Manager" : currentUser.role;

  const roleBadgeColor =
    roleNormalized === "superadmin"
      ? "bg-purple-100 text-purple-700 border-purple-200"
      : roleNormalized === "admin"
      ? "bg-blue-100 text-blue-700 border-blue-200"
      : "bg-emerald-100 text-emerald-700 border-emerald-200";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage("");

    const cleanName = displayName.trim();
    if (!cleanName) {
      setErrorMessage("Nama tampilan tidak boleh kosong.");
      return;
    }

    if (isChangingPassword) {
      if (!currentPassword) {
        setErrorMessage("Silakan masukkan kata sandi saat ini untuk verifikasi keamanan.");
        return;
      }
      if (!newPassword || newPassword.length < 5) {
        setErrorMessage("Kata sandi baru minimal 5 karakter.");
        return;
      }
      if (newPassword !== confirmPassword) {
        setErrorMessage("Konfirmasi kata sandi baru tidak cocok.");
        return;
      }
    }

    setIsLoading(true);

    try {
      const res = await fetch("/api/users/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: currentUser.username,
          name: cleanName,
          currentPassword: isChangingPassword ? currentPassword : "",
          newPassword: isChangingPassword ? newPassword : "",
        }),
      });

      const data = await res.json();

      if (res.ok && data.success) {
        const updatedUser: AuthUser = {
          ...currentUser,
          name: cleanName,
        };
        onProfileUpdated(updatedUser);
        onShowToast(
          isChangingPassword
            ? "Nama tampilan & kata sandi berhasil diperbarui!"
            : "Nama tampilan berhasil diperbarui!",
          "success"
        );
        onClose();
      } else {
        setErrorMessage(data.error || "Gagal memperbarui profil.");
      }
    } catch (err: any) {
      console.error("Profile update error:", err);
      setErrorMessage("Terjadi gangguan jaringan saat memperbarui profil.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in duration-150">
      <div 
        className="bg-white border border-slate-200 rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="bg-gradient-to-r from-slate-900 via-slate-850 to-slate-900 text-white p-5 flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white font-bold text-sm shadow-md">
              <User className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <span>Pengaturan Profil Akun</span>
              </h2>
              <p className="text-xs text-slate-400">
                Kelola nama tampilan dan kata sandi login Anda
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
            aria-label="Tutup"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-5 sm:p-6 space-y-5">
          {/* Error Banner */}
          {errorMessage && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs flex items-center gap-2 animate-in fade-in">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
              <span className="font-medium">{errorMessage}</span>
            </div>
          )}

          {/* Account Overview Card */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-blue-600 text-white font-bold text-xs flex items-center justify-center font-mono">
                {currentUser.username.slice(0, 2).toUpperCase()}
              </div>
              <div>
                <span className="text-[11px] text-slate-400 font-medium block">
                  Username Akun
                </span>
                <span className="text-xs font-mono font-bold text-slate-800">
                  @{currentUser.username}
                </span>
              </div>
            </div>
            <div className="text-right">
              <span className="text-[11px] text-slate-400 font-medium block mb-0.5">
                Role Akses
              </span>
              <span className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-md border ${roleBadgeColor}`}>
                <ShieldCheck className="w-3 h-3" />
                {roleLabel}
              </span>
            </div>
          </div>

          {/* Root Access User Management Shortcut */}
          {onOpenUserManagement && (currentUser.isRoot || currentUser.username === "admin" || currentUser.username === "root" || currentUser.role?.toLowerCase().replace(/[\s_-]/g, "") === "superadmin") && (
            <div 
              onClick={() => {
                onClose();
                onOpenUserManagement();
              }}
              className="p-3 bg-purple-50/80 hover:bg-purple-100/90 border border-purple-200 rounded-xl flex items-center justify-between cursor-pointer transition-colors group"
            >
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-lg bg-purple-600 text-white flex items-center justify-center shadow-xs">
                  <UserPlus className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-xs font-bold text-purple-900 group-hover:text-purple-950">
                    Manajemen Pengguna Sistem (Root Access)
                  </div>
                  <div className="text-[10px] text-purple-700">
                    Tambah akun baru & kelola hak akses (Superadmin, Admin, Manager)
                  </div>
                </div>
              </div>
              <span className="text-[10px] font-bold font-mono bg-purple-200/80 text-purple-900 px-2 py-0.5 rounded-md border border-purple-300">
                BUKA
              </span>
            </div>
          )}

          {/* Field: Display Name */}

          <div>
            <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block mb-1.5">
              Nama Tampilan (Display Name) <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                <User className="w-4 h-4" />
              </div>
              <input
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="Contoh: Bagus Pratama"
                required
                className="w-full bg-white border border-slate-300 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-900 placeholder-slate-400 focus:outline-hidden focus:border-blue-600 focus:ring-2 focus:ring-blue-600/20 transition-all font-medium"
              />
            </div>
            <span className="text-[11px] text-slate-500 mt-1 block">
              Nama ini akan tampil di seluruh antarmuka dan laporan resmi internal.
            </span>
          </div>

          {/* Password Change Toggle */}
          <div className="pt-2 border-t border-slate-100">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-xs font-bold text-slate-800 block">
                  Ubah Kata Sandi
                </span>
                <span className="text-[11px] text-slate-500">
                  Tingkatkan keamanan akun Anda secara berkala
                </span>
              </div>
              <button
                type="button"
                onClick={() => {
                  setIsChangingPassword(!isChangingPassword);
                  setErrorMessage("");
                }}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all cursor-pointer ${
                  isChangingPassword
                    ? "bg-rose-50 border-rose-200 text-rose-700"
                    : "bg-slate-100 hover:bg-slate-200 border-slate-300 text-slate-700"
                }`}
              >
                {isChangingPassword ? "Batalkan Ubah Sandi" : "Ganti Sandi"}
              </button>
            </div>

            {/* Password Fields */}
            {isChangingPassword && (
              <div className="mt-4 p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3.5 animate-in fade-in slide-in-from-top-2 duration-150">
                
                {/* Current Password */}
                <div>
                  <label className="text-[11px] font-bold text-slate-700 uppercase tracking-wider block mb-1">
                    Kata Sandi Saat Ini <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                      <KeyRound className="w-4 h-4" />
                    </div>
                    <input
                      type={showPassword ? "text" : "password"}
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      placeholder="Masukkan kata sandi lama Anda"
                      className="w-full bg-white border border-slate-300 rounded-xl pl-9 pr-10 py-2 text-xs text-slate-900 placeholder-slate-400 focus:outline-hidden focus:border-blue-600 focus:ring-2 focus:ring-blue-600/20 font-mono"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* New Password */}
                <div>
                  <label className="text-[11px] font-bold text-slate-700 uppercase tracking-wider block mb-1">
                    Kata Sandi Baru <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                      <Lock className="w-4 h-4" />
                    </div>
                    <input
                      type={showPassword ? "text" : "password"}
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="Minimal 5 karakter"
                      className="w-full bg-white border border-slate-300 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-900 placeholder-slate-400 focus:outline-hidden focus:border-blue-600 focus:ring-2 focus:ring-blue-600/20 font-mono"
                    />
                  </div>
                </div>

                {/* Confirm New Password */}
                <div>
                  <label className="text-[11px] font-bold text-slate-700 uppercase tracking-wider block mb-1">
                    Ulangi Kata Sandi Baru <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                      <CheckCircle2 className="w-4 h-4" />
                    </div>
                    <input
                      type={showPassword ? "text" : "password"}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Ketik ulang kata sandi baru"
                      className="w-full bg-white border border-slate-300 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-900 placeholder-slate-400 focus:outline-hidden focus:border-blue-600 focus:ring-2 focus:ring-blue-600/20 font-mono"
                    />
                  </div>
                </div>

              </div>
            )}
          </div>

          {/* Modal Footer Actions */}
          <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              disabled={isLoading}
              className="px-4 py-2 border border-slate-300 text-slate-700 hover:bg-slate-50 text-xs font-semibold rounded-xl transition-colors cursor-pointer"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white text-xs font-bold rounded-xl shadow-sm transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-60"
            >
              <Save className="w-4 h-4" />
              <span>{isLoading ? "Menyimpan Perubahan..." : "Simpan Perubahan"}</span>
            </button>
          </div>

        </form>
      </div>
    </div>
  );
}
