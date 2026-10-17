"use client";

import * as React from "react";
import Link from "next/link";
import { Clock, Check, Wallet, XCircle, ChevronDown } from "lucide-react";
import { getCommissions, CommissionWithDetails } from "@/services/commissionService";

interface AgentCommissionItem {
  id: string;
  agen: string;
  jamaah: string;
  paket: string;
  dasar: number;
  rate: string;
  komisi: number;
  status: "Menunggu" | "Disetujui" | "Dibayar" | "Dibatalkan";
}

export default function AgenKomisiPage() {
  const [commissions, setCommissions] = React.useState<AgentCommissionItem[]>([]);
  const [statusFilter, setStatusFilter] = React.useState("Semua Status");
  const [appliedStatus, setAppliedStatus] = React.useState("Semua Status");
  const [toastMessage, setToastMessage] = React.useState<string | null>(null);


  const showToast = React.useCallback((msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  }, []);

  // Load from Supabase
  const loadData = React.useCallback(async () => {
    try {
      const data = await getCommissions();
      const mapped: AgentCommissionItem[] = (data || []).map((c: CommissionWithDetails) => {
        const rawStatus = (c.status || "").toLowerCase();
        let statusLabel: AgentCommissionItem["status"] = "Menunggu";
        if (rawStatus === "paid") statusLabel = "Dibayar";
        else if (rawStatus === "cancelled" || rawStatus === "rejected") statusLabel = "Dibatalkan";
        else if (rawStatus === "approved") statusLabel = "Disetujui";

        const dasar = Number(c.bookings?.total_price) || 0;
        // commission_rate disimpan sebagai pecahan (mis. 0.075 = 7,5%)
        const rateFraction = Number(c.agents?.commission_rate) || 0;
        const komisiVal = Number(c.amount) || Math.round(dasar * rateFraction);

        return {
          id: c.id,
          agen: c.agents?.name || "-",
          jamaah: c.bookings?.profiles?.full_name || "-",
          paket: c.bookings?.packages?.name || "-",
          dasar,
          rate: `${(rateFraction * 100).toFixed(2)}%`,
          komisi: komisiVal,
          status: statusLabel,
        };
      });
      setCommissions(mapped);
    } catch (err: unknown) {
      console.error("Gagal memuat data komisi:", err);
      setCommissions([]);
      showToast(`Gagal memuat data komisi: ${(err as Error).message}`);
    }
  }, [showToast]);

  React.useEffect(() => {
    loadData();
  }, [loadData]);

  const handleFilterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setAppliedStatus(statusFilter);
  };

  const filteredCommissions = commissions.filter((c) => {
    if (appliedStatus === "Semua Status") return true;
    return c.status.toLowerCase() === appliedStatus.toLowerCase();
  });

  // Calculate totals
  const waitingTotal = commissions
    .filter((c) => c.status === "Menunggu")
    .reduce((sum, c) => sum + c.komisi, 0);
  const waitingCount = commissions.filter((c) => c.status === "Menunggu").length;

  const approvedTotal = commissions
    .filter((c) => c.status === "Disetujui")
    .reduce((sum, c) => sum + c.komisi, 0);
  const approvedCount = commissions.filter((c) => c.status === "Disetujui").length;

  const paidTotal = commissions
    .filter((c) => c.status === "Dibayar")
    .reduce((sum, c) => sum + c.komisi, 0);
  const paidCount = commissions.filter((c) => c.status === "Dibayar").length;

  const cancelledTotal = commissions
    .filter((c) => c.status === "Dibatalkan")
    .reduce((sum, c) => sum + c.komisi, 0);
  const cancelledCount = commissions.filter((c) => c.status === "Dibatalkan").length;

  return (
    <div className="p-6 md:p-8 space-y-6">
      {/* Header section with Breadcrumb */}
      <div>
        <nav className="flex items-center gap-2 text-xs text-gray-400 mb-1">
          <Link href="/agen/dashboard" className="hover:text-gray-600 transition">
            Beranda
          </Link>
          <span>&gt;</span>
          <span className="text-gray-500 font-medium">Komisi Agen</span>
        </nav>
        <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Komisi Agen</h1>
        <p className="text-sm text-gray-500 mt-0.5">Rekap &amp; pembayaran komisi agen</p>
      </div>

      {/* 4 Stat Cards Matching Screenshot 3 */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Menunggu */}
        <div className="bg-white border border-gray-200/90 rounded-lg p-5 shadow-2xs flex items-center gap-4">
          <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-amber-50 text-amber-600 flex-shrink-0">
            <Clock className="h-5 w-5" />
          </div>
          <div>
            <p className="text-[11px] text-gray-500 font-medium">Menunggu</p>
            <p className="text-lg font-bold text-gray-900 mt-0.5">
              Rp {waitingTotal.toLocaleString("id-ID")}
            </p>
            <p className="text-[11px] text-gray-400">{waitingCount} komisi</p>
          </div>
        </div>

        {/* Card 2: Disetujui */}
        <div className="bg-white border border-gray-200/90 rounded-lg p-5 shadow-2xs flex items-center gap-4">
          <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-blue-50 text-blue-600 flex-shrink-0">
            <Check className="h-5 w-5" />
          </div>
          <div>
            <p className="text-[11px] text-gray-500 font-medium">Disetujui</p>
            <p className="text-lg font-bold text-gray-900 mt-0.5">
              Rp {approvedTotal.toLocaleString("id-ID")}
            </p>
            <p className="text-[11px] text-gray-400">{approvedCount} komisi</p>
          </div>
        </div>

        {/* Card 3: Dibayar */}
        <div className="bg-white border border-gray-200/90 rounded-lg p-5 shadow-2xs flex items-center gap-4">
          <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600 flex-shrink-0">
            <Wallet className="h-5 w-5" />
          </div>
          <div>
            <p className="text-[11px] text-gray-500 font-medium">Dibayar</p>
            <p className="text-lg font-bold text-gray-900 mt-0.5">
              Rp {paidTotal.toLocaleString("id-ID")}
            </p>
            <p className="text-[11px] text-gray-400">{paidCount} komisi</p>
          </div>
        </div>

        {/* Card 4: Dibatalkan */}
        <div className="bg-white border border-gray-200/90 rounded-lg p-5 shadow-2xs flex items-center gap-4">
          <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-rose-50 text-rose-600 flex-shrink-0">
            <XCircle className="h-5 w-5" />
          </div>
          <div>
            <p className="text-[11px] text-gray-500 font-medium">Dibatalkan</p>
            <p className="text-lg font-bold text-gray-900 mt-0.5">
              Rp {cancelledTotal.toLocaleString("id-ID")}
            </p>
            <p className="text-[11px] text-gray-400">{cancelledCount} komisi</p>
          </div>
        </div>
      </div>

      {/* Filter Row */}
      <form onSubmit={handleFilterSubmit} className="flex flex-wrap items-center gap-3">
        <div className="relative min-w-[160px]">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full appearance-none bg-white border border-gray-200 rounded-lg px-4 py-2 pr-9 text-sm text-gray-700 focus:outline-none focus:ring-1 focus:ring-teal-500 shadow-2xs cursor-pointer"
          >
            <option value="Semua Status">Semua Status</option>
            <option value="Disetujui">Disetujui</option>
            <option value="Menunggu">Menunggu</option>
            <option value="Dibayar">Dibayar</option>
            <option value="Dibatalkan">Dibatalkan</option>
          </select>
          <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
        </div>

        <button
          type="submit"
          className="bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 px-4 py-2 rounded-lg text-sm font-medium transition shadow-2xs cursor-pointer"
        >
          Filter
        </button>
      </form>

      {/* Tabel Komisi (View-Only buat Agen, tanpa Kolom Aksi) */}
      <div className="bg-white border border-gray-200/90 rounded-lg overflow-hidden shadow-2xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200/80">
                <th className="px-6 py-3 text-[11px] font-bold text-gray-500 uppercase tracking-wider">
                  AGEN
                </th>
                <th className="px-6 py-3 text-[11px] font-bold text-gray-500 uppercase tracking-wider">
                  JAMAAH
                </th>
                <th className="px-6 py-3 text-[11px] font-bold text-gray-500 uppercase tracking-wider">
                  PAKET
                </th>
                <th className="px-6 py-3 text-[11px] font-bold text-gray-500 uppercase tracking-wider">
                  DASAR
                </th>
                <th className="px-6 py-3 text-[11px] font-bold text-gray-500 uppercase tracking-wider">
                  RATE
                </th>
                <th className="px-6 py-3 text-[11px] font-bold text-gray-500 uppercase tracking-wider">
                  KOMISI
                </th>
                <th className="px-6 py-3 text-[11px] font-bold text-gray-500 uppercase tracking-wider">
                  STATUS
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 bg-white">
              {filteredCommissions.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-8 text-center text-sm text-gray-400">
                    Tidak ada data komisi agen ditemukan.
                  </td>
                </tr>
              ) : (
                filteredCommissions.map((item) => (
                  <tr
                    key={item.id}
                    className="hover:bg-gray-50/70 transition-colors border-b border-gray-100"
                  >
                    {/* Agen */}
                    <td className="px-6 py-3.5 whitespace-nowrap text-xs text-gray-800 font-medium">
                      {item.agen}
                    </td>

                    {/* Jamaah */}
                    <td className="px-6 py-3.5 whitespace-nowrap text-xs text-gray-800 font-normal">
                      {item.jamaah}
                    </td>

                    {/* Paket */}
                    <td className="px-6 py-3.5 whitespace-nowrap text-xs text-gray-800 font-normal">
                      {item.paket}
                    </td>

                    {/* Dasar */}
                    <td className="px-6 py-3.5 whitespace-nowrap text-xs text-gray-800 font-normal">
                      Rp {item.dasar.toLocaleString("id-ID")}
                    </td>

                    {/* Rate */}
                    <td className="px-6 py-3.5 whitespace-nowrap text-xs text-gray-800 font-normal">
                      {item.rate}
                    </td>

                    {/* Komisi */}
                    <td className="px-6 py-3.5 whitespace-nowrap text-xs text-gray-800 font-normal">
                      Rp {item.komisi.toLocaleString("id-ID")}
                    </td>

                    {/* Status Badge */}
                    <td className="px-6 py-3.5 whitespace-nowrap">
                      {item.status === "Disetujui" && (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-blue-50 text-blue-700">
                          Disetujui
                        </span>
                      )}
                      {item.status === "Menunggu" && (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-amber-50 text-amber-700">
                          Menunggu
                        </span>
                      )}
                      {item.status === "Dibayar" && (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-emerald-50 text-emerald-700">
                          Dibayar
                        </span>
                      )}
                      {item.status === "Dibatalkan" && (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-rose-50 text-rose-700">
                          Dibatalkan
                        </span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Toast Notifikasi */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-[70] max-w-sm rounded-lg bg-gray-900 px-4 py-3 text-sm text-white shadow-lg">
          {toastMessage}
        </div>
      )}
    </div>
  );
}
