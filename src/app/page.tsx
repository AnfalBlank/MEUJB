"use client";

import React, { useState, useEffect, useCallback } from "react";
import { Header } from "@/components/Header";
import { ToastContainer, ToastMessage } from "@/components/Toast";
import { ConfirmModal } from "@/components/ConfirmModal";
import { JobDetailModal } from "@/components/JobDetailModal";
import { SubdivModal } from "@/components/SubdivModal";
import { MemberMatrixModal } from "@/components/MemberMatrixModal";
import { DashboardView } from "@/components/DashboardView";
import { ExecutiveDashboardView } from "@/components/ExecutiveDashboardView";
import { InputView } from "@/components/InputView";
import { TeamView } from "@/components/TeamView";
import { WorkOrderJob, Technician, SubDivision, JobStatus } from "@/types";
import { INITIAL_JOBS, INITIAL_TECHNICIANS } from "@/data/initialData";

const JOBS_STORAGE_KEY = "me_engineering_jobs_v1";
const TEAM_STORAGE_KEY = "me_engineering_team_v1";

export default function HomePage() {
  const [activeTab, setActiveTab] = useState<"dashboard" | "executive" | "input" | "team">("dashboard");
  const [jobs, setJobs] = useState<WorkOrderJob[]>(INITIAL_JOBS);
  const [teamMembers, setTeamMembers] = useState<Technician[]>(INITIAL_TECHNICIANS);
  const [isHydrated, setIsHydrated] = useState<boolean>(false);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [dbLatency, setDbLatency] = useState<number | null>(null);

  // Active Modals & Selection States
  const [editingJob, setEditingJob] = useState<WorkOrderJob | null>(null);
  const [selectedJobForDetail, setSelectedJobForDetail] = useState<WorkOrderJob | null>(null);
  const [selectedSubdiv, setSelectedSubdiv] = useState<SubDivision | null>(null);
  const [selectedMemberForMatrix, setSelectedMemberForMatrix] = useState<Technician | null>(null);

  // Confirmation Modal
  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    confirmLabel?: string;
    onConfirm: () => void;
  }>({
    isOpen: false,
    title: "",
    message: "",
    onConfirm: () => {}
  });

  // Toasts
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const addToast = (message: string, type: "success" | "error" | "info" = "success") => {
    const id = "toast_" + Date.now() + "_" + Math.random().toString(36).substr(2, 4);
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 3500);
  };

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  // 1. Fetch from Turso Cloud DB
  const fetchTursoData = useCallback(async (isManual = false) => {
    setIsSyncing(true);
    const start = Date.now();

    try {
      // Check Turso status & latency
      const statusRes = await fetch("/api/db/status");
      if (statusRes.ok) {
        const sData = await statusRes.json();
        setDbLatency(sData.latencyMs || (Date.now() - start));
      }

      // Fetch Jobs
      const jobsRes = await fetch("/api/jobs");
      if (jobsRes.ok) {
        const jData = await jobsRes.json();
        if (jData.success && Array.isArray(jData.data) && jData.data.length > 0) {
          setJobs(jData.data);
          try {
            localStorage.setItem(JOBS_STORAGE_KEY, JSON.stringify(jData.data));
          } catch {}
        }
      }

      // Fetch Technicians
      const techRes = await fetch("/api/technicians");
      if (techRes.ok) {
        const tData = await techRes.json();
        if (tData.success && Array.isArray(tData.data) && tData.data.length > 0) {
          setTeamMembers(tData.data);
          try {
            localStorage.setItem(TEAM_STORAGE_KEY, JSON.stringify(tData.data));
          } catch {}
        }
      }

      if (isManual) {
        addToast("Sinkronisasi Turso Cloud DB berhasil!", "success");
      }
    } catch (err: any) {
      console.warn("Turso sync fallback to local cache", err);
      if (isManual) {
        addToast("Gagal sinkronisasi cloud, menggunakan cache lokal.", "error");
      }
    } finally {
      setIsSyncing(false);
      setIsHydrated(true);
    }
  }, []);

  // Hydrate on mount
  useEffect(() => {
    // First load from localStorage for instant display
    try {
      const storedJobs = localStorage.getItem(JOBS_STORAGE_KEY);
      const storedTeam = localStorage.getItem(TEAM_STORAGE_KEY);
      if (storedJobs) {
        const parsed = JSON.parse(storedJobs);
        if (Array.isArray(parsed) && parsed.length > 0) setJobs(parsed);
      }
      if (storedTeam) {
        const parsed = JSON.parse(storedTeam);
        if (Array.isArray(parsed) && parsed.length > 0) setTeamMembers(parsed);
      }
    } catch {}

    // Then seamlessly fetch latest from Turso Cloud
    fetchTursoData();
  }, [fetchTursoData]);

  // Save to LocalStorage cache whenever state changes
  useEffect(() => {
    if (!isHydrated) return;
    try {
      localStorage.setItem(JOBS_STORAGE_KEY, JSON.stringify(jobs));
    } catch {}
  }, [jobs, isHydrated]);

  useEffect(() => {
    if (!isHydrated) return;
    try {
      localStorage.setItem(TEAM_STORAGE_KEY, JSON.stringify(teamMembers));
    } catch {}
  }, [teamMembers, isHydrated]);

  // Keep detail modal updated if job data changes
  useEffect(() => {
    if (selectedJobForDetail) {
      const updated = jobs.find((j) => j.id === selectedJobForDetail.id);
      if (updated) setSelectedJobForDetail(updated);
    }
  }, [jobs, selectedJobForDetail]);

  // Handlers
  const handleOpenNewJob = () => {
    setEditingJob(null);
    setActiveTab("input");
  };

  const handleEditJob = (job: WorkOrderJob) => {
    setEditingJob(job);
    setActiveTab("input");
  };

  const handleSaveJob = async (jobToSave: WorkOrderJob) => {
    const isEdit = jobs.some((j) => j.id === jobToSave.id);

    // 1. Optimistic UI update
    setJobs((prev) => {
      const existsIndex = prev.findIndex((j) => j.id === jobToSave.id);
      if (existsIndex !== -1) {
        const updated = [...prev];
        updated[existsIndex] = jobToSave;
        return updated;
      } else {
        return [jobToSave, ...prev];
      }
    });

    addToast(`Dokumen ${jobToSave.docNumber} tersimpan (menyinkronkan ke Turso Cloud...)`, "info");
    setEditingJob(null);
    setActiveTab("dashboard");

    // 2. Persist to Turso DB
    try {
      const url = isEdit ? `/api/jobs/${encodeURIComponent(jobToSave.id)}` : "/api/jobs";
      const method = isEdit ? "PUT" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(jobToSave),
      });

      if (res.ok) {
        addToast(`Tersimpan aman di Turso DB (${jobToSave.docNumber})`, "success");
      } else {
        throw new Error("Server rejected job save");
      }
    } catch (err: any) {
      console.error("Turso save error:", err);
      addToast("Tersimpan lokal, sinkronisasi cloud tertunda.", "error");
    }
  };

  const handleDeleteJob = (id: string) => {
    const target = jobs.find((j) => j.id === id);
    if (!target) return;

    setConfirmModal({
      isOpen: true,
      title: "Hapus Dokumen Operasional",
      message: `Apakah Anda yakin ingin menghapus dokumen ${target.docNumber} (${target.customer})? Dokumen akan dihapus dari Turso Cloud Database.`,
      confirmLabel: "Ya, Hapus Dokumen",
      onConfirm: async () => {
        // Optimistic UI update
        setJobs((prev) => prev.filter((j) => j.id !== id));
        if (selectedJobForDetail?.id === id) {
          setSelectedJobForDetail(null);
        }
        setConfirmModal((prev) => ({ ...prev, isOpen: false }));
        addToast(`Dokumen ${target.docNumber} telah dihapus.`, "info");

        // Delete from Turso Cloud
        try {
          await fetch(`/api/jobs/${encodeURIComponent(id)}`, { method: "DELETE" });
        } catch (err) {
          console.error("Turso delete error:", err);
        }
      }
    });
  };

  const handleStatusChange = async (id: string, newStatus: JobStatus) => {
    // Optimistic UI update
    setJobs((prev) =>
      prev.map((j) => (j.id === id ? { ...j, status: newStatus } : j))
    );
    const target = jobs.find((j) => j.id === id);
    addToast(`Status ${target?.docNumber || "pekerjaan"} diubah ke "${newStatus}"`, "success");

    // Patch to Turso Cloud
    try {
      await fetch(`/api/jobs/${encodeURIComponent(id)}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
    } catch (err) {
      console.error("Turso status update error:", err);
    }
  };

  const handleAddNewForSubdiv = (subdiv: SubDivision) => {
    setEditingJob({
      id: "job-" + Date.now(),
      docType: "WO",
      docNumber: "",
      marketing: "Bagus Pratama",
      subdiv,
      customer: "",
      desc: "",
      target: "3 Hari",
      date: new Date().toISOString().split("T")[0],
      techs: [],
      spdType: "SPD",
      spdDays: 3,
      spdDaily: 300000,
      spdNights: 2,
      spdHotel: 600000,
      baLink: "",
      photos: [],
      kasbonUsed: 0,
      status: "Pending",
      statusNote: ""
    });
    setActiveTab("input");
  };

  // Team Member Handlers
  const handleSaveMember = async (memberToSave: Technician) => {
    const isEdit = teamMembers.some((m) => m.id === memberToSave.id);

    setTeamMembers((prev) => {
      const existsIndex = prev.findIndex((m) => m.id === memberToSave.id);
      if (existsIndex !== -1) {
        const oldName = prev[existsIndex].name;
        if (oldName !== memberToSave.name) {
          setJobs((currentJobs) =>
            currentJobs.map((j) => ({
              ...j,
              techs: j.techs.map((t) =>
                t.name === oldName
                  ? { ...t, name: memberToSave.name, subdiv: memberToSave.subdiv }
                  : t
              )
            }))
          );
        }
        const updated = [...prev];
        updated[existsIndex] = memberToSave;
        return updated;
      } else {
        return [...prev, memberToSave];
      }
    });

    addToast(`Data personil "${memberToSave.name}" berhasil disimpan!`, "success");

    try {
      const url = isEdit ? `/api/technicians/${encodeURIComponent(memberToSave.id)}` : "/api/technicians";
      const method = isEdit ? "PUT" : "POST";
      await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(memberToSave),
      });
    } catch (err) {
      console.error("Turso member save error:", err);
    }
  };

  const handleDeleteMember = (id: string) => {
    const target = teamMembers.find((m) => m.id === id);
    if (!target) return;

    setConfirmModal({
      isOpen: true,
      title: "Hapus Personil",
      message: `Apakah Anda yakin ingin menghapus data personil "${target.name}" (${target.subdiv})? Tindakan ini akan menghapus data di Turso Cloud DB.`,
      confirmLabel: "Ya, Hapus Personil",
      onConfirm: async () => {
        setTeamMembers((prev) => prev.filter((m) => m.id !== id));
        setConfirmModal((prev) => ({ ...prev, isOpen: false }));
        addToast(`Personil "${target.name}" telah dihapus.`, "info");

        try {
          await fetch(`/api/technicians/${encodeURIComponent(id)}`, { method: "DELETE" });
        } catch (err) {
          console.error("Turso member delete error:", err);
        }
      }
    });
  };

  // Backup & Restore
  const handleExportData = () => {
    const data = {
      version: "1.0",
      source: "Turso Cloud DB",
      exportedAt: new Date().toISOString(),
      jobs,
      teamMembers
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    const dateStr = new Date().toISOString().split("T")[0];
    a.href = url;
    a.download = `backup_monitoring_me_engineering_${dateStr}.json`;
    a.click();
    URL.revokeObjectURL(url);
    addToast("Data operasional berhasil diekspor sebagai JSON!", "success");
  };

  const handleImportData = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const parsed = JSON.parse(event.target?.result as string);
        if (parsed.jobs && Array.isArray(parsed.jobs)) {
          setJobs(parsed.jobs);
          for (const j of parsed.jobs) {
            await fetch("/api/jobs", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(j),
            }).catch(() => {});
          }
        }
        if (parsed.teamMembers && Array.isArray(parsed.teamMembers)) {
          setTeamMembers(parsed.teamMembers);
          for (const m of parsed.teamMembers) {
            await fetch("/api/technicians", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(m),
            }).catch(() => {});
          }
        }
        addToast("Data operasional dipulihkan dan disinkronkan ke Turso!", "success");
      } catch (err) {
        addToast("Format file JSON tidak valid!", "error");
      }
    };
    reader.readAsText(file);
    e.target.value = "";
  };

  const handleResetFactoryData = () => {
    setConfirmModal({
      isOpen: true,
      title: "Reset ke Data Standar Awal",
      message: "Seluruh data lokal akan dikembalikan ke data awal sistem ME Engineering. Tindakan ini akan menggantikan perubahan yang belum diekspor.",
      confirmLabel: "Ya, Kembalikan Data Standar",
      onConfirm: () => {
        setJobs(INITIAL_JOBS);
        setTeamMembers(INITIAL_TECHNICIANS);
        localStorage.removeItem(JOBS_STORAGE_KEY);
        localStorage.removeItem(TEAM_STORAGE_KEY);
        setConfirmModal((prev) => ({ ...prev, isOpen: false }));
        addToast("Data telah dikembalikan ke standar awal sistem.", "info");
      }
    });
  };

  const handleRegisterMarketing = async (marketingName: string, phone: string = "0812-0000-0000") => {
    const newMember: Technician = {
      id: "tech-mkt-" + Date.now(),
      name: marketingName.trim(),
      role: "Marketing",
      phone: phone.trim() || "0812-0000-0000",
      subdiv: "Divisi Marketing"
    };
    await handleSaveMember(newMember);
  };

  return (
    <div className="min-h-screen bg-slate-100 text-slate-800 flex flex-col font-sans">
      
      {/* 1. Industrial Header with Turso Sync Indicator */}
      <Header
        activeTab={activeTab}
        onTabChange={(tab) => {
          if (tab !== "input") setEditingJob(null);
          setActiveTab(tab);
        }}
        onNewJobClick={handleOpenNewJob}
        editingJobNumber={editingJob?.docNumber}
        onExportData={handleExportData}
        onImportData={handleImportData}
        onResetFactoryData={handleResetFactoryData}
        isSyncing={isSyncing}
        onSyncTurso={() => fetchTursoData(true)}
        dbLatency={dbLatency}
      />

      {/* 2. Main Content Body */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {activeTab === "dashboard" && (
          <DashboardView
            jobs={jobs}
            teamMembers={teamMembers}
            onOpenDetail={(j) => setSelectedJobForDetail(j)}
            onEditJob={handleEditJob}
            onDeleteJob={handleDeleteJob}
            onOpenSubdivModal={(sub) => setSelectedSubdiv(sub)}
            onStatusChange={handleStatusChange}
          />
        )}

        {activeTab === "executive" && (
          <ExecutiveDashboardView
            jobs={jobs}
            teamMembers={teamMembers}
            onOpenJobDetail={(j: WorkOrderJob) => setSelectedJobForDetail(j)}
          />
        )}

        {activeTab === "input" && (
          <InputView
            initialJob={editingJob}
            teamMembers={teamMembers}
            existingJobsCount={jobs.length}
            onSaveJob={handleSaveJob}
            onRegisterMarketing={handleRegisterMarketing}
            onCancel={() => {
              setEditingJob(null);
              setActiveTab("dashboard");
            }}
            onShowToast={addToast}
          />
        )}

        {activeTab === "team" && (
          <TeamView
            teamMembers={teamMembers}
            jobs={jobs}
            onSaveMember={handleSaveMember}
            onDeleteMember={handleDeleteMember}
            onOpenMemberMatrix={(m) => setSelectedMemberForMatrix(m)}
            onShowToast={addToast}
          />
        )}
      </main>

      {/* 3. Footer */}
      <footer className="bg-slate-900 border-t border-slate-800 text-slate-400 text-xs py-4">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="font-bold text-slate-300">Sistem Monitoring Operasional Teknik</span>
            <span>•</span>
            <span>Fueling System, IT, & Electrical Engineering</span>
          </div>
          <div className="font-mono text-[11px] text-slate-400 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
            <span>Turso Cloud DB: AWS AP-Northeast-1</span>
            {dbLatency !== null && <span>• {dbLatency}ms latency</span>}
          </div>
        </div>
      </footer>

      {/* 4. Modals */}
      <JobDetailModal
        job={selectedJobForDetail}
        onClose={() => setSelectedJobForDetail(null)}
        onEdit={handleEditJob}
        onDelete={handleDeleteJob}
      />

      <SubdivModal
        subdiv={selectedSubdiv}
        jobs={jobs}
        onClose={() => setSelectedSubdiv(null)}
        onJobClick={(j) => setSelectedJobForDetail(j)}
        onEditJob={handleEditJob}
        onDeleteJob={handleDeleteJob}
        onStatusChange={handleStatusChange}
        onAddNewForSubdiv={handleAddNewForSubdiv}
      />

      <MemberMatrixModal
        member={selectedMemberForMatrix}
        jobs={jobs}
        onClose={() => setSelectedMemberForMatrix(null)}
        onJobClick={(j) => setSelectedJobForDetail(j)}
      />

      <ConfirmModal
        isOpen={confirmModal.isOpen}
        title={confirmModal.title}
        message={confirmModal.message}
        confirmLabel={confirmModal.confirmLabel}
        onConfirm={confirmModal.onConfirm}
        onCancel={() => setConfirmModal((prev) => ({ ...prev, isOpen: false }))}
      />

      <ToastContainer
        toasts={toasts}
        onDismiss={removeToast}
      />

    </div>
  );
}
