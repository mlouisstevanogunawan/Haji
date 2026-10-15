"use client";

import * as React from "react";
import { Loader2, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";

export interface AnimatedButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  isLoading?: boolean;
  loadingText?: string;
  showArrow?: boolean;
}

export const AnimatedButton: React.FC<AnimatedButtonProps> = ({
  children,
  className,
  isLoading = false,
  loadingText = "Memproses Pembayaran...",
  showArrow = true,
  disabled,
  ...props
}) => {
  return (
    <button
      disabled={disabled || isLoading}
      className={cn(
        "relative w-full h-14 rounded-xl font-bold text-white text-sm sm:text-base",
        "bg-gradient-to-r from-emerald-600 via-emerald-600 to-emerald-700",
        "hover:from-emerald-700 hover:via-emerald-700 hover:to-emerald-800",
        "shadow-md shadow-emerald-700/25 hover:shadow-lg hover:shadow-emerald-700/30",
        "active:scale-[0.99] transition-all duration-200 ease-out",
        "flex items-center justify-center gap-2.5 px-6",
        "disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100 disabled:shadow-none",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2",
        className
      )}
      {...props}
    >
      {isLoading ? (
        <>
          <Loader2 className="h-5 w-5 animate-spin text-white/90" />
          <span className="font-semibold text-white/95">{loadingText}</span>
        </>
      ) : (
        <>
          <span className="truncate">{children}</span>
          {showArrow && (
            <ArrowRight className="h-4 w-4 shrink-0 stroke-[2.5] transition-transform duration-200 group-hover:translate-x-1" />
          )}
        </>
      )}
    </button>
  );
};
