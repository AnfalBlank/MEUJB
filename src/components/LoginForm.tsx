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
    <div className="min-h-screen w-full flex items-center justify-center p-4 bg-gradient-to-br from-slate-50 via-white to-slate-100 text-slate-800 relative overflow-hidden select-none">
      
      {/* Watermark Logo Besar di Background */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none select-none overflow-hidden">
        <div className="relative w-[480px] h-[480px] sm:w-[620px] sm:h-[620px] lg:w-[740px] lg:h-[740px] opacity-[0.06] transition-opacity">
          <Image
            src="/logo.png"
            alt="Watermark Logo PT. Usaha Jayamas Bhakti"
            fill
            className="object-contain filter grayscale"
            priority
          />
        </div>
      </div>

      {/* Decorative Subtle Corporate Grid Pattern */}
      <div 
        className="absolute inset-0 pointer-events-none opacity-[0.4]"
        style={{
          backgroundImage: `radial-gradient(#cbd5e1 1px, transparent 1px)`,
          backgroundSize: `24px 24px`
        }}
      ></div>

      <div className="w-full max-w-md relative z-10 animate-in fade-in zoom-in-95 duration-200">
        
        {/* Brand Card Container */}
        <div className="bg-white/95 backdrop-blur-md border border-slate-200/90 rounded-2xl shadow-2xl shadow-slate-300/50 p-6 sm:p-8 space-y-6">
          
          {/* Logo & Company Branding */}
          <div className="flex flex-col items-center text-center space-y-3">
            <div className="w-20 h-20 rounded-2xl bg-slate-50 border border-slate-200 p-2 flex items-center justify-center shadow-xs relative group">
              <Image
                src="/logo.png"
                alt="Logo PT. Usaha Jayamas Bhakti"
                width={70}
                height={70}
                className="object-contain relative z-10 drop-shadow-xs"
                priority
              />
            </div>

            <div>
              <span className="text-[11px] font-mono tracking-widest text-blue-700 font-bold uppercase block">
                PT. USAHA JAYAMAS BHAKTI
              </span>
              <h1 className="text-lg sm:text-xl font-bold text-slate-900 tracking-tight mt-0.5">
                Monitoring Operasional Teknik
              </h1>
              <p className="text-xs text-slate-500 mt-0.5">
                Portal Internal WO / SPK & Executive Cockpit
              </p>
            </div>
          </div>

          {/* Error Notice */}
          {error && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs flex items-center gap-2 animate-in fade-in duration-150">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              <span className="font-medium">{error}</span>
            </div>
          )}

          {/* Login Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            
            {/* Username Input */}
            <div>
              <label className="text-[11px] font-bold text-slate-700 uppercase tracking-wider block mb-1.5">
                Username Akun
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <User className="w-4 h-4" />
                </div>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Masukkan username"
                  autoCapitalize="none"
                  autoComplete="username"
                  required
                  className="w-full bg-slate-50/80 border border-slate-300 rounded-xl pl-9 pr-4 py-2.5 text-xs text-slate-900 placeholder-slate-400 focus:bg-white focus:outline-hidden focus:border-blue-600 focus:ring-2 focus:ring-blue-600/20 transition-all font-mono"
                />
              </div>
            </div>

            {/* Password Input */}
            <div>
              <label className="text-[11px] font-bold text-slate-700 uppercase tracking-wider block mb-1.5">
                Kata Sandi
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Masukkan kata sandi"
                  autoComplete="current-password"
                  required
                  className="w-full bg-slate-50/80 border border-slate-300 rounded-xl pl-9 pr-10 py-2.5 text-xs text-slate-900 placeholder-slate-400 focus:bg-white focus:outline-hidden focus:border-blue-600 focus:ring-2 focus:ring-blue-600/20 transition-all font-mono"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 transition-colors"
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
              className="w-full py-2.5 px-4 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-bold text-xs rounded-xl shadow-md shadow-blue-600/25 transition-all flex items-center justify-center gap-2 group disabled:opacity-60 cursor-pointer"
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
          <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-[10px] text-slate-500 font-mono">
            <span className="flex items-center gap-1">
              <Database className="w-3 h-3 text-emerald-600" />
              <span>Turso Cloud DB</span>
            </span>
            <span className="flex items-center gap-1">
              <HardDrive className="w-3 h-3 text-blue-600" />
              <span>Google Drive v3</span>
            </span>
            <span className="flex items-center gap-1">
              <ShieldCheck className="w-3 h-3 text-slate-500" />
              <span>Internal Only</span>
            </span>
          </div>

        </div>

        {/* Security watermark notice */}
        <p className="text-center text-[11px] text-slate-500 mt-4 font-sans">
          Akses terbatas untuk personil dan manajemen resmi PT. Usaha Jayamas Bhakti.
        </p>

      </div>
    </div>
  );
}
