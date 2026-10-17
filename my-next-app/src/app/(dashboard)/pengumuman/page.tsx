"use client";

import * as React from "react";
import Link from "next/link";
import {
  Plus,
  Edit2,
  Trash2,
  X,
  CheckCircle2,
  Megaphone,
} from "lucide-react";
import {
  getAnnouncements,
  createAnnouncement,
  updateAnnouncement,
  deleteAnnouncement,
  AnnouncementRow,
} from "@/services/announcementService";
import { getBranches } from "@/services/branchService";

interface PengumumanItem {
  id: string;
  judul: string;
  audiens: "Jamaah" | "Agen" | "Semua";
  cabang: string;
  status: "Published" | "Draft";
  isLive: boolean;
  publish: string;
  konten?: string;
}

export default function PengumumanPage() {
  const [items, setItems] = React.useState<PengumumanItem[]>([]);
  const [, setIsLoading] = React.useState(true);
  const [toastMessage, setToastMessage] = React.useState<string | null>(null);

  // Modals
  const [isAddModalOpen, setIsAddModalOpen] = React.useState(false);
  const [editItem, setEditItem] = React.useState<PengumumanItem | null>(null);

  // Form states for Add
  const [formJudul, setFormJudul] = React.useState("");
  const [formAudiens, setFormAudiens] = React.useState<"Jamaah" | "Agen">("Jamaah");
  const [formKonten, setFormKonten] = React.useState("");

  const showToast = React.useCallback((msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  }, []);

  const loadData = React.useCallback(async () => {
    setIsLoading(true);
    try {
      const [records, branchRows] = await Promise.all([
        getAnnouncements(),
        getBranches().catch(() => []),
      ]);
      const branchNames: Record<string, string> = {};
      for (const b of branchRows) branchNames[b.id] = b.name;

      const mapped: PengumumanItem[] = (records || []).map((a: AnnouncementRow) => {
        let aud: PengumumanItem["audiens"] = "Jamaah";
        if (a.target_audience === "agents") aud = "Agen";
        else if (a.target_audience === "all") aud = "Semua";

        // Tanggal tayang diambil dari published_at (fallback created_at).
        const tanggalTayang = a.published_at || a.created_at;
        let pubDate = "-";
        if (tanggalTayang) {
          try {
            const dt = new Date(tanggalTayang);
            pubDate = `${dt.toLocaleDateString("id-ID", {
              day: "2-digit",
              month: "short",
              year: "numeric",
            })} ${dt.toLocaleTimeString("id-ID", {
              hour: "2-digit",
              minute: "2-digit",
            })}`;
          } catch {}
        }

        return {
          id: a.id,
          judul: a.title,
          audiens: aud,
          // Nama cabang dipetakan dari branch_id (kolom FK nyata).
          cabang: a.branch_id ? branchNames[a.branch_id] ?? "-" : "Semua Cabang",
          status: a.is_published ? "Published" : "Draft",
          isLive: a.is_published,
          publish: pubDate,
          konten: a.content,
        };
      });
      setItems(mapped);
    } catch (err: unknown) {
      console.error("Gagal memuat pengumuman:", err);
      setItems([]);
      showToast(`Gagal memuat pengumuman: ${(err as Error).message}`);
    } finally {
      setIsLoading(false);
    }
  }, [showToast]);

  React.useEffect(() => {
    loadData();
  }, [loadData]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formJudul.trim()) return;

    try {
      await createAnnouncement({
        title: formJudul,
        content: formKonten,
        target_audience: formAudiens === "Agen" ? "agents" : "jamaah",
        is_published: true,
        published_at: new Date().toISOString(),
      });
      setIsAddModalOpen(false);
      setFormJudul("");
      setFormKonten("");
      await loadData();
      showToast("Pengumuman berhasil disimpan ke Supabase!");
    } catch (err: unknown) {
      console.error("Gagal menambah pengumuman:", err);
      showToast(`Gagal menyimpan pengumuman: ${(err as Error).message}`);
    }
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editItem) return;

    const audienceMap: Record<PengumumanItem["audiens"], "jamaah" | "agents" | "all"> = {
      Jamaah: "jamaah",
      Agen: "agents",
      Semua: "all",
    };

    try {
      await updateAnnouncement(editItem.id, {
        title: editItem.judul,
        content: editItem.konten,
        target_audience: audienceMap[editItem.audiens],
      });
      setEditItem(null);
      await loadData();
      showToast("Perubahan pengumuman berhasil disimpan ke Supabase!");
    } catch (err: unknown) {
      console.error("Gagal memperbarui pengumuman:", err);
      showToast(`Gagal menyimpan perubahan: ${(err as Error).message}`);
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm("Hapus pengumuman ini?")) {
      try {
        await deleteAnnouncement(id);
        await loadData();
        showToast("Pengumuman berhasil dihapus dari Supabase.");
      } catch (err: unknown) {
        console.error("Gagal menghapus pengumuman:", err);
        showToast(`Gagal menghapus pengumuman: ${(err as Error).message}`);
      }
    }
  };

  return (
    <div className="p-6 md:p-8 space-y-6">
      {/* Header section */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          {/* Breadcrumb */}
          <nav className="flex items-center gap-2 text-sm text-gray-500 mb-1">
            <span>Beranda</span>
            <span>&gt;</span>
            <span className="text-gray-900 font-medium">Pengumuman</span>
          </nav>
          <h1 className="text-2xl font-bold text-gray-900">Pengumuman</h1>
          <p className="text-sm text-gray-500">Kelola pengumuman untuk pengguna</p>
        </div>

        {/* Primary Button */}
        <div>
          <Link
            href="/pengumuman/tambah"
            className="inline-flex items-center gap-2 bg-teal-600 hover:bg-teal-700 text-white font-medium text-sm px-4 py-2 rounded-lg transition shadow-sm cursor-pointer"
          >
            <Plus className="h-4 w-4" />
            <span>Tambah Pengumuman</span>
          </Link>
        </div>
      </div>

      {/* Tabel */}
      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  JUDUL
                </th>
                <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  AUDIENS
                </th>
                <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  CABANG
                </th>
                <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  STATUS
                </th>
                <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  PUBLISH
                </th>
                <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider text-right">
                  AKSI
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {items.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-sm text-gray-400">
                    Belum ada pengumuman tersimpan di Supabase.
                  </td>
                </tr>
              )}
              {items.map((item) => (
                <tr key={item.id} className="hover:bg-gray-50 transition border-b border-gray-100">
                  {/* Judul */}
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-800">
                    {item.judul}
                  </td>

                  {/* Audiens */}
                  <td className="px-6 py-4 whitespace-nowrap">
                    {item.audiens === "Jamaah" && (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-700">
                        Jamaah
                      </span>
                    )}
                    {item.audiens === "Agen" && (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-700">
                        Agen
                      </span>
                    )}
                    {item.audiens === "Semua" && (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-700">
                        Semua
                      </span>
                    )}
                  </td>

                  {/* Cabang */}
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-800">
                    {item.cabang}
                  </td>

                  {/* Status */}
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="inline-flex items-center">
                      {item.status === "Published" ? (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-700">
                          Published
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-600">
                          Draft
                        </span>
                      )}
                      {item.isLive && (
                        <span className="text-xs text-emerald-600 font-medium ml-1.5 flex items-center gap-1">
                          &bull; Live
                        </span>
                      )}
                    </div>
                  </td>

                  {/* Publish */}
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                    {item.publish}
                  </td>

                  {/* Aksi */}
                  <td className="px-6 py-4 whitespace-nowrap text-right">
                    <div className="inline-flex items-center gap-3">
                      <Link
                        href={`/pengumuman/edit/${item.id}`}
                        className="inline-flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800 font-medium transition cursor-pointer"
                      >
                        <Edit2 className="h-3.5 w-3.5" />
                        <span>Edit</span>
                      </Link>
                      <button
                        onClick={() => handleDelete(item.id)}
                        className="inline-flex items-center gap-1 text-xs text-red-600 hover:text-red-800 font-medium transition cursor-pointer"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                        <span>Hapus</span>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Tambah Pengumuman */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-lg overflow-hidden border border-gray-200">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <h3 className="text-lg font-bold text-gray-900">Tambah Pengumuman Baru</h3>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="text-gray-400 hover:text-gray-600 p-1 rounded-lg"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <form onSubmit={handleCreate} className="p-6 space-y-4 text-sm">
              <div>
                <label className="block font-medium text-gray-700 mb-1">
                  Judul Pengumuman <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Pelunasan Umroh Reguler"
                  value={formJudul}
                  onChange={(e) => setFormJudul(e.target.value)}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-teal-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-medium text-gray-700 mb-1">Target Audiens</label>
                  <select
                    value={formAudiens}
                    onChange={(e) => setFormAudiens(e.target.value as "Jamaah" | "Agen")}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-teal-500"
                  >
                    <option value="Jamaah">Jamaah</option>
                    <option value="Agen">Agen</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-medium text-gray-700 mb-1">Isi Pesan Pengumuman</label>
                <textarea
                  rows={4}
                  placeholder="Tuliskan isi pengumuman secara rinci..."
                  value={formKonten}
                  onChange={(e) => setFormKonten(e.target.value)}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-teal-500 resize-y"
                />
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-sm text-gray-700 hover:bg-gray-50 transition"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-lg text-sm font-medium transition"
                >
                  Publikasikan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Edit Pengumuman */}
      {editItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-lg overflow-hidden border border-gray-200">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <h3 className="text-lg font-bold text-gray-900">Edit Pengumuman</h3>
              <button
                onClick={() => setEditItem(null)}
                className="text-gray-400 hover:text-gray-600 p-1 rounded-lg"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <form onSubmit={handleSaveEdit} className="p-6 space-y-4 text-sm">
              <div>
                <label className="block font-medium text-gray-700 mb-1">Judul Pengumuman</label>
                <input
                  type="text"
                  required
                  value={editItem.judul}
                  onChange={(e) => setEditItem({ ...editItem, judul: e.target.value })}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-teal-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-medium text-gray-700 mb-1">Target Audiens</label>
                  <select
                    value={editItem.audiens}
                    onChange={(e) =>
                      setEditItem({
                        ...editItem,
                        audiens: e.target.value as PengumumanItem["audiens"],
                      })
                    }
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-teal-500"
                  >
                    <option value="Jamaah">Jamaah</option>
                    <option value="Agen">Agen</option>
                    <option value="Semua">Semua</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-medium text-gray-700 mb-1">Isi Pesan</label>
                <textarea
                  rows={4}
                  value={editItem.konten || ""}
                  onChange={(e) => setEditItem({ ...editItem, konten: e.target.value })}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-teal-500 resize-y"
                />
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setEditItem(null)}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-sm text-gray-700 hover:bg-gray-50 transition"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-lg text-sm font-medium transition"
                >
                  Simpan Perubahan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Toast Notifikasi */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-[70] max-w-sm rounded-lg bg-gray-900 px-4 py-3 text-sm text-white shadow-lg">
          {toastMessage}
        </div>
      )}
    </div>
  );
}
