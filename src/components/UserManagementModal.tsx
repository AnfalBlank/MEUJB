"use client";

import React, { useState, useEffect } from "react";
import { 
  X, 
  UserPlus, 
  Users, 
  ShieldCheck, 
  Trash2, 
  Edit3, 
  KeyRound, 
  Search, 
  AlertCircle, 
  CheckCircle2, 
  Lock, 
  ShieldAlert,
  ArrowRight,
  Eye,
  EyeOff
} from "lucide-react";
import { AuthUser, SystemUser, UserRole } from "@/types";

interface UserManagementModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: AuthUser;
  onShowToast: (msg: string, type?: "success" | "error" | "info") => void;
  onConfirmAction: (config: {
    title: string;
    message: string;
    confirmLabel?: string;
    onConfirm: () => void;
  }) => void;
}

const ROLES: { id: UserRole; name: string; desc: string; color: string; badge: string }[] = [
  {
    id: "superadmin",
    name: "Superadmin",
    desc: "Akses penuh sistem, manajemen user, dan melihat Audit Log aktivitas.",
    color: "purple",
    badge: "bg-purple-100 text-purple-700 border-purple-200"
  },
  {
    id: "admin",
    name: "Admin",
    desc: "Mengelola input/edit dokumen WO & SPK, master personil tim, dan laporan.",
    color: "blue",
    badge: "bg-blue-100 text-blue-700 border-blue-200"
  },
  {
    id: "manager",
    name: "Manager",
    desc: "Monitoring Executive Cockpit, review status pekerjaan WO, dan cetak BA.",
    color: "emerald",
    badge: "bg-emerald-100 text-emerald-700 border-emerald-200"
  }
];

