import * as React from "react";
import { Check } from "lucide-react";
import { MosqueIllustration } from "./MosqueIllustration";

export const LeftPanel: React.FC = () => {
  return (
    <div className="relative hidden lg:flex flex-col justify-between h-full min-h-screen p-12 xl:p-16 bg-[#0d9488] text-white overflow-hidden select-none">
      {/* Subtle Dot Grid Pattern */}
      <div
        className="absolute inset-0 pointer-events-none opacity-20"
        style={{
          backgroundImage:
            "radial-gradient(circle, rgba(255, 255, 255, 0.4) 1.2px, transparent 1.2px)",
          backgroundSize: "28px 28px",
        }}
      />

      {/* Top Section: Logo & Branding */}
      <div className="relative z-10 flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/20 backdrop-blur-md border border-white/25 text-white font-extrabold text-sm shadow-xs">
          TU
        </div>
        <div>
          <h2 className="text-base font-bold text-white leading-tight">
            Travel Umroh &amp; Haji
          </h2>
          <p className="text-xs text-white/70 font-normal">
            Sistem Manajemen Umroh &amp; Haji
          </p>
        </div>
      </div>

      {/* Middle Section: Value Proposition & Bullet Points */}
      <div className="relative z-10 my-auto py-8 max-w-lg">
        {/* Pill Badge */}
        <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-md border border-white/20 rounded-full px-3.5 py-1 shadow-xs">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-300" />
          <span className="text-xs font-medium text-white tracking-wide">
            Sistem Terintegrasi Multi-Cabang
          </span>
        </div>

        {/* Large Headline */}
        <h1 className="mt-7 text-4xl xl:text-[44px] font-extrabold leading-[1.2] tracking-tight">
          <span className="text-white/80">Kelola perjalanan ibadah</span>
          <br />
          <span className="text-white">dengan lebih tenang.</span>
        </h1>

        {/* Description */}
        <p className="mt-5 text-white/80 text-sm leading-relaxed">
          Pendaftaran jamaah, dokumen, pembayaran, manasik, manifest keberangkatan,
          hingga komisi agen &mdash; semuanya rapi dalam satu platform.
        </p>

        {/* 3 Checklist Items */}
        <div className="mt-8 space-y-3.5">
          <div className="flex items-center gap-3">
            <div className="flex h-5 w-5 items-center justify-center rounded-full bg-white/20 text-white flex-shrink-0">
              <Check className="w-3.5 h-3.5 stroke-[2.5]" />
            </div>
            <span className="text-sm text-white font-medium">
              Data jamaah &amp; dokumen terpusat dan aman
            </span>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex h-5 w-5 items-center justify-center rounded-full bg-white/20 text-white flex-shrink-0">
              <Check className="w-3.5 h-3.5 stroke-[2.5]" />
            </div>
            <span className="text-sm text-white font-medium">
              Pembayaran, cicilan, dan kuitansi otomatis
            </span>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex h-5 w-5 items-center justify-center rounded-full bg-white/20 text-white flex-shrink-0">
              <Check className="w-3.5 h-3.5 stroke-[2.5]" />
            </div>
            <span className="text-sm text-white font-medium">
              Manasik, manifest, serta komisi agen real-time
            </span>
          </div>
        </div>
      </div>

      {/* Bottom Section: Silhouette & Copyright */}
      <div className="absolute bottom-0 left-0 right-0 pointer-events-none select-none z-0">
        <MosqueIllustration className="w-full h-auto opacity-75" />
      </div>

      <div className="relative z-10 pt-4">
        <p className="text-xs text-white/60">
          &copy; 2026 Travel Umroh &amp; Haji &mdash; Sistem Manajemen Umroh &amp; Haji.
        </p>
      </div>
    </div>
  );
};
