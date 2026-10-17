import * as React from "react";
import { LoginForm } from "./LoginForm";

export const RightPanel: React.FC<{ redirectTo?: string | null }> = ({
  redirectTo,
}) => {
  return (
    <div className="flex flex-col justify-between min-h-screen bg-white px-6 py-10 sm:px-12 md:px-16 lg:px-12 xl:px-20 overflow-y-auto">
      {/* Top spacer or mobile logo header */}
      <div className="lg:hidden flex items-center gap-2.5 mb-8">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#0d9488] text-white font-bold text-sm">
          TU
        </div>
        <div>
          <span className="font-bold text-slate-800 text-base leading-tight block">
            Travel Umroh &amp; Haji
          </span>
          <span className="text-xs text-slate-500 block">
            Sistem Manajemen Umroh &amp; Haji
          </span>
        </div>
      </div>

      <div className="w-full max-w-[400px] mx-auto my-auto py-6">
        {/* Title & Subtitle */}
        <div className="mb-8">
          <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
            Selamat datang kembali
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-1.5">
            Masuk menggunakan akun Anda untuk melanjutkan.
          </p>
        </div>

        {/* Form Login */}
        <LoginForm redirectTo={redirectTo} />
      </div>

      {/* Footer Copyright */}
      <div className="pt-6 text-center">
        <p className="text-xs text-slate-400">
          &copy; 2026 Toko Source Code
        </p>
      </div>
    </div>
  );
};
