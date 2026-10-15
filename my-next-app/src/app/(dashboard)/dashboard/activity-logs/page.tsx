"use client";

import * as React from "react";
import { Search, Filter, RefreshCw } from "lucide-react";
import { ActivityLogsTable } from "@/components/activity-logs/ActivityLogsTable";
import { ActivityLog } from "@/types/database";

export default function ActivityLogsPage() {
  const [logs, setLogs] = React.useState<ActivityLog[]>([]);
  const [isLoading, setIsLoading] = React.useState<boolean>(true);
  const [searchQuery, setSearchQuery] = React.useState<string>("");
  const [selectedAction, setSelectedAction] = React.useState<string>("all");
  const [selectedUser, setSelectedUser] = React.useState<string>("all");
  const [uniqueUsers, setUniqueUsers] = React.useState<string[]>([]);

  const fetchLogs = React.useCallback(async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      if (searchQuery.trim()) params.append("search", searchQuery.trim());
      if (selectedAction && selectedAction !== "all") params.append("action", selectedAction);
      if (selectedUser && selectedUser !== "all") params.append("user", selectedUser);

      const res = await fetch(`/api/activity-logs?${params.toString()}`);
      const json = await res.json();
      if (json.success && Array.isArray(json.data)) {
        setLogs(json.data);

        // Extract unique user names for filter dropdown
        const userSet = new Set<string>();
        json.data.forEach((item: ActivityLog) => {
          if (item.user_name) userSet.add(item.user_name);
        });
        setUniqueUsers(Array.from(userSet));
      }
    } catch (err) {
      console.error("Failed to load activity logs:", err);
    } finally {
      setIsLoading(false);
    }
  }, [searchQuery, selectedAction, selectedUser]);

  React.useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  return (
    <div className="space-y-6 pb-12">
      {/* Header Section (Screenshot 3) */}
      <div className="space-y-1">
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">
          Log Aktivitas
        </h1>
        <p className="text-xs text-slate-500">
          Audit trail riwayat aktivitas dan operasi pengguna dalam sistem
        </p>
      </div>

      {/* Filter Bar (Screenshot 3) */}
      <div className="rounded-xl border border-slate-200/90 bg-white p-3 shadow-sm">
        <div className="flex flex-col gap-3 md:flex-row md:items-center">
          {/* Search Box */}
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari deskripsi, aksi, IP..."
              className="h-10 w-full rounded-lg border border-slate-200 bg-white pl-9 pr-3 text-xs text-slate-900 placeholder:text-slate-400 shadow-sm transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600 focus-visible:border-transparent"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            {/* Filter Icon Indicator */}
            <div className="hidden sm:flex h-10 w-10 items-center justify-center rounded-lg border border-slate-200 text-slate-400">
              <Filter className="h-4 w-4" />
            </div>

            {/* Action Filter Dropdown */}
            <div className="relative min-w-[170px]">
              <select
                value={selectedAction}
                onChange={(e) => setSelectedAction(e.target.value)}
                className="h-10 w-full appearance-none rounded-lg border border-slate-200 bg-white px-3 pr-8 text-xs font-medium text-slate-700 shadow-sm transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600 focus-visible:border-transparent cursor-pointer"
              >
                <option value="all">Semua Aksi</option>
                <option value="complete_profile">complete_profile</option>
                <option value="payment_completed_snap">payment_completed_snap</option>
                <option value="create_user">create_user</option>
                <option value="update_user">update_user</option>
                <option value="delete_user">delete_user</option>
                <option value="reset_password">reset_password</option>
                <option value="seed_fresh_data">seed_fresh_data</option>
                <option value="login">login</option>
                <option value="logout">logout</option>
              </select>
              <div className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-400">
                <svg className="h-4 w-4 fill-current" viewBox="0 0 20 20">
                  <path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" />
                </svg>
              </div>
            </div>

            {/* User Filter Dropdown */}
            <div className="relative min-w-[170px]">
              <select
                value={selectedUser}
                onChange={(e) => setSelectedUser(e.target.value)}
                className="h-10 w-full appearance-none rounded-lg border border-slate-200 bg-white px-3 pr-8 text-xs font-medium text-slate-700 shadow-sm transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600 focus-visible:border-transparent cursor-pointer"
              >
                <option value="all">Semua Pengguna</option>
                <option value="Sistem">Sistem</option>
                {uniqueUsers
                  .filter((u) => u.toLowerCase() !== "sistem")
                  .map((userName) => (
                    <option key={userName} value={userName}>
                      {userName}
                    </option>
                  ))}
              </select>
              <div className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-400">
                <svg className="h-4 w-4 fill-current" viewBox="0 0 20 20">
                  <path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" />
                </svg>
              </div>
            </div>

            {/* Refresh Button */}
            <button
              onClick={() => fetchLogs()}
              title="Muat Ulang Data"
              className="flex h-10 w-10 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-500 hover:bg-slate-50 hover:text-slate-700 shadow-sm transition"
            >
              <RefreshCw className={`h-4 w-4 ${isLoading ? "animate-spin text-emerald-600" : ""}`} />
            </button>
          </div>
        </div>
      </div>

      {/* Activity Logs Table */}
      <ActivityLogsTable logs={logs} isLoading={isLoading} />
    </div>
  );
}
