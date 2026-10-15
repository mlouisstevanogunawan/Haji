"use client";

import * as React from "react";
import { format } from "date-fns";
import { id as localeId } from "date-fns/locale";
import { ActionBadge } from "./ActionBadge";
import { ActivityLog } from "@/types/database";

interface ActivityLogsTableProps {
  logs: ActivityLog[];
  isLoading?: boolean;
}

export const ActivityLogsTable: React.FC<ActivityLogsTableProps> = ({
  logs,
  isLoading,
}) => {
  // Format timestamp e.g. "2 Okt 2026, 15.37"
  const formatTimestamp = (dateStr?: string): string => {
    if (!dateStr) return "-";
    try {
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return dateStr;
      return format(d, "d MMM yyyy, HH.mm", { locale: localeId });
    } catch {
      return dateStr;
    }
  };

  return (
    <div className="w-full overflow-hidden rounded-xl border border-slate-200/90 bg-white shadow-sm">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm text-slate-600">
          {/* Table Header */}
          <thead className="border-b border-slate-200/90 bg-slate-50/75 text-[11px] font-bold uppercase tracking-wider text-slate-500">
            <tr>
              <th className="py-3.5 pl-5 pr-3 w-44">WAKTU</th>
              <th className="px-3 py-3.5 w-52">PENGGUNA</th>
              <th className="px-3 py-3.5 w-44 text-center sm:text-left">AKSI</th>
              <th className="px-3 py-3.5 min-w-[280px]">DESKRIPSI AKTIVITAS</th>
              <th className="py-3.5 pl-3 pr-5 w-28 text-right sm:text-center">ALAMAT IP</th>
            </tr>
          </thead>

          {/* Table Body */}
          <tbody className="divide-y divide-slate-100">
            {isLoading ? (
              <tr>
                <td colSpan={5} className="py-12 text-center text-slate-400">
                  <div className="flex items-center justify-center gap-2">
                    <div className="h-5 w-5 animate-spin rounded-full border-2 border-emerald-600 border-t-transparent" />
                    <span>Memuat log aktivitas...</span>
                  </div>
                </td>
              </tr>
            ) : logs.length === 0 ? (
              <tr>
                <td colSpan={5} className="py-12 text-center text-slate-400">
                  Tidak ada catatan aktivitas yang sesuai dengan filter atau kata kunci.
                </td>
              </tr>
            ) : (
              logs.map((log) => {
                const isSystem =
                  !log.user_id ||
                  log.user_name?.toLowerCase() === "sistem" ||
                  log.user_name?.toLowerCase() === "system";

                return (
                  <tr
                    key={log.id}
                    className="group transition-colors hover:bg-slate-50/70"
                  >
                    {/* WAKTU */}
                    <td className="py-3.5 pl-5 pr-3 text-xs text-slate-500 font-normal whitespace-nowrap">
                      {formatTimestamp(log.created_at)}
                    </td>

                    {/* PENGGUNA */}
                    <td className="px-3 py-3.5 text-xs">
                      <span
                        className={
                          isSystem
                            ? "font-semibold text-slate-500 italic"
                            : "font-semibold text-slate-800"
                        }
                      >
                        {log.user_name || (isSystem ? "Sistem" : "Pengguna")}
                      </span>
                    </td>

                    {/* AKSI */}
                    <td className="px-3 py-3.5">
                      <ActionBadge action={log.action} />
                    </td>

                    {/* DESKRIPSI AKTIVITAS */}
                    <td className="px-3 py-3.5 text-xs text-slate-700 leading-relaxed">
                      {log.description}
                    </td>

                    {/* ALAMAT IP */}
                    <td className="py-3.5 pl-3 pr-5 text-xs text-slate-400 font-mono text-right sm:text-center">
                      {log.ip_address || "-"}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
