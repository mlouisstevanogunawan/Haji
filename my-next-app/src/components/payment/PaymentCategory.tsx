"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

export interface PaymentCategoryProps {
  title: string;
  badge?: string;
  subtitle?: string;
  children: React.ReactNode;
  className?: string;
}

export const PaymentCategory: React.FC<PaymentCategoryProps> = ({
  title,
  badge,
  subtitle,
  children,
  className,
}) => {
  return (
    <div className={cn("space-y-2.5", className)}>
      <div className="flex items-center justify-between pb-1">
        <div className="flex items-center gap-2">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
            {title}
          </span>
          {badge && (
            <span className="rounded-full bg-slate-100 px-2 py-0.2 text-[10px] font-semibold text-slate-600">
              {badge}
            </span>
          )}
        </div>
        {subtitle && (
          <span className="text-[11px] text-slate-400 font-medium">
            {subtitle}
          </span>
        )}
      </div>

      <div className="space-y-2.5">{children}</div>
    </div>
  );
};
