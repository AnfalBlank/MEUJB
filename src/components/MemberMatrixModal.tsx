"use client";

import React, { useEffect } from "react";
import { 
  X, 
  User, 
  MessageCircle, 
  Phone, 
  Briefcase, 
  DollarSign, 
  CheckCircle2, 
  Clock, 
  Calendar,
  Building2
} from "lucide-react";
import { Technician, WorkOrderJob } from "@/types";
import { formatRupiah, calcPercentage, createWhatsAppUrl } from "@/utils/formatters";

interface MemberMatrixModalProps {
  member: Technician | null;
  jobs: WorkOrderJob[];
  onClose: () => void;
  onJobClick: (job: WorkOrderJob) => void;
}

export function MemberMatrixModal({
  member,
  jobs,
  onClose,
  onJobClick
}: MemberMatrixModalProps) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && member) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [member, onClose]);

  if (!member) return null;

  // Filter jobs where this technician is assigned
  const memberJobs = jobs.filter((j) =>
    j.techs.some((t) => t.name.toLowerCase() === member.name.toLowerCase())
  );

  const total = memberJobs.length;
  const spkCount = memberJobs.filter((j) => j.docType === "SPK").length;
  const woCount = memberJobs.filter((j) => j.docType === "WO").length;

  const doneCount = memberJobs.filter((j) => j.status === "Done").length;
  const pendingCount = memberJobs.filter((j) => j.status === "Pending").length;
  const holdCount = memberJobs.filter((j) => j.status === "Hold").length;
  const cancelCount = memberJobs.filter((j) => j.status === "Cancel").length;

  const totalKasbonReceived = memberJobs.reduce((acc, j) => {
    const techObj = j.techs.find(
      (t) => t.name.toLowerCase() === member.name.toLowerCase()
    );
    return acc + (techObj ? Number(techObj.kasbon || 0) : 0);
  }, 0);

  const waUrl = createWhatsAppUrl(member.phone, `Halo Pak ${member.name}, terkait koordinasi operasional pekerjaan teknik.`);

  return (
    <div 
      className="fixed inset-0 z-40 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5"
      role="dialog"
      aria-modal="true"
      aria-labelledby="member-matrix-title"
    >
      <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] flex flex-col border border-slate-200 overflow-hidden animate-in fade-in duration-150">
        
        {/* Header */}
        <div className="p-4 sm:p-5 bg-slate-900 text-white flex justify-between items-center shrink-0 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-slate-800 border border-slate-700 flex items-center justify-center text-blue-400 shrink-0">
              <User className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 id="member-matrix-title" className="text-base sm:text-lg font-bold text-white">
                  {member.name}
                </h2>
                <span className="text-[11px] font-semibold bg-blue-900/60 text-blue-300 border border-blue-700 px-2 py-0.5 rounded">
                  {member.role}
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                {member.subdiv} • Telp: {member.phone}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <a
              href={waUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors shadow-xs"
            >
              <MessageCircle className="w-3.5 h-3.5" />
              <span>WhatsApp</span>
            </a>
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
              aria-label="Tutup modal"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Modal Scrollable Content */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-5 text-slate-800 flex-1">
          
          {/* Key Stat Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-3 bg-slate-900 text-white rounded-lg">
              <span className="text-[10px] uppercase font-bold text-slate-400 block">Total Beban Tugas</span>
              <div className="text-xl font-bold font-mono mt-1">{total} Dokumen</div>
              <div className="text-[11px] text-slate-400 mt-0.5">Semua jenis penugasan</div>
            </div>

            <div className="p-3 bg-purple-50 border border-purple-200 rounded-lg">
              <span className="text-[10px] uppercase font-bold text-purple-700 block">Surat Perintah Kerja (SPK)</span>
              <div className="text-xl font-bold font-mono text-purple-800 mt-1">{spkCount} SPK</div>
              <div className="text-[11px] font-semibold text-purple-600 mt-0.5">
                {calcPercentage(spkCount, total)} dari total penugasan
              </div>
            </div>

            <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <span className="text-[10px] uppercase font-bold text-blue-700 block">Work Order (WO)</span>
              <div className="text-xl font-bold font-mono text-blue-800 mt-1">{woCount} WO</div>
              <div className="text-[11px] font-semibold text-blue-600 mt-0.5">
                {calcPercentage(woCount, total)} dari total penugasan
              </div>
            </div>

            <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg">
              <span className="text-[10px] uppercase font-bold text-amber-800 block">Akumulasi Kasbon</span>
              <div className="text-base sm:text-lg font-bold font-mono text-amber-900 mt-1">
                {formatRupiah(totalKasbonReceived)}
              </div>
              <div className="text-[11px] text-amber-700 mt-0.5">Total dana lapangan diterima</div>
            </div>
          </div>

          {/* Status Breakdown Grid */}
          <div className="p-4 bg-slate-50 border border-slate-200 rounded-lg space-y-2.5">
            <h3 className="text-xs font-bold uppercase text-slate-700">
              Matriks Distribusi Status Pekerjaan ({member.name})
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-center font-mono">
              <div className="bg-white p-2.5 rounded border border-emerald-200">
                <div className="text-base font-bold text-emerald-600">{doneCount}</div>
                <div className="text-xs font-semibold text-emerald-700 font-sans">
                  Done ({calcPercentage(doneCount, total)})
                </div>
              </div>
              <div className="bg-white p-2.5 rounded border border-amber-200">
                <div className="text-base font-bold text-amber-600">{pendingCount}</div>
                <div className="text-xs font-semibold text-amber-700 font-sans">
                  Pending ({calcPercentage(pendingCount, total)})
                </div>
              </div>
              <div className="bg-white p-2.5 rounded border border-indigo-200">
                <div className="text-base font-bold text-indigo-600">{holdCount}</div>
                <div className="text-xs font-semibold text-indigo-700 font-sans">
                  Hold ({calcPercentage(holdCount, total)})
                </div>
              </div>
              <div className="bg-white p-2.5 rounded border border-rose-200">
                <div className="text-base font-bold text-rose-600">{cancelCount}</div>
                <div className="text-xs font-semibold text-rose-700 font-sans">
                  Cancel ({calcPercentage(cancelCount, total)})
                </div>
              </div>
            </div>
          </div>

          {/* Assignment History List */}
          <div className="space-y-2">
            <h3 className="text-xs font-bold uppercase text-slate-700">
              Riwayat Pekerjaan & Proyek Lapangan
            </h3>
            {memberJobs.length === 0 ? (
              <div className="p-8 text-center bg-slate-50 rounded-lg border border-slate-200 text-slate-400 text-xs">
                Belum ada catatan pekerjaan untuk personil ini.
              </div>
            ) : (
              <div className="divide-y divide-slate-200 border border-slate-200 rounded-lg overflow-hidden bg-white">
                {memberJobs.map((j) => {
                  const techInfo = j.techs.find(
                    (t) => t.name.toLowerCase() === member.name.toLowerCase()
                  );
                  const badgeColor = 
                    j.status === "Done" ? "bg-emerald-50 text-emerald-700 border-emerald-200" :
                    j.status === "Pending" ? "bg-amber-50 text-amber-700 border-amber-200" :
                    j.status === "Hold" ? "bg-indigo-50 text-indigo-700 border-indigo-200" :
                    "bg-rose-50 text-rose-700 border-rose-200";

                  return (
                    <div 
                      key={j.id}
                      className="p-3 hover:bg-slate-50 flex flex-col sm:flex-row justify-between sm:items-center gap-2 text-xs transition-colors"
                    >
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold ${
                            j.docType === "WO" ? "bg-blue-100 text-blue-800" : "bg-purple-100 text-purple-800"
                          }`}>
                            {j.docType}
                          </span>
                          <button
                            type="button"
                            onClick={() => {
                              onClose();
                              onJobClick(j);
                            }}
                            className="font-mono font-bold text-blue-600 hover:text-blue-800 hover:underline"
                          >
                            {j.docNumber}
                          </button>
                          <span className="text-slate-400 font-mono text-[11px]">• {j.date}</span>
                        </div>
                        <div className="font-semibold text-slate-800 mt-1 flex items-center gap-1.5">
                          <Building2 className="w-3 h-3 text-slate-400 shrink-0" />
                          <span className="truncate max-w-sm sm:max-w-md">{j.customer}</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <span className="px-2 py-1 bg-slate-100 rounded font-mono font-semibold text-[11px] text-slate-700">
                          Kasbon: {formatRupiah(techInfo ? techInfo.kasbon : 0)}
                        </span>
                        <span className={`px-2 py-0.5 rounded-full text-[11px] font-semibold border ${badgeColor}`}>
                          {j.status}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

        </div>

        {/* Footer */}
        <div className="p-3.5 bg-slate-50 border-t border-slate-200 flex justify-end shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg border border-slate-300 text-slate-700 text-xs font-semibold hover:bg-slate-100 transition-colors"
          >
            Tutup
          </button>
        </div>

      </div>
    </div>
  );
}
