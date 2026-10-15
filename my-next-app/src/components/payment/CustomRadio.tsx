"use client";

import * as React from "react";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

export interface CustomRadioProps {
  checked: boolean;
  onChange?: () => void;
  className?: string;
  size?: "sm" | "md" | "lg";
}

export const CustomRadio: React.FC<CustomRadioProps> = ({
  checked,
  onChange,
  className,
  size = "md",
}) => {
  const sizeClasses = {
    sm: "h-4 w-4",
    md: "h-5 w-5",
    lg: "h-6 w-6",
  };

  const iconSizes = {
    sm: "h-2.5 w-2.5 stroke-[3]",
    md: "h-3.5 w-3.5 stroke-[3]",
    lg: "h-4 w-4 stroke-[3]",
  };

  return (
    <div
      role="radio"
      aria-checked={checked}
      tabIndex={0}
      onClick={onChange}
      onKeyDown={(e) => {
        if ((e.key === "Enter" || e.key === " ") && onChange) {
          e.preventDefault();
          onChange();
        }
      }}
      className={cn(
        "relative flex items-center justify-center rounded-full transition-all duration-200 cursor-pointer select-none shrink-0",
        sizeClasses[size],
        checked
          ? "bg-emerald-600 border-2 border-emerald-600 text-white shadow-xs shadow-emerald-600/30 ring-2 ring-emerald-200/80 scale-100"
          : "bg-white border-2 border-slate-300 hover:border-slate-400 scale-95",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2",
        className
      )}
    >
      <div
        className={cn(
          "transition-all duration-200 flex items-center justify-center",
          checked
            ? "opacity-100 scale-100 rotate-0"
            : "opacity-0 scale-50 -rotate-45"
        )}
      >
        <Check className={iconSizes[size]} />
      </div>
    </div>
  );
};
