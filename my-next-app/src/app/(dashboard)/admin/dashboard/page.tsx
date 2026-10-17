"use client";

import * as React from "react";
import { SuperAdminDashboard } from "@/components/dashboard/roles/SuperAdminDashboard";

export default function AdminCabangDashboardRoutePage() {


  return <SuperAdminDashboard isAdminCabang={true} />;
}
