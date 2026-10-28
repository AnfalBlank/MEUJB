"use client";

import React, { useState } from "react";
import { 
  Users, 
  UserPlus, 
  Search, 
  MessageCircle, 
  Edit2, 
  Trash2, 
  Activity, 
  Phone, 
  Briefcase, 
  ShieldCheck,
  CheckCircle2,
  X
} from "lucide-react";
import { Technician, WorkOrderJob, SubDivision } from "@/types";
import { ALL_SUB_DIVISIONS } from "@/data/initialData";
import { formatRupiah, createWhatsAppUrl } from "@/utils/formatters";

interface TeamViewProps {
  teamMembers: Technician[];
  jobs: WorkOrderJob[];
  onSaveMember: (member: Technician) => void;
  onDeleteMember: (id: string) => void;
  onOpenMemberMatrix: (member: Technician) => void;
  onShowToast: (message: string, type?: "success" | "error" | "info") => void;
}

export function TeamView({
  teamMembers,
  jobs,
  onSaveMember,
  onDeleteMember,
  onOpenMemberMatrix,
  onShowToast
}: TeamViewProps) {
  // Form State
  const [editingId, setEditingId] = useState<string | null>(null);
  const [name, setName] = useState<string>("");
  const [role, setRole] = useState<"Supervisor" | "Teknisi" | "Drafter" | "Manager" | "Marketing">("Teknisi");
  const [phone, setPhone] = useState<string>("");
  const [subdiv, setSubdiv] = useState<string>("Fueling System Engineering");

  // Filter State
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [filterSubdiv, setFilterSubdiv] = useState<string>("ALL");

  const startEdit = (m: Technician) => {
    setEditingId(m.id);
    setName(m.name);
    setRole(m.role);
    setPhone(m.phone);
    setSubdiv(m.subdiv);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setName("");
    setRole("Teknisi");
    setPhone("");
    setSubdiv("Fueling System Engineering");
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      onShowToast("Nama Personil wajib diisi!", "error");
      return;
    }
    if (!phone.trim()) {
      onShowToast("Nomor WhatsApp/HP wajib diisi!", "error");
      return;
    }

    const payload: Technician = {
      id: editingId || "tech-" + Date.now(),
      name: name.trim(),
      role,
      phone: phone.trim(),
      subdiv
    };

    onSaveMember(payload);
    cancelEdit();
  };

  // Filtered list
  const filteredMembers = teamMembers.filter((m) => {
    if (filterSubdiv !== "ALL" && m.subdiv !== filterSubdiv) return false;
    if (searchQuery.trim() !== "") {
      const q = searchQuery.toLowerCase();
      const matchName = m.name.toLowerCase().includes(q);
      const matchRole = m.role.toLowerCase().includes(q);
      const matchPhone = m.phone.toLowerCase().includes(q);
      if (!matchName && !matchRole && !matchPhone) return false;
    }
    return true;
  });

  return (
    <div className="space-y-6">
      
      {/* Top Section: Form Tambah/Edit Personil */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-2xs space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <UserPlus className="w-4 h-4 text-blue-600" />
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-800">
              {editingId ? `Edit Data Personil: ${name}` : "Pendaftaran Personil Baru Teknik & Marketing"}
            </h2>
          </div>
          {editingId && (
            <button
              type="button"
              onClick={cancelEdit}
              className="text-xs text-slate-500 hover:text-slate-800 flex items-center gap-1 font-semibold"
            >
              <X className="w-3.5 h-3.5" />
              <span>Batal Edit</span>
            </button>
          )}
        </div>

        <form onSubmit={handleSubmit} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 text-xs">
          {/* Nama */}
          <div>
            <label className="text-[10px] font-bold text-slate-600 uppercase block mb-1">
              Nama Lengkap <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-xs font-semibold text-slate-900 focus:outline-hidden focus:ring-1 focus:ring-blue-500"
              placeholder="e.g. Andi Pratama"
            />
          </div>

          {/* Jabatan */}
          <div>
            <label className="text-[10px] font-bold text-slate-600 uppercase block mb-1">
              Jabatan / Role
            </label>
            <select
              value={role}
              onChange={(e) => {
                const newRole = e.target.value as any;
                setRole(newRole);
                if (newRole === "Marketing" && subdiv !== "Divisi Marketing") {
                  setSubdiv("Divisi Marketing");
                } else if (newRole !== "Marketing" && subdiv === "Divisi Marketing") {
                  setSubdiv("Fueling System Engineering");
                }
              }}
              className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-xs font-semibold text-slate-900 focus:outline-hidden focus:ring-1 focus:ring-blue-500"
            >
              <option value="Teknisi">Teknisi</option>
              <option value="Supervisor">Supervisor</option>
              <option value="Drafter">Drafter</option>
              <option value="Manager">Manager</option>
              <option value="Marketing">Marketing</option>
            </select>
          </div>

          {/* Sub-Divisi */}
          <div>
            <label className="text-[10px] font-bold text-slate-600 uppercase block mb-1">
              Sub-Divisi
            </label>
            <select
              value={subdiv}
              onChange={(e) => setSubdiv(e.target.value)}
              className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-xs font-semibold text-slate-900 focus:outline-hidden focus:ring-1 focus:ring-blue-500"
            >
              {ALL_SUB_DIVISIONS.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
              <option value="Divisi Marketing">Divisi Marketing</option>
            </select>
          </div>

          {/* Nomor WhatsApp */}
          <div>
            <label className="text-[10px] font-bold text-slate-600 uppercase block mb-1">
              No. WhatsApp / HP <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              required
              className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-xs font-mono text-slate-900 focus:outline-hidden focus:ring-1 focus:ring-blue-500"
              placeholder="e.g. 0812-3456-7802"
            />
          </div>

          {/* Submit Button */}
          <div className="flex items-end">
            <button
              type="submit"
              className={`w-full py-2 px-3 rounded-lg text-xs font-bold text-white transition-colors flex items-center justify-center gap-1.5 shadow-xs ${
                editingId
                  ? "bg-amber-600 hover:bg-amber-500"
                  : "bg-blue-600 hover:bg-blue-500"
              }`}
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>{editingId ? "Update Personil" : "Tambah Personil"}</span>
            </button>
          </div>
        </form>
      </div>

      {/* Main Section: Tabel Master Personil & Beban Kerja */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-2xs space-y-0">
        
        {/* Table Header & Search */}
        <div className="px-4 py-3 bg-slate-900 text-white flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4 text-blue-400" />
            <h3 className="text-xs font-bold uppercase tracking-wider">
              Daftar Personil Tim & Akumulasi Beban Kerja
            </h3>
          </div>

          <div className="flex items-center gap-2">
            <select
              value={filterSubdiv}
              onChange={(e) => setFilterSubdiv(e.target.value)}
              className="bg-slate-800 text-slate-200 border border-slate-700 rounded-lg px-2.5 py-1 text-xs font-semibold focus:outline-hidden"
            >
              <option value="ALL">Semua Divisi</option>
              {ALL_SUB_DIVISIONS.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
              <option value="Divisi Marketing">Marketing</option>
            </select>

            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Cari personil..."
                className="bg-slate-800 text-white border border-slate-700 rounded-lg pl-8 pr-3 py-1 text-xs placeholder-slate-400 focus:outline-hidden focus:ring-1 focus:ring-blue-500 w-36 sm:w-48"
              />
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left min-w-[850px]">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase text-[10px] tracking-wider">
              <tr>
                <th className="p-3 text-center w-10">No</th>
                <th className="p-3">Nama Personil</th>
                <th className="p-3">Jabatan</th>
                <th className="p-3">Sub-Divisi</th>
                <th className="p-3">Kontak WhatsApp</th>
                <th className="p-3 text-center bg-blue-50/50 text-blue-700">Total WO</th>
                <th className="p-3 text-center bg-purple-50/50 text-purple-700">Total SPK</th>
                <th className="p-3 text-center">Total Dokumen</th>
                <th className="p-3 text-right bg-amber-50/50 text-amber-800">Akumulasi Kasbon</th>
                <th className="p-3 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {filteredMembers.length === 0 ? (
                <tr>
                  <td colSpan={10} className="p-8 text-center text-slate-400">
                    Tidak ada personil yang sesuai dengan filter pencarian.
                  </td>
                </tr>
              ) : (
                filteredMembers.map((m, idx) => {
                  // Compute stats for this technician
                  const memberJobs = jobs.filter((j) =>
                    j.techs.some((t) => t.name.toLowerCase() === m.name.toLowerCase())
                  );
                  const totalDocs = memberJobs.length;
                  const woCount = memberJobs.filter((j) => j.docType === "WO").length;
                  const spkCount = memberJobs.filter((j) => j.docType === "SPK").length;

                  const totalKasbon = memberJobs.reduce((acc, j) => {
                    const techObj = j.techs.find(
                      (t) => t.name.toLowerCase() === m.name.toLowerCase()
                    );
                    return acc + (techObj ? Number(techObj.kasbon || 0) : 0);
                  }, 0);

                  const waUrl = createWhatsAppUrl(m.phone, `Halo Pak ${m.name}, terkait koordinasi operasional.`);

                  return (
                    <tr key={m.id} className="hover:bg-slate-50 transition-colors">
                      <td className="p-3 text-center font-mono text-slate-400 font-bold">
                        {idx + 1}
                      </td>

                      {/* Nama */}
                      <td className="p-3">
                        <button
                          type="button"
                          onClick={() => onOpenMemberMatrix(m)}
                          className="font-bold text-slate-900 hover:text-blue-600 hover:underline text-left block"
                        >
                          {m.name}
                        </button>
                      </td>

                      {/* Jabatan */}
                      <td className="p-3">
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-700">
                          {m.role}
                        </span>
                      </td>

                      {/* Sub-Divisi */}
                      <td className="p-3 text-slate-600 font-semibold">
                        {m.subdiv}
                      </td>

                      {/* WhatsApp Link */}
                      <td className="p-3 whitespace-nowrap">
                        <a
                          href={waUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-1.5 text-emerald-700 hover:text-emerald-800 font-mono font-semibold"
                        >
                          <MessageCircle className="w-3.5 h-3.5 text-emerald-600" />
                          <span>{m.phone}</span>
                        </a>
                      </td>

                      {/* Total WO */}
                      <td className="p-3 text-center font-bold font-mono text-blue-700 bg-blue-50/20">
                        {woCount}
                      </td>

                      {/* Total SPK */}
                      <td className="p-3 text-center font-bold font-mono text-purple-700 bg-purple-50/20">
                        {spkCount}
                      </td>

                      {/* Total Jobs */}
                      <td className="p-3 text-center font-bold font-mono text-slate-900">
                        {totalDocs}
                      </td>

                      {/* Akumulasi Kasbon */}
                      <td className="p-3 text-right font-mono font-bold text-amber-900 bg-amber-50/20">
                        {formatRupiah(totalKasbon)}
                      </td>

                      {/* Aksi */}
                      <td className="p-3 text-center whitespace-nowrap">
                        <div className="flex items-center justify-center gap-1">
                          <button
                            type="button"
                            onClick={() => onOpenMemberMatrix(m)}
                            className="px-2 py-1 rounded bg-blue-50 hover:bg-blue-100 text-blue-700 text-xs font-semibold transition-colors flex items-center gap-1"
                            title="Buka Matriks Kinerja"
                          >
                            <Activity className="w-3 h-3" />
                            <span>Matriks</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => startEdit(m)}
                            className="p-1 text-slate-500 hover:text-amber-600 hover:bg-amber-50 rounded transition-colors"
                            title="Edit Data Personil"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => onDeleteMember(m.id)}
                            className="p-1 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded transition-colors"
                            title="Hapus Personil"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
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

    </div>
  );
}
