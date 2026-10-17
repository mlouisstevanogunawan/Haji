"use client";

import * as React from "react";
import {
  Settings,
  Building2,
  CreditCard,
  Bell,
  Shield,
  Save,
  CheckCircle2,
  RefreshCw,
  Globe,
  Mail,
  Phone,
  FileCheck2,
  Lock,
  Smartphone,
  Sliders,
} from "lucide-react";

import {
  getSystemSettings,
  saveSystemSettings,
  SystemSettingsData,
} from "@/services/systemSettingsService";

// Nilai awal NETRAL/kosong. Bukan nilai "default" fiktif: sebelum data nyata
// terbaca dari tabel system_settings, setiap kolom ditampilkan kosong.
const EMPTY_SETTINGS: SystemSettingsData = {
  travelName: "",
  companyLegalName: "",
  ppiuNumber: "",
  pihkNumber: "",
  accreditation: "",
  establishedYear: "",
  supportPhone: "",
  supportEmail: "",
  websiteUrl: "",
  headOfficeAddress: "",
  defaultDpAmount: "",
  paymentDueDaysBeforeDeparture: "",
  enableMidtransGateway: false,
  adminFeeAmount: "",
  waGatewayApiKey: "",
  waGatewaySenderNumber: "",
  enableWaNewRegistration: false,
  enableWaPaymentReminder: false,
  enableWaManasikReminder: false,
  enableEmailReceipt: false,
  sessionTimeoutMinutes: "",
  enforceStrongPassword: false,
  enableAuditTrailLogging: false,
  subtitle: "",
  footerText: "",
  primaryColor: "",
  secondaryColor: "",
  logoUrl: "",
  faviconUrl: "",
};

