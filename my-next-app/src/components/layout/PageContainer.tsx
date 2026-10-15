import * as React from "react";
import { cn } from "@/lib/utils";

interface PageContainerProps {
  title: string;
  subtitle?: string;
  badge?: string;
  actions?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}

export const PageContainer: React.FC<PageContainerProps> = ({
  title,
  subtitle,
  badge,
  actions,
  children,
  className,
}) => {
  return (
    <div className={cn("space-y-6 pb-12", className)}>
      {/* Page Title & Actions Banner */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900">
              {title}
            </h1>
            {badge && (
              <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-800 border border-emerald-200">
                {badge}
              </span>
            )}
          </div>
          {subtitle && (
            <p className="mt-1 text-sm text-slate-500 font-normal">
              {subtitle}
            </p>
          )}
        </div>
        {actions && <div className="flex items-center gap-3">{actions}</div>}
      </div>

      {/* Main Content Area */}
      <div>{children}</div>
    </div>
  );
};
