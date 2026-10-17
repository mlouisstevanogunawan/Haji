import * as React from "react";
import { redirect } from "next/navigation";
import { DashboardShell } from "@/components/layout/DashboardShell";
import { RoleProvider } from "@/context/RoleContext";
import { getSessionUser } from "@/lib/auth/session";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // middleware sudah memfilter cookie sesi; cek di sini memvalidasi token ke
  // Supabase Auth, sehingga pengguna tanpa sesi asli tidak masuk dashboard.
  const user = await getSessionUser();
  if (!user) redirect("/login?redirect=%2Fdashboard");

  return (
    <RoleProvider user={user}>
      <DashboardShell>{children}</DashboardShell>
    </RoleProvider>
  );
}