export default function PengaturanSistemPage() {
  const [activeTab, setActiveTab] = React.useState<"profile" | "payment" | "notification" | "security">("profile");
  const [settings, setSettings] = React.useState<SystemSettingsData>(EMPTY_SETTINGS);
  const [isSaving, setIsSaving] = React.useState<boolean>(false);
  const [isLoading, setIsLoading] = React.useState<boolean>(true);
  const [loadError, setLoadError] = React.useState<string | null>(null);
  const [toastMessage, setToastMessage] = React.useState<string | null>(null);
  const [toastKind, setToastKind] = React.useState<"success" | "error">("success");

  const loadSettings = React.useCallback(async () => {
    setIsLoading(true);
    setLoadError(null);
    try {
      const data = await getSystemSettings();
      setSettings(data);
    } catch (err: unknown) {
      console.error("Gagal memuat pengaturan sistem:", err);
      setSettings(EMPTY_SETTINGS);
      setLoadError(`Gagal memuat pengaturan dari database: ${(err as Error).message}`);
    } finally {
      setIsLoading(false);
    }
  }, []);

  React.useEffect(() => {
    loadSettings();
  }, [loadSettings]);

  const showToast = (msg: string, kind: "success" | "error" = "success") => {
    setToastKind(kind);
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      await saveSystemSettings(settings);
      await loadSettings();
      showToast("Pengaturan sistem berhasil disimpan ke database Supabase!", "success");
    } catch (err: unknown) {
      console.error("Gagal menyimpan pengaturan ke Supabase:", err);
      showToast(`Gagal menyimpan pengaturan ke database: ${(err as Error).message}`, "error");
    } finally {
      setIsSaving(false);
    }
  };

  // Buang edit yang belum disimpan dan muat ulang nilai apa adanya dari DB,
  // bukan menimpa dengan "default" fiktif.
  const handleReload = async () => {
    setIsSaving(true);
    await loadSettings();
    setIsSaving(false);
    showToast("Halaman dimuat ulang dari database.", "success");
  };

  return (
    <div className="space-y-6 pb-16">
      {/* Toast Alert */}
      {toastMessage && (
        <div
          className={`fixed bottom-5 right-5 z-50 flex items-center gap-2.5 rounded-xl px-4 py-3 text-xs font-medium text-white shadow-xl animate-in fade-in slide-in-from-bottom-3 duration-200 ${
            toastKind === "error" ? "bg-red-600" : "bg-emerald-600"
          }`}
        >
          <CheckCircle2 className="h-4 w-4" />
          <span>{toastMessage}</span>
        </div>
      )}

      {isLoading && (
        <div className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-xs font-medium text-slate-500">
          Memuat pengaturan dari database…
        </div>
      )}

      {loadError && !isLoading && (
        <div className="flex items-center justify-between gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-xs text-red-700">
          <span>{loadError}</span>
          <button
            type="button"
            onClick={handleReload}
            className="inline-flex items-center gap-1.5 rounded-lg border border-red-200 bg-white px-3 py-1.5 font-semibold text-red-700 hover:bg-red-100 transition"
          >
            <RefreshCw className="h-3.5 w-3.5" />
            Coba lagi
          </button>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-100/80 shadow-sm">
            <Sliders className="h-6 w-6 stroke-[2.2]" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900">
              Pengaturan Sistem
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
              Konfigurasi legalitas travel, integrasi payment gateway &amp; WhatsApp, dan preferensi operasional
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleReload}
            className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-xs font-semibold text-slate-600 hover:bg-slate-50 transition"
          >
            <RefreshCw className="h-3.5 w-3.5" />
            <span>Muat Ulang</span>
          </button>
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-xs sm:text-sm font-semibold text-white shadow-sm hover:bg-emerald-700 transition active:scale-[0.98] disabled:opacity-60"
          >
            <Save className="h-4 w-4" />
            <span>{isSaving ? "Menyimpan..." : "Simpan Pengaturan"}</span>
          </button>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto border-b border-slate-200/80 pb-2">
        <button
          onClick={() => setActiveTab("profile")}
          className={`flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-semibold transition ${
            activeTab === "profile"
              ? "bg-emerald-50 text-emerald-800 border border-emerald-200 shadow-sm"
              : "text-slate-600 hover:bg-slate-50 hover:text-slate-900 border border-transparent"
          }`}
        >
          <Building2 className="h-4 w-4" />
          <span>Profil &amp; Legalitas Travel</span>
        </button>

        <button
          onClick={() => setActiveTab("payment")}
          className={`flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-semibold transition ${
            activeTab === "payment"
              ? "bg-emerald-50 text-emerald-800 border border-emerald-200 shadow-sm"
              : "text-slate-600 hover:bg-slate-50 hover:text-slate-900 border border-transparent"
          }`}
        >
          <CreditCard className="h-4 w-4" />
          <span>Kebijakan Pembayaran &amp; DP</span>
        </button>

        <button
          onClick={() => setActiveTab("notification")}
          className={`flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-semibold transition ${
            activeTab === "notification"
              ? "bg-emerald-50 text-emerald-800 border border-emerald-200 shadow-sm"
              : "text-slate-600 hover:bg-slate-50 hover:text-slate-900 border border-transparent"
          }`}
        >
          <Bell className="h-4 w-4" />
          <span>Notifikasi &amp; WhatsApp Gateway</span>
        </button>

        <button
          onClick={() => setActiveTab("security")}
          className={`flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-semibold transition ${
            activeTab === "security"
              ? "bg-emerald-50 text-emerald-800 border border-emerald-200 shadow-sm"
              : "text-slate-600 hover:bg-slate-50 hover:text-slate-900 border border-transparent"
          }`}
        >
          <Shield className="h-4 w-4" />
          <span>Keamanan &amp; Audit Trail</span>
        </button>
      </div>

      {/* Tab Contents */}
      <form onSubmit={handleSave}>
        {/* Tab 1: Profil & Legalitas */}
        {activeTab === "profile" && (
          <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm space-y-6">
            <div>
              <h3 className="text-sm font-bold text-slate-900">
                Identitas Resmi Biro Perjalanan Wisata
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Data ini ditampilkan pada kuitansi, manifest rombongan, kartu pengenal jamaah, dan dokumen resmi.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Nama Brand Travel
                </label>
                <input
                  type="text"
                  value={settings.travelName}
                  onChange={(e) => setSettings({ ...settings, travelName: e.target.value })}
                  className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Nama Badan Hukum Resmi (PT)
                </label>
                <input
                  type="text"
                  value={settings.companyLegalName}
                  onChange={(e) => setSettings({ ...settings, companyLegalName: e.target.value })}
                  className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Nomor Izin Kemenag PPIU (Umroh)
                </label>
                <input
                  type="text"
                  value={settings.ppiuNumber}
                  onChange={(e) => setSettings({ ...settings, ppiuNumber: e.target.value })}
                  className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Nomor Izin Kemenag PIHK (Haji Khusus)
                </label>
                <input
                  type="text"
                  value={settings.pihkNumber}
                  onChange={(e) => setSettings({ ...settings, pihkNumber: e.target.value })}
                  className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Akreditasi Kemenag / BSN
                </label>
                <input
                  type="text"
                  value={settings.accreditation}
                  onChange={(e) => setSettings({ ...settings, accreditation: e.target.value })}
                  className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Website Resmi Travel
                </label>
                <input
                  type="url"
                  value={settings.websiteUrl}
                  onChange={(e) => setSettings({ ...settings, websiteUrl: e.target.value })}
                  className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Telepon Hotline Kantor Pusat
                </label>
                <input
                  type="text"
                  value={settings.supportPhone}
                  onChange={(e) => setSettings({ ...settings, supportPhone: e.target.value })}
                  className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Email Customer Service
                </label>
                <input
                  type="email"
                  value={settings.supportEmail}
                  onChange={(e) => setSettings({ ...settings, supportEmail: e.target.value })}
                  className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition"
                />
              </div>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1 text-xs">
                Alamat Lengkap Kantor Pusat
              </label>
              <textarea
                rows={2}
                value={settings.headOfficeAddress}
                onChange={(e) => setSettings({ ...settings, headOfficeAddress: e.target.value })}
                className="w-full rounded-xl border border-slate-200 px-3.5 py-2 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition"
              />
            </div>
          </div>
        )}

        {/* Tab 2: Pembayaran & DP */}
        {activeTab === "payment" && (
          <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm space-y-6">
            <div>
              <h3 className="text-sm font-bold text-slate-900">
                Kebijakan Pembayaran &amp; Termin Cicilan
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Konfigurasi nominal standar DP dan jatuh tempo pelunasan biaya paket keberangkatan.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Nominal Standar Uang Muka / DP (Rp)
                </label>
                <input
                  type="number"
                  value={settings.defaultDpAmount}
                  onChange={(e) => setSettings({ ...settings, defaultDpAmount: e.target.value })}
                  className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition"
                />
                <span className="text-[11px] text-slate-400 mt-1 block">
                  Diterapkan otomatis saat formulir pendaftaran jamaah baru dibuat.
                </span>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Batas Akhir Pelunasan Sebelum Keberangkatan (Hari)
                </label>
                <input
                  type="number"
                  value={settings.paymentDueDaysBeforeDeparture}
                  onChange={(e) => setSettings({ ...settings, paymentDueDaysBeforeDeparture: e.target.value })}
                  className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition"
                />
                <span className="text-[11px] text-slate-400 mt-1 block">
                  Contoh: 30 hari (H-30 jadwal penerbangan).
                </span>
              </div>
            </div>

            <div className="border-t border-slate-100 pt-5 space-y-4">
              <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                Integrasi Gateway Pembayaran Otomatis
              </h4>

              <div className="flex items-center justify-between rounded-xl bg-slate-50/70 p-4 border border-slate-200/80">
                <div>
                  <span className="font-semibold text-xs text-slate-800 block">
                    Midtrans Payment Gateway (QRIS, VA Bank &amp; E-Wallet)
                  </span>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Memungkinkan jamaah membayar tagihan secara real-time melalui QRIS / Virtual Account bank.
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={settings.enableMidtransGateway}
                  onChange={(e) => setSettings({ ...settings, enableMidtransGateway: e.target.checked })}
                  className="h-5 w-5 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 accent-emerald-600"
                />
              </div>
            </div>
          </div>
        )}

        {/* Tab 3: Notifikasi & WhatsApp Gateway */}
        {activeTab === "notification" && (
          <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm space-y-6">
            <div>
              <h3 className="text-sm font-bold text-slate-900">
                Integrasi Notifikasi WhatsApp &amp; Email
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Kirim pesan otomatis via WhatsApp Gateway resmi untuk update pendaftaran, tagihan, dan jadwal manasik.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  API Token / Secret Key WhatsApp Gateway
                </label>
                <input
                  type="password"
                  value={settings.waGatewayApiKey}
                  onChange={(e) => setSettings({ ...settings, waGatewayApiKey: e.target.value })}
                  className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition font-mono"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Nomor WhatsApp Pengirim (Sender Number)
                </label>
                <input
                  type="text"
                  value={settings.waGatewaySenderNumber}
                  onChange={(e) => setSettings({ ...settings, waGatewaySenderNumber: e.target.value })}
                  className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition"
                />
              </div>
            </div>

            <div className="border-t border-slate-100 pt-5 space-y-3">
              <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                Pemicu Notifikasi Otomatis
              </h4>

              <div className="flex items-center justify-between rounded-xl bg-slate-50/70 p-3.5 border border-slate-200/80">
                <div>
                  <span className="font-semibold text-xs text-slate-800 block">
                    Kirim WA Sambutan &amp; Kode Booking Saat Jamaah Baru Mendaftar
                  </span>
                  <span className="text-[11px] text-slate-400">
                    Otomatis mengirim rincian paket dan rekening transfer resmi.
                  </span>
                </div>
                <input
                  type="checkbox"
                  checked={settings.enableWaNewRegistration}
                  onChange={(e) => setSettings({ ...settings, enableWaNewRegistration: e.target.checked })}
                  className="h-5 w-5 rounded border-slate-300 text-emerald-600 accent-emerald-600"
                />
              </div>

              <div className="flex items-center justify-between rounded-xl bg-slate-50/70 p-3.5 border border-slate-200/80">
                <div>
                  <span className="font-semibold text-xs text-slate-800 block">
                    Kirim Pengingat Jatuh Tempo Tagihan &amp; Pelunasan (H-7 &amp; H-3)
                  </span>
                  <span className="text-[11px] text-slate-400">
                    Mengirim pesan invoice beserta link pembayaran digital.
                  </span>
                </div>
                <input
                  type="checkbox"
                  checked={settings.enableWaPaymentReminder}
                  onChange={(e) => setSettings({ ...settings, enableWaPaymentReminder: e.target.checked })}
                  className="h-5 w-5 rounded border-slate-300 text-emerald-600 accent-emerald-600"
                />
              </div>

              <div className="flex items-center justify-between rounded-xl bg-slate-50/70 p-3.5 border border-slate-200/80">
                <div>
                  <span className="font-semibold text-xs text-slate-800 block">
                    Kirim Pengingat Jadwal Manasik &amp; Lokasi Pertemuan
                  </span>
                  <span className="text-[11px] text-slate-400">
                    Kirim reminder lokasi dan panduan busana h-2 sebelum agenda manasik.
                  </span>
                </div>
                <input
                  type="checkbox"
                  checked={settings.enableWaManasikReminder}
                  onChange={(e) => setSettings({ ...settings, enableWaManasikReminder: e.target.checked })}
                  className="h-5 w-5 rounded border-slate-300 text-emerald-600 accent-emerald-600"
                />
              </div>
            </div>
          </div>
        )}

        {/* Tab 4: Keamanan & Audit Trail */}
        {activeTab === "security" && (
          <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm space-y-6">
            <div>
              <h3 className="text-sm font-bold text-slate-900">
                Keamanan &amp; Audit Trail Log Aktivitas
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Konfigurasi durasi sesi login super admin, kebijakan kata sandi, dan kepatuhan sistem database.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Batas Waktu Sesi Tidak Aktif (Menit)
                </label>
                <input
                  type="number"
                  value={settings.sessionTimeoutMinutes}
                  onChange={(e) => setSettings({ ...settings, sessionTimeoutMinutes: e.target.value })}
                  className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Arsitektur Database Keamanan
                </label>
                <div className="flex items-center gap-2 rounded-xl bg-emerald-50/60 p-2.5 border border-emerald-200/60 text-emerald-800 font-medium">
                  <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                  <span>Direct Supabase &amp; Row Level Security (RLS) Aktif</span>
                </div>
              </div>
            </div>

            <div className="border-t border-slate-100 pt-5 space-y-3">
              <div className="flex items-center justify-between rounded-xl bg-slate-50/70 p-3.5 border border-slate-200/80">
                <div>
                  <span className="font-semibold text-xs text-slate-800 block">
                    Pencatatan Audit Trail Aktivitas (Activity Logs)
                  </span>
                  <span className="text-[11px] text-slate-400">
                    Merekam setiap tindakan perubahan data, tambah paket, edit tagihan, dan login pengguna.
                  </span>
                </div>
                <input
                  type="checkbox"
                  checked={settings.enableAuditTrailLogging}
                  onChange={(e) => setSettings({ ...settings, enableAuditTrailLogging: e.target.checked })}
                  className="h-5 w-5 rounded border-slate-300 text-emerald-600 accent-emerald-600"
                />
              </div>
            </div>
          </div>
        )}

        <div className="mt-6 flex items-center justify-end">
          <button
            type="submit"
            disabled={isSaving}
            className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-6 py-2.5 text-xs sm:text-sm font-semibold text-white shadow-sm hover:bg-emerald-700 transition active:scale-[0.98] disabled:opacity-60"
          >
            <Save className="h-4 w-4" />
            <span>{isSaving ? "Menyimpan..." : "Simpan Seluruh Pengaturan"}</span>
          </button>
        </div>
      </form>
    </div>
  );
}
