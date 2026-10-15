import * as React from "react";
import { CheckCircle2 } from "lucide-react";
import { MosqueIllustration } from "./MosqueIllustration";

export const LeftPanel: React.FC = () => {
  return (
    <div className="relative hidden lg:flex flex-col justify-between h-full min-h-screen p-12 xl:p-16 bg-gradient-to-br from-[#065f46] via-[#047857] to-[#064e3b] text-white overflow-hidden">
      {/* Subtle Dot Grid Pattern */}
      <div
        className="absolute inset-0 pointer-events-none opacity-25"
        style={{
          backgroundImage: "radial-gradient(circle, rgba(255, 255, 255, 0.4) 1px, transparent 1px)",
          backgroundSize: "24px 24px",
        }}
      />

      {/* Top Section: Logo & Branding */}
      <div className="relative z-10 flex items-center gap-3">
        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-white/20 backdrop-blur-md border border-white/25 text-white font-extrabold text-base shadow-sm">
          TU
        </div>
        <div>
          <h2 className="text-lg font-bold text-white leading-tight tracking-wide">
            Travel Umroh &amp; Haji
          </h2>
          <p className="text-xs text-white/70 font-medium">
            Sistem Manajemen Umroh &amp; Haji
          </p>
        </div>
      </div>

      {/* Middle Section: Value Proposition & Bullet Points */}
      <div className="relative z-10 my-auto py-10 max-w-lg">
        {/* Pill Badge */}
        <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-md border border-white/20 rounded-full px-4 py-1.5 shadow-xs">
          <span className="w-2 h-2 rounded-full bg-emerald-300 animate-pulse" />
          <span className="text-xs sm:text-sm font-medium text-white">
            Sistem Terintegrasi Multi-Cabang
          </span>
        </div>

        {/* Large Headline */}
        <h1 className="mt-8 text-4xl xl:text-5xl font-extrabold text-white leading-[1.18] tracking-tight">
          Kelola perjalanan ibadah <br />
          dengan lebih tenang.
        </h1>

        {/* Description */}
        <p className="mt-6 text-white/80 text-sm xl:text-base leading-relaxed">
          Pendaftaran jamaah, dokumen, pembayaran, manasik, manifest keberangkatan,
          hingga komisi agen — semuanya rapi dalam satu platform.
        </p>

        {/* 3 Bullet Points */}
        <div className="mt-8 space-y-4">
          <div className="flex items-center gap-3">
            <CheckCircle2 className="w-5 h-5 text-emerald-300 flex-shrink-0" />
            <span className="text-sm text-white font-medium">
              Data jamaah &amp; dokumen terpusat dan aman
            </span>
          </div>
          <div className="flex items-center gap-3">
            <CheckCircle2 className="w-5 h-5 text-emerald-300 flex-shrink-0" />
            <span className="text-sm text-white font-medium">
              Pembayaran, cicilan, dan kuitansi otomatis
            </span>
          </div>
          <div className="flex items-center gap-3">
            <CheckCircle2 className="w-5 h-5 text-emerald-300 flex-shrink-0" />
            <span className="text-sm text-white font-medium">
              Manasik, manifest, serta komisi agen real-time
            </span>
          </div>
        </div>
      </div>

      {/* Bottom Section: Silhouette & Copyright */}
      <div className="relative z-0">
        <MosqueIllustration className="absolute -bottom-12 -left-12 -right-12 w-[120%] max-w-none opacity-80" />
      </div>

      <div className="relative z-10 pt-4">
        <p className="text-xs text-white/60">
          &copy; 2026 Travel Umroh &amp; Haji &mdash; Sistem Manajemen Umroh &amp; Haji.
        </p>
      </div>
    </div>
  );
};
