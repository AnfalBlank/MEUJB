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
  Share2,
  RefreshCw,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  CheckCircle
} from "lucide-react";

interface DriveConfigData {
  configured: boolean;
  authType: "oauth" | "service_account" | "none";
  hasOAuthCredentials: boolean;
  hasRefreshToken: boolean;
  hasServiceAccount: boolean;
  serviceAccountEmail?: string;
  rootFolderId?: string;
  clientIdMasked?: string;
  redirectUri: string;
  error?: string;
}

interface DriveGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function DriveGuideModal({ isOpen, onClose }: DriveGuideModalProps) {
  const [activeTab, setActiveTab] = useState<"oauth" | "service_account">("oauth");
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [saving, setSaving] = useState<boolean>(false);
  const [saveSuccess, setSaveSuccess] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);

  const [status, setStatus] = useState<DriveConfigData>({
    configured: false,
    authType: "none",
    hasOAuthCredentials: false,
    hasRefreshToken: false,
    hasServiceAccount: false,
    redirectUri: "http://localhost:3001/api/drive/callback",
  });

  // Form states
  const [clientId, setClientId] = useState<string>("");
  const [clientSecret, setClientSecret] = useState<string>("");
  const [rootFolderId, setRootFolderId] = useState<string>("");

  const fetchStatus = () => {
    setLoading(true);
    fetch("/api/drive/status")
      .then((res) => res.json())
      .then((data) => {
        setStatus(data);
        if (data.rootFolderId) {
          setRootFolderId(data.rootFolderId);
        }
        setLoading(false);
      })
      .catch(() => {
        setLoading(false);
      });
  };

  useEffect(() => {
    if (isOpen) {
      fetchStatus();
      setSaveSuccess(null);
      setSaveError(null);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const currentRedirectUri =
    typeof window !== "undefined"
      ? `${window.location.origin}/api/drive/callback`
      : status.redirectUri;

  const handleCopy = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const handleSaveCredentials = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSaveSuccess(null);
    setSaveError(null);

    try {
      const payload: Record<string, string> = {};
      if (clientId.trim()) payload.clientId = clientId.trim();
      if (clientSecret.trim()) payload.clientSecret = clientSecret.trim();
      if (rootFolderId.trim()) payload.rootFolderId = rootFolderId.trim();

      const res = await fetch("/api/drive/save-token", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (data.success) {
        setSaveSuccess("Kredensial berhasil disimpan ke .env.local! Anda sekarang dapat mengklik 'Hubungkan Akun Google Drive'.");
        fetchStatus();
      } else {
        setSaveError(data.error || "Gagal menyimpan konfigurasi.");
      }
    } catch (err: any) {
      setSaveError(err.message || "Gagal mengirim data konfigurasi.");
    } finally {
      setSaving(false);
    }
  };

  const envTemplateOAuth = `# Google Drive OAuth 2.0 Configuration (Rekomendasi 15GB Kuota Bebas)
GOOGLE_CLIENT_ID="${clientId || "xxx.apps.googleusercontent.com"}"
GOOGLE_CLIENT_SECRET="${clientSecret || "GOCSPX-xxx"}"
GOOGLE_REDIRECT_URI="${currentRedirectUri}"
GDRIVE_ROOT_FOLDER_ID="${rootFolderId || status.rootFolderId || "1CitMTDumnP3aJ3N-l57ILyzb6tUro9Za"}"
GOOGLE_REFRESH_TOKEN=""`;

  const envTemplateServiceAccount = `# Google Drive API Credentials (Service Account)
GDRIVE_ROOT_FOLDER_ID="${status.rootFolderId || "1CitMTDumnP3aJ3N-l57ILyzb6tUro9Za"}"
GOOGLE_SERVICE_ACCOUNT_EMAIL="your-service-account@project.iam.gserviceaccount.com"
GOOGLE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\\nMIIEv...\\n-----END PRIVATE KEY-----\\n"`;

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/75 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-3xl w-full overflow-hidden my-6 animate-in fade-in zoom-in-95 duration-150">
        
        {/* Header */}
        <div className="bg-slate-900 text-white p-5 flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600/20 border border-blue-500/40 flex items-center justify-center text-blue-400">
              <HardDrive className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold tracking-wide">
                  Integrasi Google Drive API & Lokasi Dokumen
                </h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-500/20 text-blue-300 border border-blue-500/30">
                  v3 OAuth 2.0
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Arsip otomatis Berita Acara PDF & Foto Dokumentasi langsung ke Google Drive
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1.5 rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Global Live Status Banner */}
        <div className="p-4 bg-slate-50 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-700">Status Saat Ini:</span>
            {loading ? (
              <span className="text-xs text-slate-500 font-mono flex items-center gap-1.5">
                <RefreshCw className="w-3.5 h-3.5 animate-spin text-slate-400" />
                Memeriksa...
              </span>
            ) : status.authType === "oauth" ? (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                OAuth 2.0 Terhubung (Kuota Pribadi 15 GB Aktif)
              </span>
            ) : status.authType === "service_account" ? (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-blue-100 text-blue-800 border border-blue-300">
                <ShieldCheck className="w-3.5 h-3.5 text-blue-600" />
                Service Account Aktif
              </span>
            ) : status.hasOAuthCredentials && !status.hasRefreshToken ? (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-800 border border-amber-300">
                <AlertCircle className="w-3.5 h-3.5 text-amber-600" />
                Kredensial Siap — Menunggu Otorisasi Akun
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-slate-200 text-slate-700 border border-slate-300">
                <AlertCircle className="w-3.5 h-3.5 text-slate-500" />
                Belum Terkonfigurasi (Mode Simulasi)
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            {status.rootFolderId && (
              <a
                href={`https://drive.google.com/drive/folders/${status.rootFolderId}`}
                target="_blank"
                rel="noreferrer"
                className="text-xs text-blue-600 hover:text-blue-700 font-semibold inline-flex items-center gap-1 bg-white px-2.5 py-1 rounded-lg border border-slate-200 hover:border-blue-300 transition-colors"
              >
                <Folder className="w-3.5 h-3.5 text-amber-600" />
                <span>Buka Folder Drive</span>
                <ExternalLink className="w-3 h-3 text-slate-400" />
              </a>
            )}
            <button
              onClick={fetchStatus}
              title="Refresh status"
              className="p-1 rounded-lg hover:bg-slate-200 text-slate-500 hover:text-slate-800 transition-colors cursor-pointer"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
            </button>
          </div>
        </div>

        {/* Tab Selection */}
        <div className="flex border-b border-slate-200 bg-slate-100/60 px-5 pt-3 gap-2">
          <button
            type="button"
            onClick={() => setActiveTab("oauth")}
            className={`px-4 py-2.5 text-xs font-bold rounded-t-xl transition-all cursor-pointer flex items-center gap-2 ${
              activeTab === "oauth"
                ? "bg-white text-blue-700 border-t border-x border-slate-200 -mb-px shadow-xs"
                : "text-slate-600 hover:text-slate-900 hover:bg-slate-200/60"
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-500" />
            <span>OAuth 2.0 (Resmi Google & Kuota 15 GB)</span>
            <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-1.5 py-0.2 rounded-full">
              Rekomendasi
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("service_account")}
            className={`px-4 py-2.5 text-xs font-bold rounded-t-xl transition-all cursor-pointer flex items-center gap-2 ${
              activeTab === "service_account"
                ? "bg-white text-slate-900 border-t border-x border-slate-200 -mb-px shadow-xs"
                : "text-slate-600 hover:text-slate-900 hover:bg-slate-200/60"
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5 text-slate-500" />
            <span>Service Account (Alternatif)</span>
          </button>
        </div>

        {/* Body Content */}
        <div className="p-6 space-y-6 max-h-[65vh] overflow-y-auto text-xs text-slate-700 leading-relaxed">

          {/* TAB 1: OAUTH 2.0 */}
          {activeTab === "oauth" && (
            <div className="space-y-6">

              {/* Solusi Banner */}
              <div className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200/80 rounded-xl space-y-2">
                <div className="flex items-center gap-2 text-blue-900 font-bold text-xs">
                  <Sparkles className="w-4 h-4 text-blue-600" />
                  <span>Mengapa Menggunakan OAuth 2.0 Refresh Token?</span>
                </div>
                <p className="text-slate-600 text-xs leading-relaxed">
                  Google membatasi kuota <em>Service Account</em> menjadi <strong>0 bytes</strong> pada akun Gmail personal. Dengan OAuth 2.0, file yang diunggah backend otomatis masuk menggunakan kuota akun Google pribadi Anda (<strong>15 GB gratis</strong>) dan berjalan 100% di latar belakang tanpa perlu login berulang!
                </p>
              </div>

              {/* Tombol Otorisasi Cepat */}
              <div className="p-5 bg-slate-900 text-white rounded-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-sm">
                <div>
                  <h4 className="text-sm font-bold text-white flex items-center gap-2">
                    <span>Langkah Otorisasi Akun Google</span>
                    {status.authType === "oauth" && (
                      <span className="text-[10px] bg-emerald-500 text-slate-950 font-bold px-2 py-0.5 rounded-full">
                        Sudah Terhubung
                      </span>
                    )}
                  </h4>
                  <p className="text-xs text-slate-300 mt-1 max-w-lg">
                    {status.authType === "oauth"
                      ? "Akun Google Anda saat ini aktif dan terhubung dengan Refresh Token permanen. Klik tombol di kanan jika ingin menghubungkan ulang atau mengganti akun Google."
                      : "Pastikan Client ID & Secret sudah disimpan, lalu klik tombol untuk mengizinkan akses Google Drive."}
                  </p>
                </div>

                <a
                  href="/api/drive/auth"
                  target="_blank"
                  rel="noreferrer"
                  className="px-5 py-2.5 bg-blue-600 hover:bg-blue-500 active:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-sm transition-all flex items-center gap-2 shrink-0 cursor-pointer"
                >
                  <span>{status.authType === "oauth" ? "Hubungkan Ulang Akun" : "Hubungkan Akun Google Drive"}</span>
                  <ArrowRight className="w-4 h-4" />
                </a>
              </div>

              {/* Form Input Kredensial Cepat */}
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-5 space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-slate-900 text-xs flex items-center gap-1.5">
                    <Key className="w-4 h-4 text-blue-600" />
                    <span>Konfigurasi Cepat Kredensial OAuth 2.0</span>
                  </h4>
                  <span className="text-[11px] text-slate-500">
                    Otomatis tersimpan ke <code className="font-mono font-bold text-slate-700">.env.local</code>
                  </span>
                </div>

                {saveSuccess && (
                  <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-emerald-800 text-xs flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 shrink-0 text-emerald-600" />
                    <span>{saveSuccess}</span>
                  </div>
                )}

                {saveError && (
                  <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-rose-800 text-xs flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                    <span>{saveError}</span>
                  </div>
                )}

                <form onSubmit={handleSaveCredentials} className="space-y-3">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">
                      Google Client ID
                    </label>
                    <input
                      type="text"
                      value={clientId}
                      onChange={(e) => setClientId(e.target.value)}
                      placeholder={status.clientIdMasked || "misal: 123456789-xxx.apps.googleusercontent.com"}
                      className="w-full px-3 py-2 text-xs font-mono bg-white border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-slate-900"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">
                      Google Client Secret
                    </label>
                    <input
                      type="password"
                      value={clientSecret}
                      onChange={(e) => setClientSecret(e.target.value)}
                      placeholder="misal: GOCSPX-xxxxxxxxxxxxxxxxxxxx"
                      className="w-full px-3 py-2 text-xs font-mono bg-white border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-slate-900"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">
                      Root Folder ID Google Drive
                    </label>
                    <input
                      type="text"
                      value={rootFolderId}
                      onChange={(e) => setRootFolderId(e.target.value)}
                      placeholder="misal: 1CitMTDumnP3aJ3N-l57ILyzb6tUro9Za"
                      className="w-full px-3 py-2 text-xs font-mono bg-white border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-slate-900"
                    />
                    <p className="text-[10px] text-slate-500 mt-1">
                      ID folder induk tempat folder hirarki tahun, divisi, dan nomor WO akan dibuat.
                    </p>
                  </div>

                  <div className="pt-1 flex items-center justify-end">
                    <button
                      type="submit"
                      disabled={saving}
                      className="px-4 py-2 bg-slate-900 hover:bg-slate-800 disabled:opacity-50 text-white font-bold text-xs rounded-lg transition-colors flex items-center gap-2 cursor-pointer"
                    >
                      {saving ? (
                        <>
                          <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                          <span>Menyimpan...</span>
                        </>
                      ) : (
                        <>
                          <Check className="w-3.5 h-3.5 text-emerald-400" />
                          <span>Simpan Kredensial ke .env.local</span>
                        </>
                      )}
                    </button>
                  </div>
                </form>
              </div>

              {/* Langkah Setup Lengkap */}
              <div className="space-y-4 pt-2">
                <h4 className="font-bold text-slate-900 text-xs border-b border-slate-200 pb-2">
                  Langkah Setup 1 Kali di Google Cloud Console:
                </h4>

                {/* Step 1 */}
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-blue-100 text-blue-700 font-bold flex items-center justify-center shrink-0 text-xs">
                    1
                  </div>
                  <div className="space-y-1">
                    <h5 className="font-bold text-slate-900 text-xs flex items-center gap-1.5">
                      <span>Aktifkan Google Drive API</span>
                      <a
                        href="https://console.cloud.google.com/apis/library/drive.googleapis.com"
                        target="_blank"
                        rel="noreferrer"
                        className="text-blue-600 hover:text-blue-800 inline-flex items-center gap-0.5 font-normal underline"
                      >
                        Buka Library API <ExternalLink className="w-3 h-3" />
                      </a>
                    </h5>
                    <p className="text-slate-600">
                      Pilih project Google Cloud Anda, lalu klik tombol <strong>"Enable"</strong> pada Google Drive API.
                    </p>
                  </div>
                </div>

                {/* Step 2 */}
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-blue-100 text-blue-700 font-bold flex items-center justify-center shrink-0 text-xs">
                    2
                  </div>
                  <div className="space-y-1">
                    <h5 className="font-bold text-slate-900 text-xs flex items-center gap-1.5">
                      <span>Atur OAuth Consent Screen ke "In Production"</span>
                      <a
                        href="https://console.cloud.google.com/apis/credentials/consent"
                        target="_blank"
                        rel="noreferrer"
                        className="text-blue-600 hover:text-blue-800 inline-flex items-center gap-0.5 font-normal underline"
                      >
                        Buka Consent Screen <ExternalLink className="w-3 h-3" />
                      </a>
                    </h5>
                    <p className="text-slate-600">
                      Pilih tipe <strong>External</strong>. Pada Publishing status, klik tombol <strong>"Publish App"</strong> agar statusnya menjadi <strong>In Production</strong>.
                    </p>
                    <div className="p-2.5 bg-amber-50 border border-amber-200 rounded-lg text-amber-900 text-[11px] space-y-1">
                      <strong>⚠️ Penting:</strong> Jika status dibiarkan <em>"Testing"</em>, token Google akan kedaluwarsa otomatis tiap 7 hari. Dengan memilih <em>"In Production"</em>, Refresh Token menjadi <strong>permanen selamanya</strong>.
                    </div>
                  </div>
                </div>

                {/* Step 3 */}
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-blue-100 text-blue-700 font-bold flex items-center justify-center shrink-0 text-xs">
                    3
                  </div>
                  <div className="space-y-1">
                    <h5 className="font-bold text-slate-900 text-xs flex items-center gap-1.5">
                      <span>Buat OAuth 2.0 Client ID (Web Application)</span>
                      <a
                        href="https://console.cloud.google.com/apis/credentials"
                        target="_blank"
                        rel="noreferrer"
                        className="text-blue-600 hover:text-blue-800 inline-flex items-center gap-0.5 font-normal underline"
                      >
                        Buka Credentials <ExternalLink className="w-3 h-3" />
                      </a>
                    </h5>
                    <p className="text-slate-600">
                      Klik <strong>Create Credentials &gt; OAuth client ID</strong>. Pilih Application type: <strong>Web application</strong>.
                    </p>
                    <div className="mt-2 space-y-1.5">
                      <div className="text-[11px] font-bold text-slate-800">
                        Tambahkan URL ini ke bagian <strong>Authorized redirect URIs</strong>:
                      </div>
                      <div className="flex items-center gap-2">
                        <code className="p-2 bg-slate-900 text-emerald-400 rounded-lg font-mono text-[11px] grow truncate">
                          {currentRedirectUri}
                        </code>
                        <button
                          type="button"
                          onClick={() => handleCopy(currentRedirectUri, "redirectUri")}
                          className="px-3 py-2 bg-slate-200 hover:bg-slate-300 rounded-lg text-slate-800 font-bold text-xs flex items-center gap-1 shrink-0 cursor-pointer"
                        >
                          {copiedKey === "redirectUri" ? (
                            <>
                              <Check className="w-3.5 h-3.5 text-emerald-600" />
                              <span>Disalin!</span>
                            </>
                          ) : (
                            <>
                              <Copy className="w-3.5 h-3.5" />
                              <span>Salin URI</span>
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Step 4 */}
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-blue-100 text-blue-700 font-bold flex items-center justify-center shrink-0 text-xs">
                    4
                  </div>
                  <div className="space-y-1">
                    <h5 className="font-bold text-slate-900 text-xs">
                      Simpan & Klik "Hubungkan Akun Google Drive"
                    </h5>
                    <p className="text-slate-600">
                      Salin Client ID dan Client Secret ke form di atas, simpan, lalu klik tombol <strong>"Hubungkan Akun Google Drive"</strong>. Setelah login dan menyetujui izin, aplikasi siap mengunggah file!
                    </p>
                  </div>
                </div>

              </div>

              {/* Template .env.local copy */}
              <div className="space-y-2 pt-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-900 flex items-center gap-1.5">
                    <Key className="w-3.5 h-3.5 text-blue-600" />
                    <span>Template Variabel di berkas .env.local:</span>
                  </span>
                  <button
                    type="button"
                    onClick={() => handleCopy(envTemplateOAuth, "oauthTemplate")}
                    className="text-[11px] text-blue-600 hover:text-blue-800 font-semibold flex items-center gap-1 cursor-pointer"
                  >
                    {copiedKey === "oauthTemplate" ? (
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
                  {envTemplateOAuth}
                </pre>
              </div>

            </div>
          )}

          {/* TAB 2: SERVICE ACCOUNT */}
          {activeTab === "service_account" && (
            <div className="space-y-5">
              
              <div className="p-3.5 bg-amber-50 border border-amber-200 rounded-xl space-y-1.5">
                <div className="flex items-center gap-1.5 text-amber-900 font-bold text-xs">
                  <AlertCircle className="w-4 h-4 text-amber-700" />
                  <span>Catatan Kuota Service Account:</span>
                </div>
                <p className="text-amber-800 text-[11px] leading-relaxed">
                  Pada akun Gmail standar personal (@gmail.com), Service Account dibatasi oleh Google dengan kuota penyimpanan <strong>0 bytes</strong>. Mode ini hanya dapat mengunggah file jika folder Google Drive Anda berada di <strong>Google Workspace Shared Drive</strong> berbayar. Untuk akun personal, gunakan tab <strong>OAuth 2.0</strong> di atas.
                </p>
              </div>

              {/* Steps Body */}
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
                    Buka <strong>APIs & Services &gt; Credentials &gt; Create Credentials &gt; Service Account</strong>.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-blue-100 text-blue-700 font-bold flex items-center justify-center shrink-0 text-xs">
                  2
                </div>
                <div className="space-y-1">
                  <h4 className="font-bold text-slate-900 text-xs">
                    Download JSON Key (Private Key)
                  </h4>
                  <p className="text-slate-600">
                    Pilih tab <strong>Keys &gt; Add Key &gt; Create new key (JSON)</strong>. Masukkan nilai <code>client_email</code> dan <code>private_key</code> ke <code>.env.local</code>.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-blue-100 text-blue-700 font-bold flex items-center justify-center shrink-0 text-xs">
                  3
                </div>
                <div className="space-y-1">
                  <h4 className="font-bold text-slate-900 text-xs flex items-center gap-1.5">
                    <Share2 className="w-4 h-4 text-amber-600" />
                    <span>Bagikan Folder Drive ke Email Service Account</span>
                  </h4>
                  <p className="text-slate-600">
                    Klik kanan folder induk di Google Drive &gt; <strong>Bagikan</strong> &gt; masukkan email Service Account dengan peran <strong>Editor</strong>.
                  </p>
                </div>
              </div>

              {/* Template Service Account copy */}
              <div className="space-y-2 pt-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-900 flex items-center gap-1.5">
                    <Key className="w-3.5 h-3.5 text-blue-600" />
                    <span>Format Variabel di berkas .env.local:</span>
                  </span>
                  <button
                    type="button"
                    onClick={() => handleCopy(envTemplateServiceAccount, "saTemplate")}
                    className="text-[11px] text-blue-600 hover:text-blue-800 font-semibold flex items-center gap-1 cursor-pointer"
                  >
                    {copiedKey === "saTemplate" ? (
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
                  {envTemplateServiceAccount}
                </pre>
              </div>

            </div>
          )}

        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-100 border-t border-slate-200 flex items-center justify-between">
          <span className="text-[11px] text-slate-500">
            Sistem Monitoring Operasional Teknik — Google Drive Integration
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer"
          >
            Tutup Panduan
          </button>
        </div>

      </div>
    </div>
  );
}
