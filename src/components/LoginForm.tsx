"use client";

import React, { useState } from "react";
import Image from "next/image";
import { 
  User, 
  Lock, 
  Eye, 
  EyeOff, 
  ArrowRight, 
  ShieldCheck, 
  AlertCircle,
  Building2,
  HardDrive,
  Database
} from "lucide-react";
import { AuthUser } from "@/types";

interface LoginFormProps {
  onLogin: (user: AuthUser) => void;
}

export function LoginForm({ onLogin }: LoginFormProps) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    const cleanUser = username.trim().toLowerCase();
    const cleanPass = password.trim();

    if (!cleanUser || !cleanPass) {
      setError("Silakan masukkan username dan password.");
      return;
    }

    setIsLoading(true);

    setTimeout(() => {
      // Validasi 2 akun resmi:
      // 1. username: admin, password: password
      // 2. username: prinof, password: password
      if (cleanUser === "admin" && cleanPass === "password") {
        onLogin({
          username: "admin",
          name: "Administrator Teknik",
          role: "Super Admin",
          loggedInAt: new Date().toISOString(),
        });
      } else if (cleanUser === "prinof" && cleanPass === "password") {
        onLogin({
          username: "prinof",
          name: "Prinof",
          role: "Project Manager & Master Teknik",
          loggedInAt: new Date().toISOString(),
        });
      } else {
        setError("Username atau password salah. Silakan periksa kembali.");
        setIsLoading(false);
      }
    }, 400);
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center p-4 bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-slate-100 relative overflow-hidden select-none">
      
      {/* Background ambient lighting */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[550px] h-[550px] bg-blue-600/15 rounded-full blur-3xl pointer-events-none"></div>
      <div className="absolute bottom-10 right-10 w-[350px] h-[350px] bg-indigo-600/10 rounded-full blur-2xl pointer-events-none"></div>

      <div className="w-full max-w-md relative z-10 animate-in fade-in zoom-in-95 duration-200">
        
        {/* Brand Card Container */}
        <div className="bg-slate-900/90 backdrop-blur-xl border border-slate-800 rounded-2xl shadow-2xl p-6 sm:p-8 space-y-6">
          
          {/* Logo & Company Branding */}
          <div className="flex flex-col items-center text-center space-y-3">
            <div className="w-20 h-20 rounded-2xl bg-white/5 border border-white/10 p-2 flex items-center justify-center shadow-lg relative group">
              <div className="absolute inset-0 bg-blue-500/10 rounded-2xl blur-md group-hover:bg-blue-500/20 transition-colors"></div>
              <Image
                src="/logo.png"
                alt="Logo PT. Usaha Jayamas Bhakti"
                width={70}
                height={70}
                className="object-contain relative z-10 drop-shadow-sm"
                priority
              />
            </div>

            <div>
              <span className="text-[10px] font-mono tracking-widest text-blue-400 font-bold uppercase block">
                PT. USAHA JAYAMAS BHAKTI
              </span>
              <h1 className="text-lg sm:text-xl font-bold text-white tracking-tight mt-0.5">
                Monitoring Operasional Teknik
              </h1>
              <p className="text-xs text-slate-400 mt-0.5">
                Portal Internal WO / SPK & Executive Cockpit
              </p>
            </div>
          </div>

          {/* Error Notice */}
          {error && (
            <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl text-rose-300 text-xs flex items-center gap-2 animate-in fade-in duration-150">
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Login Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            
            {/* Username Input */}
            <div>
              <label className="text-[11px] font-bold text-slate-300 uppercase tracking-wider block mb-1.5">
                Username Akun
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                  <User className="w-4 h-4" />
                </div>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Ketik admin atau prinof"
                  autoCapitalize="none"
                  autoComplete="username"
                  required
                  className="w-full bg-slate-950/60 border border-slate-700/80 rounded-xl pl-9 pr-4 py-2.5 text-xs text-slate-100 placeholder-slate-500 focus:outline-hidden focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all font-mono"
                />
              </div>
            </div>

            {/* Password Input */}
            <div>
              <label className="text-[11px] font-bold text-slate-300 uppercase tracking-wider block mb-1.5">
                Kata Sandi
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Masukkan kata sandi"
                  autoComplete="current-password"
                  required
                  className="w-full bg-slate-950/60 border border-slate-700/80 rounded-xl pl-9 pr-10 py-2.5 text-xs text-slate-100 placeholder-slate-500 focus:outline-hidden focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all font-mono"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-200 transition-colors"
                  aria-label={showPassword ? "Sembunyikan sandi" : "Tampilkan sandi"}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-2.5 px-4 bg-blue-600 hover:bg-blue-500 active:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-lg shadow-blue-600/30 transition-all flex items-center justify-center gap-2 group disabled:opacity-60 cursor-pointer"
            >
              {isLoading ? (
                <span>Memverifikasi Akun...</span>
              ) : (
                <>
                  <span>Masuk ke Sistem Monitoring</span>
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                </>
              )}
            </button>
          </form>

          {/* System Footer info */}
          <div className="pt-1 flex items-center justify-between text-[10px] text-slate-500 font-mono">
            <span className="flex items-center gap-1">
              <Database className="w-3 h-3 text-emerald-500" />
              <span>Turso Cloud DB</span>
            </span>
            <span className="flex items-center gap-1">
              <HardDrive className="w-3 h-3 text-blue-500" />
              <span>Google Drive v3</span>
            </span>
            <span className="flex items-center gap-1">
              <ShieldCheck className="w-3 h-3 text-slate-400" />
              <span>Internal Only</span>
            </span>
          </div>

        </div>

        {/* Security watermark */}
        <p className="text-center text-[11px] text-slate-500 mt-4 font-sans">
          Akses terbatas untuk personil dan manajemen resmi PT. Usaha Jayamas Bhakti.
        </p>

      </div>
    </div>
  );
}
