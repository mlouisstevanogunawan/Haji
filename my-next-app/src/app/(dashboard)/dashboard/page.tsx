"use client";

import * as React from "react";
import { useRole } from "@/context/RoleContext";
import { SuperAdminDashboard } from "@/components/dashboard/roles/SuperAdminDashboard";
import { MitraAgenDashboard } from "@/components/dashboard/roles/MitraAgenDashboard";
import { JamaahDashboard } from "@/components/dashboard/roles/JamaahDashboard";
import { MuthawifDashboard } from "@/components/dashboard/roles/MuthawifDashboard";

export default function DashboardPage() {
  // Peran dibaca dari sesi login (tabel profiles), bukan dari localStorage.
  const { role } = useRole();

  switch (role) {
    case "super_admin":
      return <SuperAdminDashboard isAdminCabang={false} />;
    case "admin_cabang":
      return <SuperAdminDashboard isAdminCabang={true} />;
    case "mitra_agen":
      return <MitraAgenDashboard />;
    case "jamaah_umroh":
      return <JamaahDashboard />;
    case "muthawif":
      return <MuthawifDashboard />;
    default:
      return <JamaahDashboard />;
  }
}
