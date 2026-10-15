import * as React from "react";
import { GoogleButton } from "./GoogleButton";
import { LoginForm } from "./LoginForm";

export const RightPanel: React.FC = () => {
  return (
    <div className="flex flex-col justify-between min-h-screen bg-white px-6 py-10 sm:px-12 md:px-16 lg:px-12 xl:px-20 overflow-y-auto">
      {/* Top spacer or mobile logo header */}
      <div className="lg:hidden flex items-center gap-2.5 mb-8">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-700 text-white font-bold text-sm">
          TU
        </div>
        <span className="font-bold text-slate-800 text-base">
          Travel Umroh &amp; Haji
        </span>
      </div>

      <div className="w-full max-w-md mx-auto my-auto py-4">
        {/* Title & Subtitle */}
        <div className="mb-6">
          <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
            Selamat datang kembali
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-1.5">
            Masuk menggunakan akun Anda untuk melanjutkan
          </p>
        </div>

        {/* 1. Google Button */}
        <GoogleButton />

        {/* 2. Divider with text */}
        <div className="relative my-6">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-slate-200" />
          </div>
          <div className="relative flex justify-center text-[10px] sm:text-[11px] uppercase tracking-wider font-semibold">
            <span className="bg-white px-3 text-slate-400">
              ATAU MASUK DENGAN AKUN DEMO / EMAIL
            </span>
          </div>
        </div>

        {/* 3. Demo selector & Form */}
        <LoginForm />
      </div>

      {/* Footer Copyright */}
      <div className="pt-6 text-center">
        <p className="text-xs text-slate-400">
          &copy; 2026 Travel Umroh &amp; Haji
        </p>
      </div>
    </div>
  );
};
