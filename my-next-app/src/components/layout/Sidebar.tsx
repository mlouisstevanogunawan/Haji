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
  Sliders,
  ShieldCheck,
  LogOut,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useRole } from "@/context/RoleContext";
import { createClient } from "@/lib/supabase/client";

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

  const handleLogout = async () => {
    try {
      const supabase = createClient();
      await supabase.auth.signOut();
    } catch {
      // Token lokal sudah dihapus; tetap lanjut ke halaman login.
    }
    router.push("/login");
    router.refresh();
  };

  const getNavSections = (): NavSection[] => {
    if (role === "jamaah_umroh") {
      return [
        {
          items: [{ label: "Dashboard", href: "/dashboard", icon: LayoutDashboard }],
        },
        {
          title: "PERJALANAN SAYA",
          items: [
            { label: "Pendaftaran Saya", href: "/pendaftaran", icon: UserPlus },
            { label: "Dokumen Saya", href: "/dokumen", icon: FileCheck },
            { label: "Pembayaran", href: "/pembayaran", icon: CreditCard },
            { label: "Jadwal Manasik", href: "/manasik", icon: Calendar },
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
            { label: "Manasik & Absensi", href: "/manasik", icon: Calendar },
          ],
        },
      ];
    }

    if (role === "admin_cabang") {
      return [
        {
          items: [{ label: "Dashboard", href: "/dashboard", icon: LayoutDashboard }],
        },
        {
          title: "MASTER DATA",
          items: [
            { label: "Paket", href: "/paket", icon: Package },
            { label: "Hotel", href: "/hotel", icon: Hotel },
            { label: "Maskapai", href: "/maskapai", icon: Plane },
            { label: "Rekening Bank", href: "/rekening-bank", icon: CreditCard },
            { label: "Agen", href: "/agen", icon: UserCheck },
            { label: "Muthawif", href: "/muthawif", icon: Compass },
            { label: "Jamaah", href: "/jamaah", icon: Users },
          ],
        },
        {
          title: "OPERASIONAL",
          items: [
            { label: "Pendaftaran", href: "/pendaftaran", icon: UserPlus },
            { label: "Dokumen", href: "/dokumen", icon: FileCheck },
            { label: "Pembayaran", href: "/pembayaran", icon: Receipt },
            { label: "Manasik", href: "/manasik", icon: Calendar },
            { label: "Manifest & Rooming", href: "/manifest", icon: Layers },
            { label: "Perlengkapan", href: "/perlengkapan", icon: Shirt },
            { label: "Komisi Agen", href: "/komisi-agen", icon: Percent },
            { label: "Pengumuman", href: "/pengumuman", icon: Megaphone },
          ],
        },
        {
          title: "SISTEM",
          items: [
            { label: "Log Aktivitas", href: "/activity-logs", icon: ShieldCheck },
          ],
        },
      ];
    }

    if (role === "mitra_agen") {
      return [
        {
          items: [{ label: "Dashboard", href: "/agen/dashboard", icon: LayoutDashboard }],
        },
        {
          title: "MARKETING",
          items: [
            { label: "Jamaah Referral", href: "/agen/jamaah", icon: Users },
            { label: "Pendaftaran", href: "/agen/pendaftaran", icon: UserPlus },
            { label: "Komisi Saya", href: "/agen/komisi", icon: Percent },
          ],
        },
      ];
    }

    // Default: Super Admin
    return [
      {
        items: [{ label: "Dashboard", href: "/dashboard", icon: LayoutDashboard }],
      },
      {
        title: "MASTER DATA",
        items: [
          { label: "Cabang", href: "/cabang", icon: Building },
          { label: "Paket", href: "/paket", icon: Package },
          { label: "Hotel", href: "/hotel", icon: Hotel },
          { label: "Maskapai", href: "/maskapai", icon: Plane },
          { label: "Rekening Bank", href: "/rekening-bank", icon: CreditCard },
          { label: "Agen", href: "/agen", icon: UserCheck },
          { label: "Muthawif", href: "/muthawif", icon: Compass },
          { label: "Jamaah", href: "/jamaah", icon: Users },
        ],
      },
      {
        title: "OPERASIONAL",
        items: [
          { label: "Pendaftaran", href: "/pendaftaran", icon: UserPlus },
          { label: "Dokumen", href: "/dokumen", icon: FileCheck },
          { label: "Pembayaran", href: "/pembayaran", icon: Receipt },
          { label: "Manasik", href: "/manasik", icon: Calendar },
          { label: "Manifest & Rooming", href: "/manifest", icon: Layers },
          { label: "Perlengkapan", href: "/perlengkapan", icon: Shirt },
          { label: "Komisi Agen", href: "/komisi-agen", icon: Percent },
          { label: "Pengumuman", href: "/pengumuman", icon: Megaphone },
        ],
      },
      {
        title: "SISTEM",
        items: [
          { label: "Pengguna", href: "/super-admin/pengguna", icon: UserCog },
          { label: "White-label", href: "/super-admin/white-label", icon: Sliders },
          { label: "Log Aktivitas", href: "/activity-logs", icon: ShieldCheck },
        ],
      },
    ];
  };

  const navSections = getNavSections();

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-gray-900/40 backdrop-blur-xs lg:hidden transition-opacity"
          onClick={onClose}
        />
      )}

      {/* Sidebar Aside */}
      <aside
        className={cn(
          "fixed top-0 bottom-0 left-0 z-50 flex w-64 flex-col bg-white text-gray-700 transition-transform duration-300 ease-in-out lg:static lg:translate-x-0 border-r border-gray-200/80 shadow-md lg:shadow-none",
          isOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        {/* Brand Header */}
        <div className="flex h-16 items-center justify-between px-5 border-b border-gray-100 bg-white">
          <Link href={role === "muthawif" ? "/dashboard" : "/dashboard"} className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#0d9488] text-white font-bold text-xs shadow-xs">
              TU
            </div>
            <div>
              <span className="font-bold text-xs tracking-tight text-gray-900 block leading-tight">
                Travel Umroh &amp; Haji
              </span>
              <span className="text-[10px] text-gray-400 block leading-tight">
                Sistem Manajemen Umroh &amp; Haji
              </span>
            </div>
          </Link>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 lg:hidden cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Navigation Menu */}
        <div className="flex-1 overflow-y-auto px-3 py-3 space-y-4">
          {navSections.map((section, sIdx) => (
            <div key={sIdx} className="space-y-1">
              {section.title && (
                <div className="px-3 pt-2 pb-1 text-[10px] font-bold uppercase tracking-wider text-gray-400">
                  {section.title}
                </div>
              )}
              {section.items.map((item, iIdx) => {
                const isDashboard = item.label === "Dashboard";
                let isActive = false;
                if (isDashboard) {
                  isActive =
                    (pathname === "/dashboard" && role !== "mitra_agen") ||
                    pathname === "/super-admin/dashboard" ||
                    pathname === "/admin/dashboard" ||
                    pathname === "/muthawif/dashboard" ||
                    pathname === "/jamaah/dashboard" ||
                    pathname === "/agen/dashboard" ||
                    (pathname === "/dashboard" && role === "mitra_agen");
                } else {
                  if (pathname === item.href || pathname.startsWith(item.href + "/")) {
                    isActive = true;
                  }
                  if (
                    item.label === "Pendaftaran Saya" &&
                    (pathname.startsWith("/pendaftaran") || pathname.startsWith("/jamaah/pendaftaran"))
                  ) {
                    isActive = true;
                  }
                  if (
                    item.label === "Dokumen Saya" &&
                    (pathname.startsWith("/dokumen") || pathname.startsWith("/jamaah/dokumen"))
                  ) {
                    isActive = true;
                  }
                  if (
                    item.label === "Jadwal Manasik" &&
                    (pathname.startsWith("/manasik") || pathname.startsWith("/jamaah/manasik"))
                  ) {
                    isActive = true;
                  }
                  if (
                    item.label === "Jamaah Bimbingan" &&
                    (pathname.startsWith("/jamaah-bimbingan") ||
                      pathname.startsWith("/muthawif/jamaah") ||
                      (role === "muthawif" && pathname.startsWith("/jamaah")))
                  ) {
                    isActive = true;
                  }
                  if (
                    item.label === "Manasik & Absensi" &&
                    (pathname.startsWith("/manasik") ||
                      pathname.startsWith("/muthawif/manasik"))
                  ) {
                    isActive = true;
                  }
                  if (
                    item.href === "/paket" &&
                    (pathname.startsWith("/paket") || pathname.startsWith("/super-admin/paket"))
                  ) {
                    isActive = true;
                  }
                  if (
                    item.href === "/hotel" &&
                    (pathname.startsWith("/hotels") || pathname.startsWith("/hotel") || pathname.startsWith("/super-admin/hotel"))
                  ) {
                    isActive = true;
                  }
                  if (
                    item.href === "/maskapai" &&
                    (pathname.startsWith("/airlines") || pathname.startsWith("/maskapai") || pathname.startsWith("/super-admin/maskapai"))
                  ) {
                    isActive = true;
                  }
                  if (
                    item.href === "/rekening-bank" &&
                    (pathname.startsWith("/rekening-bank") || pathname.startsWith("/bank"))
                  ) {
                    isActive = true;
                  }
                  if (
                    item.href === "/agen" &&
                    (pathname.startsWith("/agen") || pathname.startsWith("/mitra-agen"))
                  ) {
                    isActive = true;
                  }
                  if (
                    item.href === "/jamaah" &&
                    (pathname.startsWith("/jamaah") || pathname.startsWith("/data-jamaah"))
                  ) {
                    isActive = true;
                  }
                  if (
                    item.href === "/dokumen" &&
                    (pathname.startsWith("/dokumen") || pathname.startsWith("/dokumen-paspor"))
                  ) {
                    isActive = true;
                  }
                  if (
                    item.href === "/pembayaran" &&
                    (pathname.startsWith("/pembayaran") ||
                      pathname.startsWith("/tagihan-kasir") ||
                      pathname.startsWith("/billing") ||
                      pathname.startsWith("/payments"))
                  ) {
                    isActive = true;
                  }
                  if (
                    item.href === "/perlengkapan" &&
                    (pathname.startsWith("/perlengkapan") ||
                      pathname.startsWith("/equipment"))
                  ) {
                    isActive = true;
                  }
                  if (
                    item.href === "/komisi-agen" &&
                    (pathname.startsWith("/komisi-agen") || pathname.startsWith("/komisi"))
                  ) {
                    isActive = true;
                  }
                  if (
                    (item.href === "/pengguna" || item.href === "/super-admin/pengguna") &&
                    (pathname.startsWith("/pengguna") ||
                      pathname.startsWith("/users") ||
                      pathname.startsWith("/super-admin/pengguna"))
                  ) {
                    isActive = true;
                  }
                  if (
                    item.href === "/cabang" &&
                    (pathname.startsWith("/cabang") ||
                      pathname.startsWith("/kelola-cabang") ||
                      pathname.startsWith("/super-admin/cabang"))
                  ) {
                    isActive = true;
                  }
                  if (
                    (item.href === "/pengaturan" ||
                      item.href === "/super-admin/white-label" ||
                      item.href === "/white-label") &&
                    (pathname.startsWith("/pengaturan") ||
                      pathname.startsWith("/white-label") ||
                      pathname.startsWith("/super-admin/white-label") ||
                      pathname.startsWith("/pengaturan-sistem"))
                  ) {
                    isActive = true;
                  }
                  if (
                    item.label === "Jamaah Referral" &&
                    (pathname.startsWith("/agen/jamaah") ||
                      pathname.startsWith("/referral") ||
                      pathname.startsWith("/agen/referral"))
                  ) {
                    isActive = true;
                  }
                  if (
                    item.label === "Pendaftaran" &&
                    role === "mitra_agen" &&
                    (pathname.startsWith("/agen/pendaftaran") || pathname.startsWith("/pendaftaran"))
                  ) {
                    isActive = true;
                  }
                  if (
                    item.label === "Komisi Saya" &&
                    (pathname.startsWith("/agen/komisi") ||
                      pathname.startsWith("/komisi") ||
                      pathname.startsWith("/komisi-agen"))
                  ) {
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
                      "flex items-center justify-between rounded-lg px-3 py-2 text-xs font-medium transition-colors",
                      isActive
                        ? "bg-teal-50 text-teal-700 font-semibold"
                        : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                    )}
                  >
                    <div className="flex items-center gap-2.5">
                      <Icon
                        className={cn(
                          "h-4 w-4 transition-colors",
                          isActive ? "text-[#0d9488]" : "text-gray-400"
                        )}
                      />
                      <span>{item.label}</span>
                    </div>
                    {item.badge && (
                      <span className="rounded-full bg-gray-100 px-2 py-0.5 text-[10px] font-semibold text-gray-600">
                        {item.badge}
                      </span>
                    )}
                  </Link>
                );
              })}
            </div>
          ))}
        </div>

        {/* Footer Area: Logout */}
        <div className="border-t border-gray-100 p-4 bg-white">
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 font-medium text-xs text-gray-600 hover:text-red-600 transition cursor-pointer w-full"
          >
            <LogOut className="h-4 w-4" />
            <span>Keluar</span>
          </button>
        </div>
      </aside>
    </>
  );
};
