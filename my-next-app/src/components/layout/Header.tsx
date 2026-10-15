"use client";

import * as React from "react";
import {
  Menu,
  Bell,
  LogOut,
  ChevronDown,
  Globe2,
  UserCheck,
  Shield,
  Building,
  User,
  Compass,
} from "lucide-react";
import { useRole, UserRole, ROLE_CONFIGS } from "@/context/RoleContext";
import { useRouter } from "next/navigation";

interface HeaderProps {
  onToggleSidebar: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onToggleSidebar }) => {
  const router = useRouter();
  const { role, setRole, config } = useRole();
  const [roleMenuOpen, setRoleMenuOpen] = React.useState<boolean>(false);
  const [branchMenuOpen, setBranchMenuOpen] = React.useState<boolean>(false);
  const [selectedBranch, setSelectedBranch] = React.useState<string>("Semua Cabang (Global)");

  const roleMenuRef = React.useRef<HTMLDivElement>(null);
  const branchMenuRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        roleMenuRef.current &&
        !roleMenuRef.current.contains(event.target as Node)
      ) {
        setRoleMenuOpen(false);
      }
      if (
        branchMenuRef.current &&
        !branchMenuRef.current.contains(event.target as Node)
      ) {
        setBranchMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleLogout = async () => {
    try {
      const { createClient } = await import("@/lib/supabase/client");
      const supabase = createClient();
      await supabase.auth.signOut();
    } catch {
      // Continue cleanup
    }
    document.cookie = "umroh_admin_session=; path=/; max-age=0";
    router.push("/login");
  };

  const rolesList: { id: UserRole; label: string; icon: React.ElementType }[] = [
    { id: "super_admin", label: "Super Admin", icon: Shield },
    { id: "admin_cabang", label: "Admin Cabang", icon: Building },
    { id: "mitra_agen", label: "Mitra Agen", icon: UserCheck },
    { id: "jamaah_umroh", label: "Jamaah Umroh", icon: User },
    { id: "muthawif", label: "Muthawif / Guide", icon: Compass },
  ];

  const branches = [
    "Semua Cabang (Global)",
    "Cabang Jakarta Selatan",
    "Cabang Surabaya Pusat",
    "Cabang Bandung Kota",
    "Cabang Medan Merdeka",
  ];

  return (
    <header className="sticky top-0 z-30 flex h-16 w-full items-center justify-between border-b border-slate-200/80 bg-white/95 px-4 sm:px-8 backdrop-blur-md">
      {/* Left: Mobile Toggle & Page Title */}
      <div className="flex items-center gap-3">
        <button
          onClick={onToggleSidebar}
          aria-label="Buka Menu"
          className="rounded-lg border border-slate-200 p-2 text-slate-600 hover:bg-slate-100 lg:hidden transition"
        >
          <Menu className="h-5 w-5" />
        </button>

        <h2 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight">
          {config.headerTitle}
        </h2>
      </div>

      {/* Right Controls: Role Switcher, Branch Filter, Bell, Avatar, Logout */}
      <div className="flex items-center gap-2.5 sm:gap-3">
        {/* Role Demo Switcher Pill */}
        <div className="relative" ref={roleMenuRef}>
          <button
            onClick={() => setRoleMenuOpen(!roleMenuOpen)}
            className="flex items-center gap-1.5 rounded-full border border-emerald-300/80 bg-emerald-50/60 px-3 py-1.5 text-xs font-semibold text-emerald-800 hover:bg-emerald-100/70 transition shadow-sm"
          >
            <span className="text-slate-500 font-normal hidden sm:inline">Peran Demo:</span>
            <span className="font-bold text-emerald-700">{config.label}</span>
            <ChevronDown className="h-3.5 w-3.5 text-emerald-600" />
          </button>

          {roleMenuOpen && (
            <div className="absolute right-0 mt-2 w-52 rounded-xl bg-white p-1.5 shadow-xl border border-slate-200 z-50 animate-in fade-in-50 zoom-in-95">
              <div className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                Pilih Peran Demo
              </div>
              {rolesList.map((item) => {
                const Icon = item.icon;
                const isCurrent = role === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => {
                      setRole(item.id);
                      setRoleMenuOpen(false);
                    }}
                    className={`flex w-full items-center justify-between rounded-lg px-3 py-2 text-xs font-medium transition ${
                      isCurrent
                        ? "bg-emerald-50 text-emerald-800 font-bold"
                        : "text-slate-700 hover:bg-slate-50"
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <Icon className={`h-4 w-4 ${isCurrent ? "text-emerald-700" : "text-slate-400"}`} />
                      <span>{item.label}</span>
                    </div>
                    {isCurrent && (
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-600" />
                    )}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Branch Filter Selector (Only for Super Admin) */}
        {role === "super_admin" && (
          <div className="relative hidden md:block" ref={branchMenuRef}>
            <button
              onClick={() => setBranchMenuOpen(!branchMenuOpen)}
              className="flex items-center gap-1.5 rounded-full border border-slate-200 bg-slate-50/70 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-100 transition shadow-sm"
            >
              <Globe2 className="h-3.5 w-3.5 text-emerald-600" />
              <span>{selectedBranch}</span>
              <ChevronDown className="h-3.5 w-3.5 text-slate-400" />
            </button>

            {branchMenuOpen && (
              <div className="absolute right-0 mt-2 w-56 rounded-xl bg-white p-1.5 shadow-xl border border-slate-200 z-50">
                <div className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  Filter Cabang
                </div>
                {branches.map((b) => (
                  <button
                    key={b}
                    onClick={() => {
                      setSelectedBranch(b);
                      setBranchMenuOpen(false);
                    }}
                    className={`flex w-full items-center justify-between rounded-lg px-3 py-2 text-xs transition ${
                      selectedBranch === b
                        ? "bg-emerald-50 text-emerald-800 font-bold"
                        : "text-slate-700 hover:bg-slate-50 font-medium"
                    }`}
                  >
                    <span>{b}</span>
                    {selectedBranch === b && (
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-600" />
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Bell notification */}
        <button
          aria-label="Notifikasi"
          className="relative rounded-full p-2 text-slate-500 hover:bg-slate-100 hover:text-slate-700 transition"
        >
          <Bell className="h-4.5 w-4.5" />
          <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-emerald-600 ring-2 ring-white" />
        </button>

        {/* User circle U */}
        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-100/90 text-emerald-800 font-bold text-xs shadow-inner">
          U
        </div>

        {/* Keluar red outline button */}
        <button
          onClick={handleLogout}
          className="flex items-center gap-1.5 rounded-lg border border-red-200 bg-white px-3 py-1.5 text-xs font-semibold text-red-600 hover:bg-red-50 hover:border-red-300 transition shadow-sm"
        >
          <LogOut className="h-3.5 w-3.5 text-red-500" />
          <span>Keluar</span>
        </button>
      </div>
    </header>
  );
};
