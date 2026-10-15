"use client";

import * as React from "react";
import {
  Clock,
  CheckCircle2,
  DollarSign,
  XCircle,
  Search,
  Filter,
  ChevronDown,
} from "lucide-react";
import {
  getCommissions,
  updateCommission,
  CommissionWithDetails,
  CommissionStatus,
} from "@/services/commissionService";

export default function KomisiSayaPage() {
  const [commissions, setCommissions] = React.useState<CommissionWithDetails[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [searchTerm, setSearchTerm] = React.useState("");
  const [statusFilter, setStatusFilter] = React.useState("Semua Status");
  const [agentFilter, setAgentFilter] = React.useState("Semua Agen");

  const [activeStatusModal, setActiveStatusModal] = React.useState<boolean>(false);
  const [selectedCommission, setSelectedCommission] = React.useState<CommissionWithDetails | null>(null);

  const loadCommissions = React.useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await getCommissions();
      setCommissions(data);
    } catch (err: unknown) {
      console.error("Gagal memuat data komisi dari Supabase:", err);
      setCommissions([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  React.useEffect(() => {
    loadCommissions();
  }, [loadCommissions]);

  // Dynamic KPI calculations
  const pendingCommissions = commissions.filter((c) => c.status === "pending");
  const paidCommissions = commissions.filter((c) => c.status === "paid");
  const cancelledCommissions = commissions.filter((c) => c.status === "cancelled");

  const pendingTotal = pendingCommissions.reduce((acc, c) => acc + (Number(c.amount) || 0), 0);
  const paidTotal = paidCommissions.reduce((acc, c) => acc + (Number(c.amount) || 0), 0);
  const cancelledTotal = cancelledCommissions.reduce((acc, c) => acc + (Number(c.amount) || 0), 0);

  // Filtered commissions
  const filteredCommissions = commissions.filter((c) => {
    const q = searchTerm.toLowerCase().trim();
    const agentName = c.agents?.name?.toLowerCase() || "";
    const pilgrimName = c.bookings?.profiles?.full_name?.toLowerCase() || "";
    const packageName = c.bookings?.packages?.name?.toLowerCase() || "";

    const matchesSearch =
      !q ||
      agentName.includes(q) ||
      pilgrimName.includes(q) ||
      packageName.includes(q);

    if (!matchesSearch) return false;

    if (statusFilter !== "Semua Status") {
      if (statusFilter === "Menunggu" && c.status !== "pending") return false;
      if (statusFilter === "Sudah Dibayar" && c.status !== "paid") return false;
      if (statusFilter === "Dibatalkan" && c.status !== "cancelled") return false;
    }

    if (agentFilter !== "Semua Agen") {
      if (c.agents?.name !== agentFilter) return false;
    }

    return true;
  });

  // Unique agents for filter dropdown
  const uniqueAgents = Array.from(
    new Set(commissions.map((c) => c.agents?.name).filter(Boolean))
  ) as string[];

  const handleUpdateStatus = async (status: CommissionStatus) => {
    if (!selectedCommission) return;
    try {
      await updateCommission(selectedCommission.id, { status });
      await loadCommissions();
      setActiveStatusModal(false);
      setSelectedCommission(null);
    } catch (err) {
      console.error("Gagal memperbarui status komisi:", err);
    }
  };

  const getStatusBadge = (status: string) => {
    if (status === "pending") {
      return (
        <span className="inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-semibold border bg-amber-50 text-amber-700 border-amber-200/60">
          <Clock className="h-3 w-3" />
          Menunggu
        </span>
      );
    }
    if (status === "paid") {
      return (
        <span className="inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-semibold border bg-emerald-50 text-emerald-700 border-emerald-200/60">
          <DollarSign className="h-3 w-3" />
          Sudah Dibayar
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-semibold border bg-red-50 text-red-700 border-red-200/60">
        <XCircle className="h-3 w-3" />
        Dibatalkan
      </span>
    );
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header section */}
      <div>
        <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900">
          Komisi Agen
        </h1>
        <p className="text-xs text-slate-400 mt-1">
          Rekapitulasi &amp; pelacakan status pembayaran komisi agen mitra travel
        </p>
      </div>

      {/* 4 Metric KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Menunggu Persetujuan */}
        <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm transition hover:shadow-md">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold tracking-wider text-slate-400 uppercase">
              MENUNGGU PERSETUJUAN
            </span>
            <div className="h-8 w-8 rounded-full bg-amber-50 text-amber-600 flex items-center justify-center">
              <Clock className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-xl font-extrabold text-slate-900">
              Rp {pendingTotal.toLocaleString("id-ID")}
            </span>
          </div>
          <div className="mt-2">
            <span className="inline-flex items-center rounded-full bg-amber-50 px-2 py-0.5 text-[10px] font-semibold text-amber-700 border border-amber-200/60">
              {pendingCommissions.length} Komisi
            </span>
          </div>
        </div>

        {/* Card 2: Disetujui */}
        <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm transition hover:shadow-md">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold tracking-wider text-slate-400 uppercase">
              DISETUJUI
            </span>
            <div className="h-8 w-8 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center">
              <CheckCircle2 className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-xl font-extrabold text-slate-900">
              Rp {pendingTotal.toLocaleString("id-ID")}
            </span>
          </div>
          <div className="mt-2">
            <span className="inline-flex items-center rounded-full bg-blue-50 px-2 py-0.5 text-[10px] font-semibold text-blue-700 border border-blue-200/60">
              {pendingCommissions.length} Komisi
            </span>
          </div>
        </div>

        {/* Card 3: Sudah Dibayarkan */}
        <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm transition hover:shadow-md">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold tracking-wider text-slate-400 uppercase">
              SUDAH DIBAYARKAN
            </span>
            <div className="h-8 w-8 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <DollarSign className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-xl font-extrabold text-slate-900">
              Rp {paidTotal.toLocaleString("id-ID")}
            </span>
          </div>
          <div className="mt-2">
            <span className="inline-flex items-center rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-semibold text-emerald-700 border border-emerald-200/60">
              {paidCommissions.length} Komisi
            </span>
          </div>
        </div>

        {/* Card 4: Dibatalkan */}
        <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm transition hover:shadow-md">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold tracking-wider text-slate-400 uppercase">
              DIBATALKAN
            </span>
            <div className="h-8 w-8 rounded-full bg-red-50 text-red-600 flex items-center justify-center">
              <XCircle className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-xl font-extrabold text-slate-900">
              Rp {cancelledTotal.toLocaleString("id-ID")}
            </span>
          </div>
          <div className="mt-2">
            <span className="inline-flex items-center rounded-full bg-red-50 px-2 py-0.5 text-[10px] font-semibold text-red-700 border border-red-200/60">
              {cancelledCommissions.length} Komisi
            </span>
          </div>
        </div>
      </div>

      {/* Filter / Search Bar */}
      <div className="rounded-xl border border-slate-200/90 bg-white p-2.5 shadow-sm flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Cari agen, jamaah, paket..."
            className="w-full pl-9 pr-4 py-1.5 text-xs text-slate-700 placeholder-slate-400 bg-transparent focus:outline-none"
          />
        </div>

        <div className="flex items-center gap-2">
          <Filter className="h-3.5 w-3.5 text-slate-400 hidden sm:block" />

          {/* Status Dropdown */}
          <div className="relative">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="appearance-none rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs text-slate-700 pr-8 focus:outline-none"
            >
              <option>Semua Status</option>
              <option>Menunggu</option>
              <option>Sudah Dibayar</option>
              <option>Dibatalkan</option>
            </select>
            <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400 pointer-events-none" />
          </div>

          {/* Agen Dropdown */}
          <div className="relative">
            <select
              value={agentFilter}
              onChange={(e) => setAgentFilter(e.target.value)}
              className="appearance-none rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs text-slate-700 pr-8 focus:outline-none"
            >
              <option>Semua Agen</option>
              {uniqueAgents.map((ag) => (
                <option key={ag} value={ag}>
                  {ag}
                </option>
              ))}
            </select>
            <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400 pointer-events-none" />
          </div>
        </div>
      </div>

      {/* Table Data */}
      <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-100 text-slate-400 font-semibold tracking-wider uppercase text-[10px]">
                <th className="pb-3.5 font-bold">AGEN MITRA</th>
                <th className="pb-3.5 font-bold">JAMAAH</th>
                <th className="pb-3.5 font-bold">PAKET</th>
                <th className="pb-3.5 font-bold">DASAR NOMINAL</th>
                <th className="pb-3.5 font-bold">RATE</th>
                <th className="pb-3.5 font-bold">NOMINAL KOMISI</th>
                <th className="pb-3.5 font-bold">STATUS</th>
                <th className="pb-3.5 font-bold text-center">AKSI</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {isLoading ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-slate-400">
                    Memuat data komisi dari Supabase...
                  </td>
                </tr>
              ) : filteredCommissions.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-slate-400">
                    Belum ada data komisi agen tercatat di database.
                  </td>
                </tr>
              ) : (
                filteredCommissions.map((com) => {
                  const agentName = com.agents?.name || "Agen";
                  const agentCode = `AGN-${com.agent_id.slice(0, 4).toUpperCase()}`;
                  const pilgrimName = com.bookings?.profiles?.full_name || "Jamaah";
                  const bookingCode = `REG-${com.booking_id.slice(0, 6).toUpperCase()}`;
                  const packageName = com.bookings?.packages?.name || "Paket Umroh";
                  const baseAmount = Number(com.bookings?.total_price || 0);
                  const rate = Number(com.agents?.commission_rate || 5);
                  const commissionAmount = Number(com.amount || 0);

                  return (
                    <tr key={com.id} className="hover:bg-slate-50/70 transition">
                      <td className="py-3.5 pr-4">
                        <p className="font-semibold text-slate-900">{agentName}</p>
                        <p className="font-mono text-[10px] text-slate-400 mt-0.5">{agentCode}</p>
                      </td>
                      <td className="py-3.5 pr-4">
                        <p className="font-semibold text-slate-900">{pilgrimName}</p>
                        <p className="font-mono text-[10px] text-slate-400 mt-0.5">
                          Reg: {bookingCode}
                        </p>
                      </td>
                      <td className="py-3.5 pr-4 text-slate-700 font-medium">
                        {packageName}
                      </td>
                      <td className="py-3.5 pr-4 font-mono text-slate-700">
                        Rp {baseAmount.toLocaleString("id-ID")}
                      </td>
                      <td className="py-3.5 pr-4 font-mono text-slate-700">
                        {rate.toFixed(2)}%
                      </td>
                      <td className="py-3.5 pr-4 font-bold text-emerald-700 font-mono">
                        Rp {commissionAmount.toLocaleString("id-ID")}
                      </td>
                      <td className="py-3.5 pr-4 whitespace-nowrap">
                        {getStatusBadge(com.status)}
                      </td>
                      <td className="py-3.5 text-center whitespace-nowrap">
                        <button
                          onClick={() => {
                            setSelectedCommission(com);
                            setActiveStatusModal(true);
                          }}
                          className="inline-flex items-center rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 px-3 py-1.5 text-xs font-medium transition shadow-sm cursor-pointer"
                        >
                          Ubah Status...
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Ubah Status Modal */}
      {activeStatusModal && selectedCommission && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 animate-in fade-in-50">
          <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-2xl border border-slate-100 space-y-4">
            <h3 className="font-bold text-slate-900 text-sm">
              Perbarui Status Komisi
            </h3>
            <p className="text-xs text-slate-500">
              Pilih status verifikasi untuk komisi {selectedCommission.agents?.name || "Agen"} (Rp {Number(selectedCommission.amount).toLocaleString("id-ID")})
            </p>

            <div className="space-y-2">
              {[
                { label: "Menunggu", value: "pending" as const },
                { label: "Sudah Dibayarkan", value: "paid" as const },
                { label: "Dibatalkan", value: "cancelled" as const },
              ].map((st) => (
                <button
                  key={st.value}
                  onClick={() => handleUpdateStatus(st.value)}
                  className={`w-full text-left px-3.5 py-2 rounded-lg text-xs font-medium border transition cursor-pointer ${
                    selectedCommission.status === st.value
                      ? "bg-emerald-50 border-emerald-500 text-emerald-900 font-bold"
                      : "border-slate-200 hover:bg-slate-50 text-slate-700"
                  }`}
                >
                  {st.label}
                </button>
              ))}
            </div>

            <div className="pt-2 flex justify-end">
              <button
                onClick={() => {
                  setActiveStatusModal(false);
                  setSelectedCommission(null);
                }}
                className="text-xs font-semibold text-slate-500 hover:text-slate-700 px-3 py-1.5 cursor-pointer"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
