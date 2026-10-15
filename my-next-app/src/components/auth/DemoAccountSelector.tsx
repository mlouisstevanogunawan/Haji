"use client";

import * as React from "react";
import { KeyRound, Building2, Briefcase, User, GraduationCap } from "lucide-react";

export interface DemoAccount {
  id: string;
  role: string;
  label: string;
  email: string;
  icon: React.ReactNode;
}

interface DemoAccountSelectorProps {
  selectedId: string | null;
  onSelect: (account: DemoAccount) => void;
}

export const DEMO_ACCOUNTS: DemoAccount[] = [
  {
    id: "super_admin",
    role: "Super Admin",
    label: "Super Admin",
    email: "admin@travel.com",
    icon: <KeyRound className="w-3.5 h-3.5 text-amber-500" />,
  },
  {
    id: "admin_cabang",
    role: "Admin Cabang",
    label: "Admin Cabang",
    email: "cabang@travel.com",
    icon: <Building2 className="w-3.5 h-3.5 text-blue-500" />,
  },
  {
    id: "mitra_agen",
    role: "Mitra Agen",
    label: "Mitra Agen",
    email: "agen@travel.com",
    icon: <Briefcase className="w-3.5 h-3.5 text-purple-500" />,
  },
  {
    id: "jamaah_umroh",
    role: "Jamaah Umroh",
    label: "Jamaah Umroh",
    email: "jamaah@travel.com",
    icon: <User className="w-3.5 h-3.5 text-emerald-500" />,
  },
  {
    id: "muthawif",
    role: "Muthawif",
    label: "Muthawif",
    email: "muthawif@travel.com",
    icon: <GraduationCap className="w-3.5 h-3.5 text-teal-600" />,
  },
];

export const DemoAccountSelector: React.FC<DemoAccountSelectorProps> = ({
  selectedId,
  onSelect,
}) => {
  return (
    <div className="rounded-xl border border-slate-200/90 bg-slate-50/70 p-3.5 my-5">
      <span className="block text-[10px] font-bold tracking-wider text-slate-500 uppercase mb-2.5">
        PILIH AKUN DEMO (PASSWORD: PASSWORD)
      </span>

      <div className="flex flex-wrap gap-2">
        {DEMO_ACCOUNTS.map((acc) => {
          const isSelected = selectedId === acc.id;

          return (
            <button
              key={acc.id}
              type="button"
              onClick={() => onSelect(acc)}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all duration-150 ${
                isSelected
                  ? "bg-emerald-600 text-white shadow-xs"
                  : "bg-white text-slate-700 border border-slate-200 hover:border-emerald-500 hover:text-emerald-700 shadow-xs"
              }`}
            >
              <span className={isSelected ? "text-white" : ""}>{acc.icon}</span>
              <span>{acc.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
};
