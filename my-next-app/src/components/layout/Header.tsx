"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { ChevronDown, LogOut, Menu } from "lucide-react";
import { useRole } from "@/context/RoleContext";
import { initialsOf } from "@/lib/auth/roles";

interface HeaderProps {
  onToggleSidebar: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onToggleSidebar }) => {
  const router = useRouter();
  const { user, roleLabel } = useRole();
  const [profileMenuOpen, setProfileMenuOpen] = React.useState<boolean>(false);
  const [todayLabel, setTodayLabel] = React.useState<string>("");
  const [isLoggingOut, setIsLoggingOut] = React.useState<boolean>(false);
  const profileMenuRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    setTodayLabel(
      new Date().toLocaleDateString("id-ID", {
        weekday: "long",
        day: "numeric",
        month: "long",
        year: "numeric",
      })
    );
  }, []);

  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        profileMenuRef.current &&
        !profileMenuRef.current.contains(event.target as Node)
      ) {
        setProfileMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleLogout = async () => {
    setIsLoggingOut(true);
    try {
      const { createClient } = await import("@/lib/supabase/client");
      const supabase = createClient();
      await supabase.auth.signOut();
    } catch {
      // Sesi lokal dibersihkan di bawah, jadi tetap lanjut ke halaman login.
    }
    router.push("/login");
    router.refresh();
  };

  return (
    <header className="sticky top-0 z-30 flex h-16 w-full items-center justify-between border-b border-gray-200/80 bg-white px-4 sm:px-8">
      {/* Left: Mobile Toggle & Welcome Message */}
      <div className="flex items-center gap-3">
        <button
          onClick={onToggleSidebar}
          aria-label="Buka Menu"
          className="rounded-lg border border-gray-200 p-2 text-gray-600 hover:bg-gray-100 lg:hidden transition cursor-pointer"
        >
          <Menu className="h-5 w-5" />
        </button>

        <div>
          <p className="text-xs font-semibold text-gray-900 leading-tight">
            Selamat datang, {user.name}
          </p>
          <p className="text-[11px] text-gray-400 mt-0.5 leading-tight">
            {todayLabel}
          </p>
        </div>
      </div>

      {/* Right Controls: User Profile Info */}
      <div className="flex items-center gap-3">
        <div className="relative flex items-center" ref={profileMenuRef}>
          <button
            onClick={() => setProfileMenuOpen(!profileMenuOpen)}
            className="flex items-center gap-2.5 hover:opacity-90 transition text-left cursor-pointer"
          >
            {/* Avatar */}
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#0d9488] text-white font-bold text-xs shadow-xs">
              {initialsOf(user.name)}
            </div>

            <div className="hidden sm:block">
              <p className="text-xs font-bold text-gray-900 leading-tight">
                {user.name}
              </p>
              <p className="text-[10px] text-gray-400 leading-tight mt-0.5">
                {roleLabel}
              </p>
            </div>
            <ChevronDown className="h-3.5 w-3.5 text-gray-400 hidden sm:block" />
          </button>

          {profileMenuOpen && (
            <div className="absolute right-0 top-11 mt-2 w-64 rounded-xl bg-white p-2 shadow-xl border border-gray-200 z-50 animate-in fade-in-50 zoom-in-95">
              <div className="px-3 py-2 border-b border-gray-100 mb-1">
                <p className="text-xs font-bold text-gray-800 truncate">
                  {user.name}
                </p>
                <p className="text-[11px] text-gray-500 truncate">{user.email}</p>
                <p className="text-[10px] text-gray-400 mt-0.5">
                  Peran: {roleLabel}
                </p>
              </div>
              <button
                onClick={handleLogout}
                disabled={isLoggingOut}
                className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-xs font-medium text-red-600 hover:bg-red-50 transition cursor-pointer disabled:opacity-60"
              >
                <LogOut className="h-4 w-4 text-red-500" />
                <span>{isLoggingOut ? "Keluar..." : "Keluar"}</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
