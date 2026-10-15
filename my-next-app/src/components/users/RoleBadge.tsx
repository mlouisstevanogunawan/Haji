import * as React from "react";
import { cn } from "@/lib/utils";
import { UserRole } from "@/types/database";

interface RoleBadgeProps {
  role: UserRole | string;
  className?: string;
}

export const ROLE_CONFIGS_MAP: Record<
  string,
  { label: string; bg: string; text: string; border: string }
> = {
  super_admin: {
    label: "Super Admin",
    bg: "bg-purple-50",
    text: "text-purple-600",
    border: "border-purple-200/60",
  },
  admin_cabang: {
    label: "Admin Cabang",
    bg: "bg-blue-50",
    text: "text-blue-600",
    border: "border-blue-200/60",
  },
  mitra_agen: {
    label: "Mitra Agen",
    bg: "bg-amber-50",
    text: "text-amber-600",
    border: "border-amber-200/60",
  },
  muthawif: {
    label: "Muthawif",
    bg: "bg-teal-50",
    text: "text-teal-600",
    border: "border-teal-200/60",
  },
  jamaah: {
    label: "Jamaah",
    bg: "bg-emerald-50",
    text: "text-emerald-600",
    border: "border-emerald-200/60",
  },
  jamaah_umroh: {
    label: "Jamaah",
    bg: "bg-emerald-50",
    text: "text-emerald-600",
    border: "border-emerald-200/60",
  },
};

export const RoleBadge: React.FC<RoleBadgeProps> = ({ role, className }) => {
  const normalizedKey = (role || "jamaah").toLowerCase().trim();
  const config =
    ROLE_CONFIGS_MAP[normalizedKey] || {
      label: role,
      bg: "bg-slate-50",
      text: "text-slate-700",
      border: "border-slate-200",
      avatarBg: "bg-slate-500",
    };

  return (
    <span
      className={cn(
        "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border transition-colors",
        config.bg,
        config.text,
        config.border,
        className
      )}
    >
      {config.label}
    </span>
  );
};
