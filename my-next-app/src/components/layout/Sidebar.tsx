"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  Building,
  Package,
  Hotel,
  Plane,
  CreditCard,
  UserCheck,
  Compass,
  Users,
  UserPlus,
  FileCheck,
  Receipt,
  Calendar,
  Layers,
  Shirt,
  Percent,
  Megaphone,
  UserCog,
  Settings,
  History,
  ShieldCheck,
  LogOut,
  X,
  FileText,
  Wallet,
  BookOpen,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useRole } from "@/context/RoleContext";

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

interface NavSection {
  title?: string;
  items: {
    label: string;
    href: string;
    icon: React.ElementType;
    badge?: string;
  }[];
}

export const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose }) => {
  const pathname = usePathname();
  const router = useRouter();
  const { role } = useRole();

  const handleLogout = () => {
    document.cookie = "umroh_admin_session=; path=/; max-age=0";
    router.push("/login");
  };

  // Build menu according to active role
  const getNavSections = (): NavSection[] => {
    if (role === "mitra_agen") {
      return [
        {
          items: [{ label: "Dashboard", href: "/dashboard", icon: LayoutDashboard }],
        },
        {
          title: "MARKETING",
          items: [
            { label: "Jamaah Referral", href: "/referral", icon: Users },
            { label: "Pendaftaran Paket", href: "/pendaftaran", icon: Package },
            { label: "Komisi Saya", href: "/komisi", icon: Percent },
            { label: "Paket Tersedia", href: "/paket", icon: Layers },
            { label: "Pengumuman Travel", href: "/pengumuman", icon: Megaphone },
          ],
        },
      ];
    }

    if (role === "jamaah_umroh") {
      return [
        {
          items: [{ label: "Dashboard", href: "/dashboard", icon: LayoutDashboard }],
        },
        {
          title: "PERJALANAN SAYA",
          items: [
            { label: "Pendaftaran Saya", href: "/students", icon: FileText },
            { label: "Dokumen & Paspor", href: "/tasks", icon: FileCheck },
            { label: "Pembayaran & Tagihan", href: "/reports", icon: Receipt },
            { label: "Jadwal Manasik", href: "/manasik", icon: Calendar },
            { label: "Perlengkapan Ibadah", href: "/equipment", icon: Shirt },
            { label: "Pengumuman Travel", href: "/announcements", icon: Megaphone },
          ],
        },
      ];
    }

    if (role === "muthawif") {
      return [
        {
          items: [{ label: "Dashboard", href: "/dashboard", icon: LayoutDashboard }],
        },
        {
          title: "BIMBINGAN",
          items: [
            { label: "Jamaah Bimbingan", href: "/jamaah-bimbingan", icon: Users },
            { label: "Manasik & Absensi", href: "/manasik", icon: BookOpen },
            { label: "Manifest Rombongan", href: "/manifest", icon: Layers },
            { label: "Pengumuman Travel", href: "/pengumuman", icon: Megaphone },
          ],
        },
      ];
    }

    // Default: Super Admin & Admin Cabang
    const isCabang = role === "admin_cabang";
    const masterDataItems = [
      ...(isCabang ? [] : [{ label: "Kelola Cabang", href: "/cabang", icon: Building }]),
      { label: "Paket Umroh & Haji", href: "/paket", icon: Package },
      { label: "Hotel Makkah & Madinah", href: "/hotels", icon: Hotel },
      { label: "Maskapai Penerbangan", href: "/airlines", icon: Plane },
      { label: "Rekening Bank", href: "/rekening-bank", icon: CreditCard },
      { label: "Mitra Agen", href: "/mitra-agen", icon: UserCheck },
      { label: "Muthawif / Guide", href: "/muthawif", icon: Compass },
      { label: "Data Jamaah", href: "/data-jamaah", icon: Users },
    ];

    const operasionalItems = [
      { label: "Pendaftaran & Kuota", href: "/pendaftaran", icon: UserPlus },
      { label: "Dokumen & Paspor", href: "/dokumen-paspor", icon: FileCheck },
      { label: "Tagihan & Kasir", href: "/tagihan-kasir", icon: Receipt },
      { label: "Jadwal Manasik", href: "/manasik", icon: Calendar },
      { label: "Manifest & Rooming", href: "/manifest", icon: Layers },
      { label: "Perlengkapan Jamaah", href: "/perlengkapan-jamaah", icon: Shirt },
      { label: "Komisi Agen", href: "/komisi", icon: Percent },
      { label: "Pengumuman", href: "/pengumuman", icon: Megaphone },
    ];

    const sistemItems = [
      { label: "Kelola Pengguna", href: "/users", icon: UserCog },
      ...(isCabang ? [] : [{ label: "Pengaturan Sistem", href: "/pengaturan-sistem", icon: Settings }]),
      { label: "Log Aktivitas", href: "/activity-logs", icon: ShieldCheck },
    ];

    return [
      {
        items: [{ label: "Dashboard", href: "/dashboard", icon: LayoutDashboard }],
      },
      {
        title: "MASTER DATA",
        items: masterDataItems,
      },
      {
        title: "OPERASIONAL",
        items: operasionalItems,
      },
      {
        title: "SISTEM",
        items: sistemItems,
      },
    ];
  };

  const navSections = getNavSections();

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-900/40 backdrop-blur-sm lg:hidden transition-opacity"
          onClick={onClose}
        />
      )}

      {/* Sidebar Aside */}
      <aside
        className={cn(
          "fixed top-0 bottom-0 left-0 z-50 flex w-64 flex-col bg-white text-slate-700 transition-transform duration-300 ease-in-out lg:static lg:translate-x-0 border-r border-slate-200/80 shadow-lg lg:shadow-none",
          isOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        {/* Brand Header */}
        <div className="flex h-16 items-center justify-between px-5 border-b border-slate-100 bg-white">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-600 text-white shadow-sm font-bold">
              <Compass className="h-5 w-5 stroke-[2.2]" />
            </div>
            <div>
              <span className="font-extrabold text-sm tracking-tight text-slate-900 block leading-tight">
                Al-Madinah Travel
              </span>
              <span className="text-[10px] font-bold tracking-wider text-emerald-700 uppercase block">
                MANAGEMENT PORTAL
              </span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 lg:hidden"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Navigation Menu */}
        <div className="flex-1 overflow-y-auto px-3 py-3 space-y-4">
          {navSections.map((section, sIdx) => (
            <div key={sIdx} className="space-y-1">
              {section.title && (
                <div className="px-3 pt-2 pb-1 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  {section.title}
                </div>
              )}
              {section.items.map((item, iIdx) => {
                const isDashboard = item.label === "Dashboard";
                let isActive = false;
                if (isDashboard) {
                  isActive = pathname === "/dashboard";
                } else {
                  if (pathname === item.href || pathname.startsWith(item.href + "/")) {
                    isActive = true;
                  }
                  if (item.href === "/cabang" && (pathname === "/cabang" || pathname.startsWith("/cabang") || pathname.startsWith("/kelola-cabang"))) {
                    isActive = true;
                  }
                  if (item.href === "/hotels" && (pathname.startsWith("/hotels") || pathname.startsWith("/hotel"))) {
                    isActive = true;
                  }
                  if (item.href === "/airlines" && (pathname.startsWith("/airlines") || pathname.startsWith("/maskapai"))) {
                    isActive = true;
                  }
                  if (item.href === "/rekening-bank" && (pathname.startsWith("/rekening-bank") || pathname.startsWith("/bank"))) {
                    isActive = true;
                  }
                  if ((item.href === "/data-jamaah" || item.href === "/students") && (pathname.startsWith("/data-jamaah") || pathname.startsWith("/jamaah") || pathname.startsWith("/students"))) {
                    isActive = true;
                  }
                  if ((item.href === "/dokumen-paspor" || item.href === "/tasks") && (pathname.startsWith("/dokumen-paspor") || pathname.startsWith("/tasks"))) {
                    isActive = true;
                  }
                  if ((item.href === "/tagihan-kasir" || item.href === "/reports") && (pathname.startsWith("/tagihan-kasir") || pathname.startsWith("/billing") || pathname.startsWith("/reports") || pathname.startsWith("/payments"))) {
                    isActive = true;
                  }
                  if (item.href === "/manasik" && pathname.startsWith("/manasik")) {
                    isActive = true;
                  }
                  if ((item.href === "/perlengkapan-jamaah" || item.href === "/equipment" || item.href === "/perlengkapan") && (pathname.startsWith("/perlengkapan") || pathname.startsWith("/equipment"))) {
                    isActive = true;
                  }
                  if ((item.href === "/pengumuman" || item.href === "/announcements") && (pathname.startsWith("/pengumuman") || pathname.startsWith("/announcements"))) {
                    isActive = true;
                  }
                  if (item.href === "/users" && (pathname.startsWith("/users") || pathname.startsWith("/dashboard/users"))) {
                    isActive = true;
                  }
                  if (item.href === "/activity-logs" && (pathname.startsWith("/activity-logs") || pathname.startsWith("/dashboard/activity-logs"))) {
                    isActive = true;
                  }
                  if (item.href === "/pengaturan-sistem" && (pathname.startsWith("/pengaturan-sistem") || pathname.startsWith("/pengaturan") || pathname.startsWith("/settings"))) {
                    isActive = true;
                  }
                }
                const Icon = item.icon;

                return (
                  <Link
                    key={iIdx}
                    href={item.href}
                    onClick={() => {
                      if (window.innerWidth < 1024) onClose();
                    }}
                    className={cn(
                      "flex items-center justify-between rounded-lg px-3 py-2 text-xs font-medium transition-colors border border-transparent",
                      isActive
                        ? "bg-emerald-50 text-emerald-800 font-bold border-emerald-300"
                        : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                    )}
                  >
                    <div className="flex items-center gap-2.5">
                      <Icon
                        className={cn(
                          "h-4 w-4 transition-colors",
                          isActive ? "text-emerald-700" : "text-slate-400"
                        )}
                      />
                      <span>{item.label}</span>
                    </div>
                    {item.badge && (
                      <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-600">
                        {item.badge}
                      </span>
                    )}
                  </Link>
                );
              })}
            </div>
          ))}
        </div>

        {/* Footer Area: Logout & Version Box */}
        <div className="border-t border-slate-100 p-3 bg-white space-y-2.5">
          {/* Logout button */}
          <div className="flex items-center justify-between px-2 text-xs">
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 font-semibold text-red-500 hover:text-red-600 transition"
            >
              <LogOut className="h-4 w-4" />
              <span>Keluar (Logout)</span>
            </button>
            <Link
              href="/login"
              className="text-[11px] text-slate-400 hover:text-slate-600"
            >
              /login
            </Link>
          </div>

          {/* V1.0 Production Badge */}
          <div className="rounded-xl border border-slate-200/80 bg-slate-50/70 p-2.5">
            <div className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-emerald-500" />
              <span className="text-[11px] font-bold text-slate-800">
                V1.0 Production
              </span>
            </div>
            <p className="text-[10px] text-slate-400 mt-0.5">Direct Supabase &amp; RLS</p>
          </div>
        </div>
      </aside>
    </>
  );
};
