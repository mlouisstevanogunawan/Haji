import * as React from "react";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface LoadingProps {
  message?: string;
  className?: string;
  size?: "sm" | "md" | "lg";
}

export const Loading: React.FC<LoadingProps> = ({
  message = "Memuat data...",
  className,
  size = "md",
}) => {
  const iconSizes = {
    sm: "h-5 w-5",
    md: "h-8 w-8",
    lg: "h-12 w-12",
  };

  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center p-8 text-center",
        className
      )}
    >
      <div className="relative flex items-center justify-center mb-3">
        <div className="absolute h-10 w-10 rounded-full bg-emerald-100 animate-ping opacity-75" />
        <Loader2 className={cn("animate-spin text-emerald-700", iconSizes[size])} />
      </div>
      <p className="text-sm font-medium text-slate-600 animate-pulse">{message}</p>
    </div>
  );
};
