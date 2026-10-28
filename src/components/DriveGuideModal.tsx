"use client";

import React, { useState, useEffect } from "react";
import { 
  X, 
  HardDrive, 
  Folder, 
  Key, 
  CheckCircle2, 
  AlertCircle, 
  Copy, 
  Check, 
  ExternalLink,
  ShieldCheck,
  Share2
} from "lucide-react";

interface DriveGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function DriveGuideModal({ isOpen, onClose }: DriveGuideModalProps) {
  const [copied, setCopied] = useState<boolean>(false);
  const [driveStatus, setDriveStatus] = useState<{
    configured: boolean;
    serviceAccountEmail?: string;
    rootFolderId?: string;
    loading: boolean;
  }>({
    configured: false,
    loading: true,
  });

  useEffect(() => {
    if (isOpen) {
      fetch("/api/drive/status")
        .then((res) => res.json())
        .then((data) => {
          setDriveStatus({
            configured: data.configured,
            serviceAccountEmail: data.serviceAccountEmail,
            rootFolderId: data.rootFolderId,
            loading: false,
          });
        })
        .catch(() => {
          setDriveStatus({ configured: false, loading: false });
        });
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const envTemplate = `# Google Drive API Credentials (Service Account)
GDRIVE_ROOT_FOLDER_ID="1AbCdEfGhIjKlMnOpQrStUvWxYz"
GOOGLE_SERVICE_ACCOUNT_EMAIL="me-drive-uploader@your-project-id.iam.gserviceaccount.com"
GOOGLE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\\nMIIEvgIBADANBgkqhkiG9w0BAQEFAASCBKgwggSkAgEAAoIBAQC...\\n-----END PRIVATE KEY-----\\n"`;

  const handleCopy = () => {
    navigator.clipboard.writeText(envTemplate);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-xl border border-slate-200 shadow-2xl max-w-2xl w-full overflow-hidden my-8">
        
        {/* Header */}
        <div className="bg-slate-900 text-white p-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-blue-600/30 border border-blue-500/30 flex items-center justify-center text-blue-400">
              <HardDrive className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold tracking-wide">
                Panduan Setup Google Drive API & Lokasi Dokumen
              </h3>
              <p className="text-xs text-slate-400">
                Langkah integrasi arsip otomatis Berita Acara & Foto Dokumentasi
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Status Banner */}
        <div className="p-4 bg-slate-50 border-b border-slate-200">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-700 flex items-center gap-2">
              Status Koneksi Saat Ini:
            </span>
            {driveStatus.loading ? (
              <span className="text-xs text-slate-500 font-mono">Memeriksa status...</span>
            ) : driveStatus.configured ? (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                <CheckCircle2 className="w-3.5 h-3.5" />
                Google Drive API Aktif & Terhubung
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-800 border border-amber-200">
                <AlertCircle className="w-3.5 h-3.5" />
                Mode Simulasi (Belum Ada Kunci di .env.local)
              </span>
            )}
          </div>
          {driveStatus.serviceAccountEmail && (
            <p className="text-[11px] font-mono text-slate-500 mt-1 truncate">
              Service Account: {driveStatus.serviceAccountEmail}
            </p>
          )}
        </div>

        {/* Steps Body */}
        <div className="p-5 space-y-5 max-h-[70vh] overflow-y-auto text-xs text-slate-700 leading-relaxed">
          
          {/* Step 1 */}
          <div className="flex items-start gap-3">
            <div className="w-6 h-6 rounded-full bg-blue-100 text-blue-700 font-bold flex items-center justify-center shrink-0 text-xs">
              1
            </div>
            <div className="space-y-1">
              <h4 className="font-bold text-slate-900 text-xs flex items-center gap-1.5">
                <span>Buat Service Account di Google Cloud Console</span>
                <a
                  href="https://console.cloud.google.com/"
                  target="_blank"
                  rel="noreferrer"
                  className="text-blue-600 hover:text-blue-800 inline-flex items-center gap-0.5 font-normal underline"
                >
                  Buka Console <ExternalLink className="w-3 h-3" />
                </a>
              </h4>
              <p className="text-slate-600">
                Buka <strong>APIs & Services &gt; Library</strong>, cari dan aktifkan <strong>Google Drive API</strong>. Lalu buka <strong>Credentials &gt; Create Credentials &gt; Service Account</strong>.
              </p>
            </div>
          </div>

          {/* Step 2 */}
          <div className="flex items-start gap-3">
            <div className="w-6 h-6 rounded-full bg-blue-100 text-blue-700 font-bold flex items-center justify-center shrink-0 text-xs">
              2
            </div>
            <div className="space-y-1">
              <h4 className="font-bold text-slate-900 text-xs">
                Download JSON Key (Private Key)
              </h4>
              <p className="text-slate-600">
                Klik pada Service Account yang baru dibuat &gt; pilih tab <strong>Keys</strong> &gt; <strong>Add Key</strong> &gt; <strong>Create new key</strong> &gt; pilih format <strong>JSON</strong>. Berkas JSON akan terunduh. Di dalamnya terdapat nilai <code className="font-mono bg-slate-100 px-1 py-0.5 rounded text-slate-800">client_email</code> dan <code className="font-mono bg-slate-100 px-1 py-0.5 rounded text-slate-800">private_key</code>.
              </p>
            </div>
          </div>

          {/* Step 3 */}
          <div className="flex items-start gap-3">
            <div className="w-6 h-6 rounded-full bg-blue-100 text-blue-700 font-bold flex items-center justify-center shrink-0 text-xs">
              3
            </div>
            <div className="space-y-1">
              <h4 className="font-bold text-slate-900 text-xs flex items-center gap-1.5">
                <Folder className="w-4 h-4 text-amber-600" />
                <span>Buat Folder Induk & Ambil Lokasi ID Dokumen di Google Drive</span>
              </h4>
              <p className="text-slate-600">
                Buka Google Drive Anda, buat folder bernama misalnya <strong>OPERASIONAL TEKNIK</strong>. Buka folder tersebut, lalu salin kode acak pada URL address bar:
              </p>
              <div className="p-2 bg-slate-100 rounded font-mono text-[11px] text-slate-800 truncate">
                https://drive.google.com/drive/folders/<strong className="text-blue-700 bg-blue-100 px-1">1AbCdEfGhIjKlMnOpQrStUvWxYz</strong>
              </div>
              <p className="text-slate-500 text-[11px]">
                Bagian bertanda tebal adalah <strong>Folder ID</strong> Anda.
              </p>
            </div>
          </div>

          {/* Step 4: KRUSIAL */}
          <div className="p-3.5 bg-amber-50 border border-amber-200 rounded-lg space-y-1.5">
            <div className="flex items-center gap-1.5 text-amber-900 font-bold">
              <Share2 className="w-4 h-4 text-amber-700" />
              <span>LANGKAH WAJIB: Bagikan Folder ke Service Account!</span>
            </div>
            <p className="text-amber-800 text-[11px] leading-relaxed">
              Klik kanan folder <strong>OPERASIONAL TEKNIK</strong> di Google Drive &gt; <strong>Bagikan (Share)</strong> &gt; masukkan alamat email Service Account (<code className="font-mono font-bold">xxx@xxx.iam.gserviceaccount.com</code>) &gt; atur peran sebagai <strong>Editor (Penyunting)</strong>. Tanpa langkah ini, Google akan menolak akses upload karena folder belum diizinkan.
            </p>
          </div>

          {/* Step 5: Format .env.local */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-bold text-slate-900 flex items-center gap-1.5">
                <Key className="w-3.5 h-3.5 text-blue-600" />
                <span>Format Variabel di berkas .env.local:</span>
              </span>
              <button
                type="button"
                onClick={handleCopy}
                className="text-[11px] text-blue-600 hover:text-blue-800 font-semibold flex items-center gap-1"
              >
                {copied ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Disalin!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>Salin Template</span>
                  </>
                )}
              </button>
            </div>
            <pre className="p-3 bg-slate-900 text-slate-200 rounded-lg font-mono text-[11px] overflow-x-auto whitespace-pre">
              {envTemplate}
            </pre>
          </div>

        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-100 border-t border-slate-200 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-bold transition-colors"
          >
            Tutup Panduan
          </button>
        </div>

      </div>
    </div>
  );
}