export function UserManagementModal({
  isOpen,
  onClose,
  currentUser,
  onShowToast,
  onConfirmAction,
}: UserManagementModalProps) {
  const [users, setUsers] = useState<SystemUser[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>("");
  
  // Add / Edit Modal Sub-state
  const [isFormOpen, setIsFormOpen] = useState<boolean>(false);
  const [editingUserId, setEditingUserId] = useState<string | null>(null);
  const [formData, setFormData] = useState<{
    username: string;
    name: string;
    role: UserRole;
    password: string;
    confirmPassword: string;
  }>({
    username: "",
    name: "",
    role: "admin",
    password: "",
    confirmPassword: "",
  });
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [formError, setFormError] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  // Fetch users from API
  const fetchUsers = async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/users");
      const data = await res.json();
      if (res.ok && data.success && Array.isArray(data.data)) {
        setUsers(data.data);
      }
    } catch (err) {
      console.error("Fetch users error:", err);
      onShowToast("Gagal memuat daftar pengguna dari server", "error");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchUsers();
      setIsFormOpen(false);
      setEditingUserId(null);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleOpenAdd = () => {
    setEditingUserId(null);
    setFormData({
      username: "",
      name: "",
      role: "admin",
      password: "",
      confirmPassword: "",
    });
    setFormError("");
    setIsFormOpen(true);
  };

  const handleOpenEdit = (user: SystemUser) => {
    setEditingUserId(user.id);
    setFormData({
      username: user.username,
      name: user.name,
      role: user.role,
      password: "",
      confirmPassword: "",
    });
    setFormError("");
    setIsFormOpen(true);
  };

  const handleSaveUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError("");

    const cleanUser = formData.username.trim().toLowerCase();
    const cleanName = formData.name.trim();
    const cleanPass = formData.password.trim();

    if (!cleanName) {
      setFormError("Nama lengkap pengguna wajib diisi.");
      return;
    }

    if (!editingUserId) {
      if (!cleanUser) {
        setFormError("Username wajib diisi.");
        return;
      }
      if (cleanUser.length < 3) {
        setFormError("Username minimal 3 karakter.");
        return;
      }
      if (!cleanPass || cleanPass.length < 5) {
        setFormError("Kata sandi minimal 5 karakter.");
        return;
      }
      if (cleanPass !== formData.confirmPassword.trim()) {
        setFormError("Konfirmasi kata sandi tidak cocok.");
        return;
      }
    } else {
      if (cleanPass) {
        if (cleanPass.length < 5) {
          setFormError("Kata sandi baru minimal 5 karakter.");
          return;
        }
        if (cleanPass !== formData.confirmPassword.trim()) {
          setFormError("Konfirmasi kata sandi baru tidak cocok.");
          return;
        }
      }
    }

    setIsSubmitting(true);

    try {
      if (editingUserId) {
        // Edit existing user
        const res = await fetch(`/api/users/${encodeURIComponent(editingUserId)}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            username: cleanUser,
            name: cleanName,
            role: formData.role,
            password: cleanPass || undefined,
            requester: currentUser,
          }),
        });

        const data = await res.json();
        if (res.ok && data.success) {
          onShowToast(`Pengguna "${cleanName}" berhasil diperbarui!`, "success");
          setIsFormOpen(false);
          fetchUsers();
        } else {
          setFormError(data.error || "Gagal memperbarui pengguna.");
        }
      } else {
        // Create new user
        const res = await fetch("/api/users", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            username: cleanUser,
            name: cleanName,
            role: formData.role,
            password: cleanPass,
            requester: currentUser,
          }),
        });

        const data = await res.json();
        if (res.ok && data.success) {
          onShowToast(`User baru "${cleanName}" (@${cleanUser}) berhasil ditambahkan!`, "success");
          setIsFormOpen(false);
          fetchUsers();
        } else {
          setFormError(data.error || "Gagal membuat user.");
        }
      }
    } catch (err: any) {
      console.error("Save user error:", err);
      setFormError("Terjadi gangguan jaringan saat menyimpan user.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteUser = (user: SystemUser) => {
    if (user.isRoot || user.username === "admin" || user.username === "root") {
      onShowToast("Akun Superadmin Root bawaan tidak dapat dihapus demi keamanan.", "error");
      return;
    }

    if (user.username === currentUser.username) {
      onShowToast("Anda tidak dapat menghapus akun Anda sendiri.", "error");
      return;
    }

    onConfirmAction({
      title: "Hapus Pengguna Sistem",
      message: `Apakah Anda yakin ingin menghapus akun "${user.name}" (@${user.username}) dengan role [${user.role}]? Akun ini tidak akan dapat login lagi.`,
      confirmLabel: "Ya, Hapus Pengguna",
      onConfirm: async () => {
        try {
          const res = await fetch(`/api/users/${encodeURIComponent(user.id)}`, {
            method: "DELETE",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ requester: currentUser }),
          });
          const data = await res.json();
          if (res.ok && data.success) {
            onShowToast(`User @${user.username} telah dihapus.`, "info");
            fetchUsers();
          } else {
            onShowToast(data.error || "Gagal menghapus user.", "error");
          }
        } catch (err) {
          onShowToast("Terjadi gangguan jaringan saat menghapus user.", "error");
        }
      },
    });
  };

  const filteredUsers = users.filter((u) => {
    const q = searchQuery.toLowerCase();
    return (
      u.name.toLowerCase().includes(q) ||
      u.username.toLowerCase().includes(q) ||
      u.role.toLowerCase().includes(q)
    );
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in duration-150">
      <div 
        className="bg-white border border-slate-200 rounded-2xl shadow-2xl w-full max-w-4xl max-h-[92vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-slate-900 via-slate-850 to-slate-900 text-white p-5 flex items-center justify-between border-b border-slate-800 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-purple-600 to-indigo-600 flex items-center justify-center text-white font-bold text-sm shadow-md">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-white">
                  Manajemen Pengguna Sistem
                </h2>
                <span className="text-[10px] font-mono bg-purple-500/20 text-purple-300 border border-purple-500/30 px-2 py-0.5 rounded font-bold uppercase">
                  Root Access
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Kelola hak akses dan tambah akun personil (Superadmin, Admin, Manager)
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {!isFormOpen && (
              <button
                type="button"
                onClick={handleOpenAdd}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-500 active:bg-blue-700 text-white text-xs font-semibold rounded-xl shadow-xs transition-colors cursor-pointer"
              >
                <UserPlus className="w-4 h-4" />
                <span>Tambah User</span>
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
              aria-label="Tutup"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Content */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-6">
          
          {/* Form Section (if opened) */}
          {isFormOpen ? (
            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 space-y-5 animate-in fade-in duration-150">
              <div className="flex items-center justify-between border-b border-slate-200 pb-3">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center">
                    {editingUserId ? <Edit3 className="w-4 h-4" /> : <UserPlus className="w-4 h-4" />}
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-900">
                      {editingUserId ? "Edit Data Pengguna" : "Tambah Pengguna Baru"}
                    </h3>
                    <p className="text-[11px] text-slate-500">
                      {editingUserId 
                        ? `Ubah role atau reset kata sandi untuk user @${formData.username}`
                        : "Pastikan role sesuai dengan tanggung jawab pengguna"}
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setIsFormOpen(false)}
                  className="text-xs text-slate-500 hover:text-slate-800 font-medium px-2 py-1 rounded-lg hover:bg-slate-200/60"
                >
                  Kembali ke Daftar
                </button>
              </div>

              {formError && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                  <span className="font-medium">{formError}</span>
                </div>
              )}

              <form onSubmit={handleSaveUser} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Username */}
                  <div>
                    <label className="text-[11px] font-bold text-slate-700 uppercase tracking-wider block mb-1">
                      Username Akun <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={formData.username}
                      onChange={(e) => setFormData({ ...formData, username: e.target.value.toLowerCase().replace(/\s+/g, "") })}
                      disabled={Boolean(editingUserId) && (formData.username === "admin" || formData.username === "root")}
                      placeholder="e.g. bagas.teknik"
                      required
                      className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900 placeholder-slate-400 focus:outline-hidden focus:border-blue-600 focus:ring-2 focus:ring-blue-600/20 font-mono disabled:bg-slate-100 disabled:text-slate-500"
                    />
                    <span className="text-[10px] text-slate-500 mt-0.5 block">
                      Hanya huruf, angka, titik, atau underscore.
                    </span>
                  </div>

                  {/* Display Name */}
                  <div>
                    <label className="text-[11px] font-bold text-slate-700 uppercase tracking-wider block mb-1">
                      Nama Lengkap (Display Name) <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="e.g. Bagas Pratama"
                      required
                      className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900 placeholder-slate-400 focus:outline-hidden focus:border-blue-600 focus:ring-2 focus:ring-blue-600/20 font-medium"
                    />
                  </div>
                </div>

                {/* Role Selector: 3 ROLES ONLY */}
                <div>
                  <label className="text-[11px] font-bold text-slate-700 uppercase tracking-wider block mb-2">
                    Pilih Role Pengguna <span className="text-rose-500">*</span>
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    {ROLES.map((r) => {
                      const isSelected = formData.role === r.id;
                      return (
                        <div
                          key={r.id}
                          onClick={() => setFormData({ ...formData, role: r.id })}
                          className={`p-3 rounded-xl border cursor-pointer transition-all ${
                            isSelected
                              ? "bg-white border-blue-600 ring-2 ring-blue-600/20 shadow-xs"
                              : "bg-white/70 border-slate-200 hover:border-slate-300 hover:bg-white"
                          }`}
                        >
                          <div className="flex items-center justify-between mb-1">
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md border ${r.badge}`}>
                              {r.name}
                            </span>
                            {isSelected && (
                              <CheckCircle2 className="w-4 h-4 text-blue-600" />
                            )}
                          </div>
                          <p className="text-[11px] text-slate-500 leading-snug mt-1">
                            {r.desc}
                          </p>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Password Fields */}
                <div className="pt-2 border-t border-slate-200">
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-[11px] font-bold text-slate-700 uppercase tracking-wider block">
                      {editingUserId ? "Reset Kata Sandi (Opsional)" : "Kata Sandi Akun"} 
                      {!editingUserId && <span className="text-rose-500"> *</span>}
                    </label>
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="text-[11px] text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1"
                    >
                      {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                      <span>{showPassword ? "Sembunyikan" : "Perlihatkan"}</span>
                    </button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <input
                        type={showPassword ? "text" : "password"}
                        value={formData.password}
                        onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                        placeholder={editingUserId ? "Kosongkan jika tidak diubah" : "Minimal 5 karakter"}
                        required={!editingUserId}
                        className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900 placeholder-slate-400 focus:outline-hidden focus:border-blue-600 focus:ring-2 focus:ring-blue-600/20 font-mono"
                      />
                    </div>
                    <div>
                      <input
                        type={showPassword ? "text" : "password"}
                        value={formData.confirmPassword}
                        onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                        placeholder={editingUserId ? "Konfirmasi sandi baru jika diubah" : "Ulangi kata sandi"}
                        required={!editingUserId || Boolean(formData.password)}
                        className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900 placeholder-slate-400 focus:outline-hidden focus:border-blue-600 focus:ring-2 focus:ring-blue-600/20 font-mono"
                      />
                    </div>
                  </div>
                </div>

                {/* Submit Action */}
                <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-200">
                  <button
                    type="button"
                    onClick={() => setIsFormOpen(false)}
                    disabled={isSubmitting}
                    className="px-4 py-2 border border-slate-300 text-slate-700 hover:bg-slate-100 text-xs font-semibold rounded-xl cursor-pointer"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="px-5 py-2 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white text-xs font-bold rounded-xl shadow-xs transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-60"
                  >
                    <span>{isSubmitting ? "Menyimpan Data..." : editingUserId ? "Simpan Perubahan" : "Buat Akun User"}</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </form>
            </div>
          ) : null}

          {/* Role System Explanatory Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="p-3 bg-purple-50/70 border border-purple-200/80 rounded-xl">
              <div className="flex items-center gap-1.5 text-purple-800 font-bold text-xs mb-1">
                <ShieldCheck className="w-3.5 h-3.5 text-purple-600" />
                <span>Superadmin</span>
              </div>
              <p className="text-[11px] text-purple-900/80 leading-relaxed">
                Akses tertinggi, manajemen pengguna penuh, serta melihat <strong>Audit Log</strong> aktivitas seluruh user.
              </p>
            </div>

            <div className="p-3 bg-blue-50/70 border border-blue-200/80 rounded-xl">
              <div className="flex items-center gap-1.5 text-blue-800 font-bold text-xs mb-1">
                <Users className="w-3.5 h-3.5 text-blue-600" />
                <span>Admin</span>
              </div>
              <p className="text-[11px] text-blue-900/80 leading-relaxed">
                Input & pembaruan dokumen WO/SPK, kelola Master Tim personil, cetak BA, dan ekspor data CSV/JSON.
              </p>
            </div>

            <div className="p-3 bg-emerald-50/70 border border-emerald-200/80 rounded-xl">
              <div className="flex items-center gap-1.5 text-emerald-800 font-bold text-xs mb-1">
                <ShieldAlert className="w-3.5 h-3.5 text-emerald-600" />
                <span>Manager</span>
              </div>
              <p className="text-[11px] text-emerald-900/80 leading-relaxed">
                Cockpit eksekutif, analisa performa personil, review status penyelesaian pekerjaan & kasbon lapangan.
              </p>
            </div>
          </div>

          {/* User List Header & Filter */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-2">
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold text-slate-800">
                Daftar Pengguna Aktif
              </h3>
              <span className="text-xs bg-slate-100 text-slate-700 px-2 py-0.5 rounded-full font-mono font-bold">
                {users.length} User
              </span>
            </div>

            <div className="relative w-full sm:w-64">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Cari user / role..."
                className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-8 pr-3 py-1.5 text-xs text-slate-800 placeholder-slate-400 focus:bg-white focus:outline-hidden focus:border-blue-600 transition-all font-medium"
              />
            </div>
          </div>

          {/* Users Table */}
          <div className="border border-slate-200 rounded-xl overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-100/80 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider text-[10px]">
                  <tr>
                    <th className="py-2.5 px-3">Pengguna</th>
                    <th className="py-2.5 px-3">Role Akses</th>
                    <th className="py-2.5 px-3 hidden sm:table-cell">Terakhir Login</th>
                    <th className="py-2.5 px-3 hidden md:table-cell">Dibuat</th>
                    <th className="py-2.5 px-3 text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 bg-white">
                  {isLoading ? (
                    <tr>
                      <td colSpan={5} className="py-8 text-center text-slate-400">
                        <div className="flex items-center justify-center gap-2">
                          <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                          <span>Memuat daftar user...</span>
                        </div>
                      </td>
                    </tr>
                  ) : filteredUsers.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="py-8 text-center text-slate-400">
                        Tidak ada pengguna yang cocok dengan pencarian.
                      </td>
                    </tr>
                  ) : (
                    filteredUsers.map((u) => {
                      const isRootUser = u.isRoot || u.username === "admin" || u.username === "root";
                      const roleMeta = ROLES.find((r) => r.id === u.role) || {
                        name: u.role,
                        badge: "bg-slate-100 text-slate-700 border-slate-200"
                      };

                      return (
                        <tr key={u.id} className="hover:bg-slate-50/80 transition-colors">
                          <td className="py-3 px-3">
                            <div className="flex items-center gap-2.5">
                              <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-slate-700 to-slate-900 text-white font-mono font-bold text-xs flex items-center justify-center shrink-0">
                                {u.username.slice(0, 2).toUpperCase()}
                              </div>
                              <div>
                                <div className="font-bold text-slate-900 flex items-center gap-1.5">
                                  <span>{u.name}</span>
                                  {isRootUser && (
                                    <span className="text-[9px] bg-amber-100 text-amber-800 border border-amber-300 font-mono font-bold px-1.5 py-0.2 rounded">
                                      ROOT
                                    </span>
                                  )}
                                  {u.username === currentUser.username && (
                                    <span className="text-[9px] bg-blue-100 text-blue-800 border border-blue-200 font-semibold px-1 py-0.2 rounded">
                                      Anda
                                    </span>
                                  )}
                                </div>
                                <span className="text-[11px] text-slate-400 font-mono">
                                  @{u.username}
                                </span>
                              </div>
                            </div>
                          </td>

                          <td className="py-3 px-3">
                            <span className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-md border ${roleMeta.badge}`}>
                              <ShieldCheck className="w-3 h-3" />
                              {roleMeta.name}
                            </span>
                          </td>

                          <td className="py-3 px-3 hidden sm:table-cell text-slate-500 font-mono text-[11px]">
                            {u.lastLoginAt ? (
                              new Date(u.lastLoginAt).toLocaleString("id-ID", {
                                day: "numeric",
                                month: "short",
                                hour: "2-digit",
                                minute: "2-digit",
                              })
                            ) : (
                              <span className="text-slate-400 italic">Belum pernah</span>
                            )}
                          </td>

                          <td className="py-3 px-3 hidden md:table-cell text-slate-400 font-mono text-[11px]">
                            {u.createdAt ? u.createdAt.split("T")[0] : "-"}
                          </td>

                          <td className="py-3 px-3 text-right">
                            <div className="flex items-center justify-end gap-1">
                              <button
                                type="button"
                                onClick={() => handleOpenEdit(u)}
                                className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors cursor-pointer"
                                title="Edit Pengguna"
                              >
                                <Edit3 className="w-4 h-4" />
                              </button>

                              {!isRootUser && u.username !== currentUser.username && (
                                <button
                                  type="button"
                                  onClick={() => handleDeleteUser(u)}
                                  className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                                  title="Hapus Pengguna"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              )}
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

        </div>

        {/* Footer */}
        <div className="bg-slate-50 p-4 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500 shrink-0">
          <span className="font-mono text-[11px]">
            Role terdaftar: <strong className="text-slate-700">superadmin</strong>, <strong className="text-slate-700">admin</strong>, <strong className="text-slate-700">manager</strong>
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-800 font-semibold rounded-lg transition-colors cursor-pointer"
          >
            Tutup
          </button>
        </div>

      </div>
    </div>
  );
}
