import * as React from "react";
import { cn } from "@/lib/utils";

interface ActionBadgeProps {
  action: string;
  className?: string;
}

export const ActionBadge: React.FC<ActionBadgeProps> = ({ action, className }) => {
  return (
    <span
      className={cn(
        "inline-flex items-center px-2 py-1 rounded-md bg-slate-100 text-slate-700 border border-slate-200/80 font-mono text-xs font-medium tracking-tight",
        className
      )}
    >
      {action}
    </span>
  );
};
