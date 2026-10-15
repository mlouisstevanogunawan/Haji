"use client";

import * as React from "react";
import { useRole } from "@/context/RoleContext";
import { SuperAdminDashboard } from "@/components/dashboard/roles/SuperAdminDashboard";
import { MitraAgenDashboard } from "@/components/dashboard/roles/MitraAgenDashboard";
import { JamaahDashboard } from "@/components/dashboard/roles/JamaahDashboard";
import { MuthawifDashboard } from "@/components/dashboard/roles/MuthawifDashboard";
import { createClient } from "@/lib/supabase/client";

export default function DashboardPage() {
  const { role, setRole } = useRole();

  React.useEffect(() => {
    async function loadUser() {
      try {
        const supabase = createClient();
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (user) {
          // Fetch profile from public.profiles table
          const { data: profile } = await supabase
            .from("profiles")
            .select("full_name, email, role")
            .eq("id", user.id)
            .single();

          const userRole = profile?.role || "jamaah";

          // Sync context role with database profile
          if (userRole === "jamaah" || userRole === "jamaah_umroh") {
            setRole("jamaah_umroh");
          } else if (userRole === "mitra_agen") {
            setRole("mitra_agen");
          } else if (userRole === "admin_cabang") {
            setRole("admin_cabang");
          } else if (userRole === "super_admin") {
            setRole("super_admin");
          } else if (userRole === "muthawif") {
            setRole("muthawif");
          }
        }
      } catch (err) {
        console.error("Failed to sync authenticated user profile:", err);
      }
    }

    loadUser();
  }, [setRole]);

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
