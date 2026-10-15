"use client";

import * as React from "react";
import { CreditCard, Check, QrCode } from "lucide-react";

export type SelectedChannelId =
  | "dana"
  | "gopay"
  | "shopeepay"
  | "bca_va"
  | "mandiri_bill"
  | "bni_va"
  | "bri_va"
  | "qris";

export interface PaymentMethodsProps {
  selectedChannel: SelectedChannelId;
  onSelectChannel: (channelId: SelectedChannelId) => void;
}

export const PaymentMethods: React.FC<PaymentMethodsProps> = ({
  selectedChannel,
  onSelectChannel,
}) => {
  return (
    <div className="space-y-4">
      {/* Section Header matching Screenshot 3 */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5 text-slate-800">
          <CreditCard className="h-4 w-4 text-emerald-600" />
          <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-800">
            PILIH SALURAN PEMBAYARAN:
          </span>
        </div>
        <span className="text-[10px] text-slate-400 font-medium">
          Paling Cepat &amp; Instan
        </span>
      </div>

      {/* Kategori 1: Dompet Digital (E-Wallet) */}
      <div className="space-y-2">
        <span className="text-[11px] font-bold text-slate-700 block">
          Dompet Digital (E-Wallet)
        </span>

        {/* DANA E-Wallet */}
        <div
          onClick={() => onSelectChannel("dana")}
          className={`flex items-center justify-between p-3 rounded-xl border transition-all cursor-pointer ${
            selectedChannel === "dana"
              ? "border-sky-500 bg-sky-50/20 shadow-xs ring-1 ring-sky-400"
              : "border-slate-200 hover:border-slate-300 bg-white"
          }`}
        >
          <div className="flex items-center gap-3">
            {/* DANA Icon */}
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#118EEA] text-white font-black text-[10px] tracking-tighter shrink-0 shadow-xs">
              DANA
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-slate-900 text-xs">
                  DANA E-Wallet
                </span>
                <span className="inline-flex items-center gap-1 rounded-full bg-sky-50 text-sky-600 border border-sky-200/80 px-2 py-0.5 text-[9px] font-semibold">
                  <span>✨</span>
                  <span>Rekomendasi</span>
                </span>
              </div>
              <p className="text-[10px] text-slate-400 mt-0.5">
                Buka aplikasi DANA langsung siap transfer dengan nominal terkunci.
              </p>
            </div>
          </div>

          <div
            className={`flex h-5 w-5 items-center justify-center rounded-full border transition-all ${
              selectedChannel === "dana"
                ? "border-[#118EEA] bg-[#118EEA] text-white"
                : "border-slate-300 bg-white"
            }`}
          >
            {selectedChannel === "dana" && <Check className="h-3 w-3 stroke-[3]" />}
          </div>
        </div>

        {/* GoPay / Gojek */}
        <div
          onClick={() => onSelectChannel("gopay")}
          className={`flex items-center justify-between p-3 rounded-xl border transition-all cursor-pointer ${
            selectedChannel === "gopay"
              ? "border-emerald-500 bg-emerald-50/20 shadow-xs ring-1 ring-emerald-400"
              : "border-slate-200 hover:border-slate-300 bg-white"
          }`}
        >
          <div className="flex items-center gap-3">
            {/* GoPay Icon */}
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#00AA13] text-white font-bold text-[9px] shrink-0 shadow-xs">
              GoPay
            </div>
            <div>
              <span className="font-bold text-slate-900 text-xs">
                GoPay / Gojek
              </span>
              <p className="text-[10px] text-slate-400 mt-0.5">
                Buka aplikasi Gojek / scan QRIS GoPay dengan nominal terkunci.
              </p>
            </div>
          </div>

          <div
            className={`flex h-5 w-5 items-center justify-center rounded-full border transition-all ${
              selectedChannel === "gopay"
                ? "border-emerald-600 bg-emerald-600 text-white"
                : "border-slate-300 bg-white"
            }`}
          >
            {selectedChannel === "gopay" && <Check className="h-3 w-3 stroke-[3]" />}
          </div>
        </div>

        {/* ShopeePay */}
        <div
          onClick={() => onSelectChannel("shopeepay")}
          className={`flex items-center justify-between p-3 rounded-xl border transition-all cursor-pointer ${
            selectedChannel === "shopeepay"
              ? "border-orange-500 bg-orange-50/20 shadow-xs ring-1 ring-orange-400"
              : "border-slate-200 hover:border-slate-300 bg-white"
          }`}
        >
          <div className="flex items-center gap-3">
            {/* ShopeePay Icon */}
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#EE4D2D] text-white font-bold text-[9px] shrink-0 shadow-xs">
              Shopee
            </div>
            <div>
              <span className="font-bold text-slate-900 text-xs">
                ShopeePay
              </span>
              <p className="text-[10px] text-slate-400 mt-0.5">
                Buka aplikasi ShopeePay otomatis
              </p>
            </div>
          </div>

          <div
            className={`flex h-5 w-5 items-center justify-center rounded-full border transition-all ${
              selectedChannel === "shopeepay"
                ? "border-orange-500 bg-orange-500 text-white"
                : "border-slate-300 bg-white"
            }`}
          >
            {selectedChannel === "shopeepay" && <Check className="h-3 w-3 stroke-[3]" />}
          </div>
        </div>
      </div>

      {/* Kategori 2: Virtual Account (Transfer Otomatis 24 Jam) */}
      <div className="space-y-2">
        <span className="text-[11px] font-bold text-slate-700 block">
          Virtual Account (Transfer Otomatis 24 Jam)
        </span>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
          {/* BCA */}
          <div
            onClick={() => onSelectChannel("bca_va")}
            className={`p-2.5 rounded-xl border transition-all cursor-pointer text-left ${
              selectedChannel === "bca_va"
                ? "border-emerald-600 bg-emerald-50/40 ring-1 ring-emerald-500 text-emerald-950 font-bold"
                : "border-slate-200 hover:border-slate-300 bg-white text-slate-700 font-medium"
            }`}
          >
            <span className="text-[11px]">BCA Virtual Account</span>
          </div>

          {/* Mandiri */}
          <div
            onClick={() => onSelectChannel("mandiri_bill")}
            className={`p-2.5 rounded-xl border transition-all cursor-pointer text-left ${
              selectedChannel === "mandiri_bill"
                ? "border-emerald-600 bg-emerald-50/40 ring-1 ring-emerald-500 text-emerald-950 font-bold"
                : "border-slate-200 hover:border-slate-300 bg-white text-slate-700 font-medium"
            }`}
          >
            <span className="text-[11px]">Mandiri Bill Payment</span>
          </div>

          {/* BNI */}
          <div
            onClick={() => onSelectChannel("bni_va")}
            className={`p-2.5 rounded-xl border transition-all cursor-pointer text-left ${
              selectedChannel === "bni_va"
                ? "border-emerald-600 bg-emerald-50/40 ring-1 ring-emerald-500 text-emerald-950 font-bold"
                : "border-slate-200 hover:border-slate-300 bg-white text-slate-700 font-medium"
            }`}
          >
            <span className="text-[11px]">BNI Virtual Account</span>
          </div>

          {/* BRI */}
          <div
            onClick={() => onSelectChannel("bri_va")}
            className={`p-2.5 rounded-xl border transition-all cursor-pointer text-left ${
              selectedChannel === "bri_va"
                ? "border-emerald-600 bg-emerald-50/40 ring-1 ring-emerald-500 text-emerald-950 font-bold"
                : "border-slate-200 hover:border-slate-300 bg-white text-slate-700 font-medium"
            }`}
          >
            <span className="text-[11px]">BRI (BRIVA)</span>
          </div>
        </div>
      </div>

      {/* Kategori 3: QRIS */}
      <div
        onClick={() => onSelectChannel("qris")}
        className={`flex items-center justify-between p-3 rounded-xl border transition-all cursor-pointer ${
          selectedChannel === "qris"
            ? "border-emerald-500 bg-emerald-50/20 shadow-xs ring-1 ring-emerald-400"
            : "border-slate-200 hover:border-slate-300 bg-white"
        }`}
      >
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-slate-900 text-white shrink-0 shadow-xs">
            <QrCode className="h-5 w-5" />
          </div>
          <div>
            <span className="font-bold text-slate-900 text-xs">
              QRIS (Scan Semua Bank &amp; E-Wallet)
            </span>
            <p className="text-[10px] text-slate-400 mt-0.5">
              Scan instan dari Livin, BCA Mobile, BRImo, DANA, OVO, GoPay.
            </p>
          </div>
        </div>

        <div
          className={`flex h-5 w-5 items-center justify-center rounded-full border transition-all ${
            selectedChannel === "qris"
              ? "border-emerald-600 bg-emerald-600 text-white"
              : "border-slate-300 bg-white"
          }`}
        >
          {selectedChannel === "qris" && <Check className="h-3 w-3 stroke-[3]" />}
        </div>
      </div>
    </div>
  );
};
