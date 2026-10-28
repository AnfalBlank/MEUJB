"use client";

import React, { useEffect } from "react";
import { X, ExternalLink, Image as ImageIcon, Calendar } from "lucide-react";
import { WorkOrderPhoto } from "@/types";

interface PhotoLightboxModalProps {
  photo: WorkOrderPhoto | null;
  onClose: () => void;
}

export function PhotoLightboxModal({ photo, onClose }: PhotoLightboxModalProps) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && photo) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [photo, onClose]);

  if (!photo) return null;

  return (
    <div 
      className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-xs flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
    >
      <div className="bg-slate-900 border border-slate-800 rounded-xl max-w-2xl w-full overflow-hidden shadow-2xl text-white">
        <div className="p-4 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ImageIcon className="w-4 h-4 text-blue-400" />
            <h3 className="text-xs font-bold font-mono text-slate-200 truncate">
              {photo.fileName}
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-md transition-colors"
            aria-label="Tutup preview foto"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Image Preview Canvas */}
        <div className="bg-slate-950 p-6 flex flex-col items-center justify-center min-h-[280px]">
          <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-lg p-8 flex flex-col items-center justify-center text-center">
            <div className="w-16 h-16 rounded-full bg-slate-800 flex items-center justify-center text-blue-400 mb-3">
              <ImageIcon className="w-8 h-8" />
            </div>
            <p className="text-sm font-semibold text-slate-200">{photo.fileName}</p>
            <p className="text-xs text-slate-400 mt-1 max-w-sm">
              {photo.caption || "Dokumentasi pekerjaan lapangan dari tim teknik."}
            </p>
            <div className="mt-4 flex items-center gap-1.5 text-[11px] text-slate-500">
              <Calendar className="w-3.5 h-3.5" />
              <span>Diupload pada: {photo.uploadedAt}</span>
            </div>
          </div>
        </div>

        <div className="p-3 bg-slate-900/90 border-t border-slate-800 flex items-center justify-between text-xs">
          <span className="text-slate-400 text-[11px]">
            Tersimpan di Google Drive Operasional
          </span>
          <a
            href={photo.driveUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1 text-blue-400 hover:text-blue-300 font-semibold px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-750 transition-colors"
          >
            <span>Buka File Asli</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </div>
      </div>
    </div>
  );
}
