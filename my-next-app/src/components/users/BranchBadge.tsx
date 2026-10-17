import * as React from "react";
import { cn } from "@/lib/utils";

interface BranchBadgeProps {
  branchName?: string | null;
  className?: string;
}

export const BranchBadge: React.FC<BranchBadgeProps> = ({ branchName, className }) => {
  const display = branchName || "—";

  return (
    <span
      className={cn(
        "text-xs font-medium text-slate-700",
        className
      )}
    >
      {display}
    </span>
  );
};
