"use client";

import * as React from "react";
import { Sparkles } from "lucide-react";
import { CustomRadio } from "./CustomRadio";
import { cn } from "@/lib/utils";

export interface PaymentMethodCardProps {
  id: string;
  name: string;
  description?: string;
  icon: React.ReactNode;
  brandBgColor?: string;
  isRecommended?: boolean;
  isSelected: boolean;
  onSelect: () => void;
  compact?: boolean;
}

export const PaymentMethodCard: React.FC<PaymentMethodCardProps> = ({
  id,
  name,
  description,
  icon,
  isRecommended = false,
  isSelected,
  onSelect,
  compact = false,
}) => {
  if (compact) {
    return (
      <div
        role="button"
        tabIndex={0}
        onClick={onSelect}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            onSelect();
          }
        }}
        className={cn(
          "group relative flex items-center justify-between p-3.5 rounded-xl border transition-all duration-200 cursor-pointer select-none",
          isSelected
            ? "border-emerald-500 bg-emerald-50/40 ring-2 ring-emerald-200/80 shadow-xs"
            : "border-slate-200/90 bg-white hover:border-emerald-300 hover:bg-slate-50/50 hover:shadow-2xs",
          "active:scale-[0.99] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
        )}
      >
        <div className="flex items-center gap-3 min-w-0">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-800 font-bold text-xs shadow-2xs group-hover:scale-105 transition-transform duration-200">
            {icon}
          </div>
          <span className="font-semibold text-xs text-slate-900 truncate">
            {name}
          </span>
        </div>

        <CustomRadio checked={isSelected} size="sm" />
      </div>
    );
  }

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onSelect}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onSelect();
        }
      }}
      className={cn(
        "group relative flex items-center justify-between p-4 rounded-2xl border transition-all duration-200 cursor-pointer select-none",
        isSelected
          ? "border-emerald-500 bg-emerald-50/30 ring-2 ring-emerald-200/80 shadow-xs"
          : "border-slate-200/90 bg-white hover:border-emerald-300 hover:bg-slate-50/50 hover:shadow-2xs",
        "active:scale-[0.99] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
      )}
    >
      <div className="flex items-center gap-3.5 min-w-0 pr-3">
        {/* Brand Icon: 48x48px (w-12 h-12) rounded-xl */}
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl shadow-xs transition-transform duration-200 group-hover:scale-105">
          {icon}
        </div>

        {/* Info Text */}
        <div className="min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-semibold text-sm text-slate-900 leading-tight">
              {name}
            </span>

            {isRecommended && (
              <span className="inline-flex items-center gap-1 rounded-full bg-gradient-to-r from-amber-500 to-amber-600 px-2 py-0.5 text-[10px] font-bold text-white shadow-2xs">
                <Sparkles className="h-2.5 w-2.5" />
                <span>Rekomendasi</span>
              </span>
            )}
          </div>

          {description && (
            <p className="text-xs text-slate-500 mt-1 line-clamp-2 leading-relaxed">
              {description}
            </p>
          )}
        </div>
      </div>

      {/* Radio Selector */}
      <CustomRadio checked={isSelected} size="md" />
    </div>
  );
};
