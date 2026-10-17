"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Box } from "lucide-react";

import { getJamaahList } from "@/services/jamaahService";
import { createEquipmentAssignment } from "@/services/equipmentService";

export interface PilgrimOption {
  id: string;
  label: string;
  name: string;
  regCode: string;
  packageName: string;
}

const equipmentItemOptions = [
  "Koper Utama 24\" (Fiber TSA Lock)",
  "Koper Kabin 20\" (Fiber TSA Lock)",
  "Tas Paspor & Dokumen Selempang",
  "Kain Ihram & Sabuk Pengaman (Pria)",
  "Mukena & Bergo Khusus (Wanita)",
  "Bahan Kain Seragam Batik Resmi",
  "Buku Doa, Tasbih & ID Card Haji/Umroh",
  "Jaket / Rompi Resmi Jamaah",
];

export default function CatatPerlengkapanBaruPage() {
  const router = useRouter();

  const [pilgrims, setPilgrims] = React.useState<PilgrimOption[]>([]);
  const [selectedPilgrimId, setSelectedPilgrimId] = React.useState<string>("");
  const [selectedItem, setSelectedItem] = React.useState(equipmentItemOptions[0]);
  const [qty, setQty] = React.useState<number>(1);
  const [status, setStatus] = React.useState<string>("Belum Diserahkan (Pending)");
  const [isSubmitting, setIsSubmitting] = React.useState<boolean>(false);
  const [notice, setNotice] = React.useState<{ kind: "error" | "success"; text: string } | null>(null);

  const showToast = (kind: "error" | "success", text: string) => {
    setNotice({ kind, text });
    setTimeout(() => setNotice(null), 4500);
  };

  React.useEffect(() => {
    async function loadPilgrims() {
      try {
        const list = await getJamaahList();
        const options: PilgrimOption[] = list.map((j) => ({
          id: j.id,
          label: `${j.name} (${j.code || "REG-" + j.id.slice(0, 6)})`,
          name: j.name,
          regCode: j.code || `REG-${j.id.slice(0, 6).toUpperCase()}`,
          packageName: "Paket Umroh Reguler",
        }));
        setPilgrims(options);
        if (options.length > 0) {
          setSelectedPilgrimId(options[0].id);
        }
      } catch (err) {
        console.error("Gagal memuat daftar jamaah:", err);
      }
    }
    loadPilgrims();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const pilgrim = pilgrims.find((p) => p.id === selectedPilgrimId);
    if (!pilgrim) {
      showToast("error", "Jamaah penerima wajib dipilih.");
      return;
    }
    const itemName = selectedItem.trim();
    if (!itemName) {
      showToast("error", "Item perlengkapan wajib diisi.");
      return;
    }

    setIsSubmitting(true);
    const isDelivered = status === "Sudah Diserahkan";

    try {
      await createEquipmentAssignment({
        pilgrim_id: pilgrim.id,
        pilgrim_name: pilgrim.name,
        item_name: itemName,
        quantity: qty,
        condition: "good",
        size: null,
        is_delivered: isDelivered,
        delivered_at: null,
        notes: null,
      });

      showToast("success", "Penyerahan perlengkapan berhasil disimpan ke Supabase.");
      setTimeout(() => router.push("/perlengkapan"), 700);
    } catch (err: unknown) {
      console.error("Gagal menyimpan perlengkapan ke Supabase:", err);
      showToast("error", `Gagal menyimpan penyerahan: ${(err as Error).message}`);
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 pb-12 animate-fade-in max-w-4xl">
      {/* Header Form matching Screenshot 1 */}
      <div className="flex items-center gap-3">
        <Link
          href="/perlengkapan"
          className="flex h-9 w-9 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 transition shadow-xs"
          title="Kembali ke Daftar Perlengkapan"
        >
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700">
            <Box className="h-5 w-5 stroke-[2.2]" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900">
              Catat Perlengkapan Baru
            </h1>
            <p className="text-xs text-slate-400 mt-0.5">
              Pilih jamaah terdaftar dan catat status penyerahan barang logistik perjalanan.
            </p>
          </div>
        </div>
      </div>

      {/* Main Form Card matching Screenshot 1 */}
      <div className="max-w-2xl rounded-2xl border border-slate-200/80 bg-white p-6 sm:p-7 shadow-xs">
        <form onSubmit={handleSubmit} className="space-y-5 text-xs">
          {notice && (
            <div
              role="status"
              className={`rounded-xl border px-3.5 py-2.5 text-xs ${
                notice.kind === "error"
                  ? "border-red-200 bg-red-50 text-red-700"
                  : "border-emerald-200 bg-emerald-50 text-emerald-700"
              }`}
            >
              {notice.text}
            </div>
          )}
          {/* JAMAAH PENERIMA * */}
          <div>
            <label className="block text-[11px] font-bold text-slate-700 mb-1.5 uppercase tracking-wide">
              JAMAAH PENERIMA <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <select
                value={selectedPilgrimId}
                onChange={(e) => setSelectedPilgrimId(e.target.value)}
                required
                className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500 transition shadow-xs font-medium"
              >
                {pilgrims.length === 0 ? (
                  <option value="">Memuat data jamaah...</option>
                ) : (
                  pilgrims.map((pilgrim) => (
                    <option key={pilgrim.id} value={pilgrim.id}>
                      {pilgrim.label}
                    </option>
                  ))
                )}
              </select>
            </div>
          </div>

          {/* ITEM PERLENGKAPAN * */}
          <div>
            <label className="block text-[11px] font-bold text-slate-700 mb-1.5 uppercase tracking-wide">
              ITEM PERLENGKAPAN <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <input
                type="text"
                list="equipment-options"
                value={selectedItem}
                onChange={(e) => setSelectedItem(e.target.value)}
                required
                placeholder="Pilih atau ketik item perlengkapan..."
                className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500 transition shadow-xs font-medium"
              />
              <datalist id="equipment-options">
                {equipmentItemOptions.map((item, idx) => (
                  <option key={idx} value={item} />
                ))}
              </datalist>
            </div>
          </div>

          {/* Grid 2 Kolom: JUMLAH (QTY) & STATUS PENYERAHAN */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* JUMLAH (QTY) * */}
            <div>
              <label className="block text-[11px] font-bold text-slate-700 mb-1.5 uppercase tracking-wide">
                JUMLAH (QTY) <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                min="1"
                required
                value={qty}
                onChange={(e) => setQty(Math.max(1, parseInt(e.target.value) || 1))}
                className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500 transition shadow-xs font-medium"
              />
            </div>

            {/* STATUS PENYERAHAN * */}
            <div>
              <label className="block text-[11px] font-bold text-slate-700 mb-1.5 uppercase tracking-wide">
                STATUS PENYERAHAN <span className="text-red-500">*</span>
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                required
                className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500 transition shadow-xs font-medium"
              >
                <option value="Belum Diserahkan (Pending)">Belum Diserahkan (Pending)</option>
                <option value="Sudah Diserahkan">Sudah Diserahkan</option>
              </select>
            </div>
          </div>

          {/* Action Buttons matching Screenshot 1 */}
          <div className="pt-2 flex items-center gap-3">
            <button
              type="submit"
              disabled={isSubmitting}
              className="inline-flex items-center justify-center rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white px-5 py-2.5 text-xs font-semibold shadow-xs transition active:scale-95 cursor-pointer disabled:opacity-50"
            >
              {isSubmitting ? "Menyimpan..." : "Catat Penyerahan"}
            </button>
            <Link
              href="/perlengkapan"
              className="inline-flex items-center justify-center rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 px-5 py-2.5 text-xs font-medium transition cursor-pointer"
            >
              Batal
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}
