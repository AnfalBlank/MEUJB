"use client";

import React, { useEffect, useState } from "react";
import { 
  X, 
  PlusCircle, 
  Calendar, 
  UserCheck, 
  Building2, 
  CheckCircle2, 
  Clock, 
  PauseCircle, 
  XCircle,
  Eye,
  Edit2,
  Trash2,
  Fuel,
  Network,
  Zap
} from "lucide-react";
import { WorkOrderJob, SubDivision, JobStatus } from "@/types";
import { formatDateIndo } from "@/utils/formatters";

interface SubdivModalProps {
  subdiv: SubDivision | null;
  jobs: WorkOrderJob[];
  onClose: () => void;
  onJobClick: (job: WorkOrderJob) => void;
  onEditJob: (job: WorkOrderJob) => void;
  onDeleteJob: (id: string) => void;
  onStatusChange: (id: string, newStatus: JobStatus) => void;
  onAddNewForSubdiv: (subdiv: SubDivision) => void;
}

export function SubdivModal({
  subdiv,
  jobs,
  onClose,
  onJobClick,
  onEditJob,
  onDeleteJob,
  onStatusChange,
  onAddNewForSubdiv
}: SubdivModalProps) {
  const [filterStatus, setFilterStatus] = useState<string>("ALL");

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && subdiv) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [subdiv, onClose]);

  if (!subdiv) return null;

  const subdivJobs = jobs.filter((j) => j.subdiv === subdiv);
  const total = subdivJobs.length;
  const woCount = subdivJobs.filter((j) => j.docType === "WO").length;
  const spkCount = subdivJobs.filter((j) => j.docType === "SPK").length;
  const doneCount = subdivJobs.filter((j) => j.status === "Done").length;
  const pendingCount = subdivJobs.filter((j) => j.status === "Pending").length;
  const holdCount = subdivJobs.filter((j) => j.status === "Hold").length;
  const cancelCount = subdivJobs.filter((j) => j.status === "Cancel").length;

  const filteredJobs = subdivJobs.filter((j) => {
    if (filterStatus === "ALL") return true;
    return j.status === filterStatus;
  });

  const getSubdivIcon = () => {
    if (subdiv.includes("Fueling")) return <Fuel className="w-5 h-5 text-amber-400" />;
    if (subdiv.includes("IT")) return <Network className="w-5 h-5 text-indigo-400" />;
    return <Zap className="w-5 h-5 text-emerald-400" />;
  };

  return (
    <div 
      className="fixed inset-0 z-40 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5"
      role="dialog"
      aria-modal="true"
      aria-labelledby="subdiv-modal-title"
    >
      <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] flex flex-col border border-slate-200 overflow-hidden animate-in fade-in duration-150">
        
        {/* Header */}
        <div className="p-4 sm:p-5 bg-slate-900 text-white flex justify-between items-center shrink-0 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-slate-800 border border-slate-700 flex items-center justify-center shrink-0">
              {getSubdivIcon()}
            </div>
            <div>
              <span className="text-[10px] uppercase tracking-wider font-mono bg-blue-900/60 text-blue-300 border border-blue-700 px-2 py-0.5 rounded font-bold">
                Detail & Kontrol Sub-Divisi
              </span>
              <h2 id="subdiv-modal-title" className="text-base sm:text-lg font-bold text-white mt-1">
                {subdiv}
              </h2>
              <p className="text-xs text-slate-400">
                Menampilkan seluruh dokumen WO & SPK penanggung jawab divisi
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                onClose();
                onAddNewForSubdiv(subdiv);
              }}
              className="hidden sm:flex items-center gap-1.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors shadow-xs"
            >
              <PlusCircle className="w-3.5 h-3.5" />
              <span>Tambah Pekerjaan</span>
            </button>
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

        {/* Stats Strip */}
        <div className="grid grid-cols-2 sm:grid-cols-6 gap-2 p-3 bg-slate-50 border-b border-slate-200 text-center shrink-0 font-mono">
          <div className="p-2 bg-white rounded border border-slate-200">
            <span className="text-[10px] text-slate-400 uppercase font-sans font-semibold block">Total</span>
            <span className="text-sm font-bold text-slate-900">{total}</span>
          </div>
          <div className="p-2 bg-white rounded border border-blue-200">
            <span className="text-[10px] text-blue-600 uppercase font-sans font-semibold block">WO</span>
            <span className="text-sm font-bold text-blue-700">{woCount}</span>
          </div>
          <div className="p-2 bg-white rounded border border-purple-200">
            <span className="text-[10px] text-purple-600 uppercase font-sans font-semibold block">SPK</span>
            <span className="text-sm font-bold text-purple-700">{spkCount}</span>
          </div>
          <div className="p-2 bg-white rounded border border-emerald-200">
            <span className="text-[10px] text-emerald-600 uppercase font-sans font-semibold block">Done</span>
            <span className="text-sm font-bold text-emerald-700">{doneCount}</span>
          </div>
          <div className="p-2 bg-white rounded border border-amber-200">
            <span className="text-[10px] text-amber-600 uppercase font-sans font-semibold block">Pending</span>
            <span className="text-sm font-bold text-amber-700">{pendingCount}</span>
          </div>
          <div className="p-2 bg-white rounded border border-slate-200">
            <span className="text-[10px] text-slate-500 uppercase font-sans font-semibold block">Hold/Cancel</span>
            <span className="text-sm font-bold text-slate-700">{holdCount + cancelCount}</span>
          </div>
        </div>

        {/* Status Filter Tabs */}
        <div className="px-4 py-2.5 bg-white border-b border-slate-100 flex items-center justify-between gap-2 overflow-x-auto shrink-0">
          <div className="flex items-center gap-1.5">
            {[
              { id: "ALL", label: "Semua", count: total },
              { id: "Pending", label: "Pending", count: pendingCount },
              { id: "Done", label: "Done", count: doneCount },
              { id: "Hold", label: "Hold", count: holdCount },
              { id: "Cancel", label: "Cancel", count: cancelCount }
            ].map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setFilterStatus(tab.id)}
                className={`px-2.5 py-1 rounded text-xs font-semibold transition-colors flex items-center gap-1 ${
                  filterStatus === tab.id
                    ? "bg-slate-900 text-white"
                    : "text-slate-600 hover:bg-slate-100"
                }`}
              >
                <span>{tab.label}</span>
                <span className="text-[10px] opacity-75 font-mono">({tab.count})</span>
              </button>
            ))}
          </div>

          <button
            type="button"
            onClick={() => {
              onClose();
              onAddNewForSubdiv(subdiv);
            }}
            className="sm:hidden flex items-center gap-1 bg-blue-600 text-white text-xs font-semibold px-2.5 py-1 rounded"
          >
            <PlusCircle className="w-3.5 h-3.5" />
            <span>+ Job</span>
          </button>
        </div>

        {/* Task List */}
        <div className="p-4 sm:p-5 overflow-y-auto space-y-3 flex-1 bg-slate-50">
          {filteredJobs.length === 0 ? (
            <div className="p-8 text-center bg-white border border-slate-200 rounded-lg text-slate-400 text-xs">
              Tidak ada dokumen dengan status filter terpilih pada divisi ini.
            </div>
          ) : (
            filteredJobs.map((job) => (
              <div 
                key={job.id} 
                className="bg-white p-3.5 rounded-lg border border-slate-200 hover:border-slate-300 transition-colors shadow-2xs space-y-2.5"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase ${
                      job.docType === "WO" ? "bg-blue-100 text-blue-800" : "bg-purple-100 text-purple-800"
                    }`}>
                      {job.docType}
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        onClose();
                        onJobClick(job);
                      }}
                      className="text-xs font-bold font-mono text-blue-600 hover:text-blue-800 hover:underline"
                    >
                      {job.docNumber}
                    </button>
                    <span className="text-slate-400 text-[11px] font-mono flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      {formatDateIndo(job.date)}
                    </span>
                  </div>

                  {/* Inline Status Changer */}
                  <div className="flex items-center gap-1">
                    <span className="text-[10px] text-slate-400 uppercase font-semibold mr-1">
                      Ubah Status:
                    </span>
                    {(["Pending", "Done", "Hold", "Cancel"] as JobStatus[]).map((st) => (
                      <button
                        key={st}
                        type="button"
                        onClick={() => onStatusChange(job.id, st)}
                        className={`px-2 py-0.5 rounded text-[10px] font-semibold border transition-colors ${
                          job.status === st
                            ? st === "Done" ? "bg-emerald-600 text-white border-emerald-600"
                              : st === "Pending" ? "bg-amber-600 text-white border-amber-600"
                              : st === "Hold" ? "bg-indigo-600 text-white border-indigo-600"
                              : "bg-rose-600 text-white border-rose-600"
                            : "bg-white text-slate-600 border-slate-200 hover:bg-slate-100"
                        }`}
                      >
                        {st}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="text-xs text-slate-800 font-medium">
                  <div className="flex items-center gap-1.5 text-slate-900 font-bold mb-1">
                    <Building2 className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                    <span>{job.customer}</span>
                  </div>
                  <p className="text-slate-600 text-xs line-clamp-2">
                    {job.desc}
                  </p>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-[11px]">
                  <div className="flex items-center gap-2 text-slate-500">
                    <span className="flex items-center gap-1">
                      <UserCheck className="w-3 h-3 text-slate-400" />
                      {job.marketing}
                    </span>
                    <span>•</span>
                    <span>{job.techs.length} Teknisi</span>
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => {
                        onClose();
                        onJobClick(job);
                      }}
                      className="px-2 py-1 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs flex items-center gap-1"
                    >
                      <Eye className="w-3 h-3" />
                      <span>Detail</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        onClose();
                        onEditJob(job);
                      }}
                      className="px-2 py-1 rounded bg-amber-50 hover:bg-amber-100 text-amber-700 font-semibold text-xs flex items-center gap-1 border border-amber-200"
                    >
                      <Edit2 className="w-3 h-3" />
                      <span>Edit</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => onDeleteJob(job.id)}
                      className="px-2 py-1 rounded bg-rose-50 hover:bg-rose-100 text-rose-700 font-semibold text-xs flex items-center gap-1 border border-rose-200"
                    >
                      <Trash2 className="w-3 h-3" />
                      <span>Hapus</span>
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="p-3.5 bg-white border-t border-slate-200 flex justify-end shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg border border-slate-300 text-slate-700 text-xs font-semibold hover:bg-slate-100 transition-colors"
          >
            Selesai
          </button>
        </div>

      </div>
    </div>
  );
}
