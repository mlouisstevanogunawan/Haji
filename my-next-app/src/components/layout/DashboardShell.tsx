"use client";

import * as React from "react";
import { Sidebar } from "@/components/layout/Sidebar";
import { Header } from "@/components/layout/Header";

export function DashboardShell({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = React.useState<boolean>(false);

  return (
    <div className="flex min-h-screen bg-[#f8faf9]">
      {/* Sidebar Navigation */}
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      {/* Main Content Wrapper */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Top Header */}
        <Header onToggleSidebar={() => setSidebarOpen(true)} />

        {/* Scrollable Page Body */}
        <main className="flex-1 overflow-y-auto px-4 py-6 sm:px-8 sm:py-8 flex flex-col justify-between">
          <div className="mx-auto max-w-7xl w-full">{children}</div>
          <footer className="mt-16 text-center text-[11px] text-gray-400 space-y-0.5 pb-6 select-none">
            <p>© 2026 Travel Umroh &amp; Haji — Sistem Manajemen Umroh &amp; Haji.</p>
            <p>© 2026 Toko Source Code</p>
          </footer>
        </main>
      </div>
    </div>
  );
}
