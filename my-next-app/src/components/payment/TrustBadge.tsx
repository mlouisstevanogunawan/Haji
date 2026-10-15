"use client";

import * as React from "react";
import { ShieldCheck, Lock } from "lucide-react";
import { cn } from "@/lib/utils";

export interface TrustBadgeProps {
  className?: string;
  showBadges?: boolean;
}

export const TrustBadge: React.FC<TrustBadgeProps> = ({
  className,
  showBadges = true,
}) => {
  return (
    <div className={cn("space-y-2 text-center", className)}>
      <div className="flex items-center justify-center gap-1.5 text-xs text-slate-500 font-medium">
        <ShieldCheck className="h-4 w-4 text-emerald-600 shrink-0" />
        <span>
          Transaksi resmi dilindungi <strong className="font-semibold text-slate-700">Midtrans</strong> &amp; terdaftar <strong className="font-semibold text-slate-700">OJK</strong>
        </span>
      </div>

      {showBadges && (
        <div className="flex items-center justify-center gap-3 pt-0.5 text-[10px] text-slate-400 font-medium">
          <span className="flex items-center gap-1">
            <Lock className="h-3 w-3 text-slate-400" />
            <span>256-Bit SSL Enkripsi</span>
          </span>
          <span>•</span>
          <span>Bank Indonesia PJP</span>
          <span>•</span>
          <span>PCI-DSS Level 1</span>
        </div>
      )}
    </div>
  );
};
