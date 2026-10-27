"use client";

import * as React from "react";
import {
  CreditCard,
  X,
  ShieldCheck,
  ArrowRight,
} from "lucide-react";
import { InvoiceDetail } from "./InvoiceDetail";
import { PaymentMethods, SelectedChannelId } from "./PaymentMethods";
import { PaymentStatus, type GatewayState } from "./PaymentStatus";
import { formatCurrency } from "@/lib/utils";
import { getMidtransAmount, IS_PRODUCTION } from "@/lib/midtrans/config";

export interface PaymentInvoiceData {
  id?: string;
  invoiceNumber: string;
  pilgrimName: string;
  packageName: string;
  amount: number;
  phone?: string;
  email?: string;
}

export interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  invoice: PaymentInvoiceData | null;
  onPaymentSuccess?: (invoiceNumber: string, paidAmount: number, channel: string, orderId: string) => void;
  onViewReceipt?: (invoiceNumber: string) => void;
}

const channelNameMap: Record<SelectedChannelId, string> = {
  dana: "DANA",
  gopay: "GoPay",
  shopeepay: "ShopeePay",
  bca_va: "BCA VA",
  mandiri_bill: "Mandiri Bill",
  bni_va: "BNI VA",
  bri_va: "BRI VA",
  qris: "QRIS",
};

export const PaymentModal: React.FC<PaymentModalProps> = ({
  isOpen,
  onClose,
  invoice,
  onPaymentSuccess,
  onViewReceipt,
}) => {
  const [selectedChannel, setSelectedChannel] = React.useState<SelectedChannelId>("dana");
  const [isLoading, setIsLoading] = React.useState<boolean>(false);
  const [isSuccess, setIsSuccess] = React.useState<boolean>(false);
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null);
  const [lastOrderId, setLastOrderId] = React.useState<string>("");
  const [finalState, setFinalState] = React.useState<GatewayState>("verified");

  // Reset state when modal opens
  React.useEffect(() => {
    if (isOpen) {
      setSelectedChannel("dana");
      setIsLoading(false);
      setIsSuccess(false);
      setErrorMessage(null);
      setFinalState("verified");
    }
  }, [isOpen, invoice]);

  // Handle ESC key to close
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen && !isLoading) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, isLoading, onClose]);

  if (!isOpen || !invoice) return null;

  // Amount actually charged & persisted (capped to a safe test value in sandbox).
  const chargeAmount = getMidtransAmount(invoice.amount);

  /**
   * Hanya "verified" (Midtrans yang melaporkan transaksinya selesai) yang boleh
   * menulis pembayaran ke database. "unverified" = token tidak didapat, snap.js
   * belum dimuat, atau jaringan error — uang belum tentu pindah, jadi dicatat
   * sebagai pembayaran akan memalsukan laporan.
   */
  const finish = (state: GatewayState, orderId: string) => {
    setIsLoading(false);
    setIsSuccess(true);
    setFinalState(state);
    if (state === "verified" && onPaymentSuccess) {
      onPaymentSuccess(
        invoice.invoiceNumber,
        chargeAmount,
        channelNameMap[selectedChannel],
        orderId
      );
    }
  };

  const handlePayClick = async () => {
    setIsLoading(true);
    setErrorMessage(null);

    const uniqueOrderId = `${invoice.invoiceNumber}-TX${Date.now().toString().slice(-6)}`;
    setLastOrderId(uniqueOrderId);

    try {
      // 1. Panggil endpoint Midtrans Snap di server
      const response = await fetch("/api/midtrans/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          order_id: uniqueOrderId,
          gross_amount: chargeAmount,
          customer_details: {
            // Nilai kosong dibiarkan undefined; /api/midtrans/create yang
            // menyiapkan default netral ("Jamaah"), bukan nama orang tertentu.
            name: invoice.pilgrimName && invoice.pilgrimName !== "-" ? invoice.pilgrimName : undefined,
            email: invoice.email || undefined,
            phone: invoice.phone && invoice.phone !== "-" ? invoice.phone : undefined,
            packageName: invoice.packageName && invoice.packageName !== "-" ? invoice.packageName : "Tagihan Paket Umroh",
          },
          item_details: [
            {
              id: invoice.invoiceNumber,
              price: chargeAmount,
              quantity: 1,
              name: (invoice.packageName && invoice.packageName !== "-" ? invoice.packageName : "Tagihan Paket Umroh").slice(0, 50),
            },
          ],
          payment_channel: selectedChannel,
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.token) {
        // Gateway tidak memberi token (dev tanpa MIDTRANS_SERVER_KEY, atau API
        // gagal). Tampilkan status tapi jangan catat pembayaran.
        console.warn(
          "[Midtrans] Token tidak didapat — alur ditampilkan sebagai SIMULASI, pembayaran tidak dicatat.",
          data?.error
        );
        setTimeout(() => finish("unverified", uniqueOrderId), 1200);
        return;
      }

      const snapToken = data.token;

      // 2. Tampilkan Popup Midtrans Snap.js jika tersedia di browser
      if (typeof window !== "undefined" && (window as any).snap) {
        (window as any).snap.pay(snapToken, {
          onSuccess: function (result: any) {
            console.log("[Midtrans Snap] Success:", result);
            finish("verified", uniqueOrderId);
          },
          onPending: function (result: any) {
            console.log("[Midtrans Snap] Pending:", result);
            // Dana belum pindah (VA/QRIS menunggu). Webhook yang akan menulis
            // tagihannya saat transaksi benar-benar settle.
            finish("pending", uniqueOrderId);
          },
          onError: function (result: any) {
            console.error("[Midtrans Snap] Error:", result);
            setIsLoading(false);
            setErrorMessage("Pembayaran dibatalkan atau ditolak gateway.");
          },
          onClose: function () {
            setIsLoading(false);
            console.log("[Midtrans Snap] User closed the popup");
          },
        });
      } else if (data.redirect_url) {
        // snap.js belum dimuat: user diarahkan ke halaman Midtrans di tab lain.
        // Hasil transaksinya tidak diketahui di sini, jadi tidak ada yang ditulis.
        window.open(data.redirect_url, "_blank");
        console.warn(
          "[Midtrans] snap.js belum tersedia — pembayaran hanya dibuka di tab gateway, tidak dicatat."
        );
        finish("unverified", uniqueOrderId);
      } else {
        console.warn("[Midtrans] Respons tanpa token maupun redirect_url.");
        setTimeout(() => finish("unverified", uniqueOrderId), 1200);
      }
    } catch (err: any) {
      console.warn("[Midtrans] Gagal memanggil API create — tidak ada pembayaran dicatat:", err);
      setTimeout(() => finish("unverified", uniqueOrderId), 1000);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="payment-modal-title"
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-900/60 backdrop-blur-md animate-fade-in overflow-y-auto"
    >
      {/* Modal Container: Max-width 520px matching Image 2 */}
      <div className="relative w-full max-w-[520px] bg-white rounded-t-3xl sm:rounded-3xl shadow-2xl shadow-slate-900/20 border border-slate-100 overflow-hidden flex flex-col max-h-[94vh] sm:max-h-[90vh] my-0 sm:my-6 transition-all duration-300">
        
        {/* Top Header: CreditCard Icon in Green Box + Title + Subtitle + Close 'X' */}
        <div className="relative px-6 py-5 border-b border-slate-100 bg-white shrink-0">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700 shrink-0">
                <CreditCard className="h-5 w-5 stroke-[2.2]" />
              </div>
              <div>
                <h2
                  id="payment-modal-title"
                  className="text-base sm:text-lg font-bold tracking-tight text-slate-900 leading-tight"
                >
                  Detail &amp; Metode Pembayaran
                </h2>
                <p className="text-xs text-slate-400 mt-0.5 leading-snug">
                  Pilih saluran resmi untuk pelunasan tagihan ibadah
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={onClose}
              disabled={isLoading}
              aria-label="Tutup modal"
              className="rounded-full p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer shrink-0 disabled:opacity-50"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Content Body Area */}
        {isSuccess ? (
          <div className="p-6 overflow-y-auto">
            <PaymentStatus
              invoiceNumber={invoice.invoiceNumber}
              amount={chargeAmount}
              paymentMethod={channelNameMap[selectedChannel]}
              orderId={lastOrderId}
              gatewayState={finalState}
              onClose={onClose}
              onViewReceipt={
                onViewReceipt
                  ? () => {
                      onClose();
                      onViewReceipt(invoice.invoiceNumber);
                    }
                  : undefined
              }
            />
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-4">
            {/* Error Banner */}
            {errorMessage && (
              <div className="rounded-xl bg-rose-50 border border-rose-200 p-3.5 text-xs text-rose-700 font-medium animate-fade-in">
                {errorMessage}
              </div>
            )}

            {/* 1. Invoice Detail Card (matching Image 2) */}
            <InvoiceDetail
              invoiceNumber={invoice.invoiceNumber}
              pilgrimName={invoice.pilgrimName || "-"}
              packageName={invoice.packageName || "-"}
              amount={chargeAmount}
            />

            {/* 2. Payment Channels Section (matching Image 2) */}
            <PaymentMethods
              selectedChannel={selectedChannel}
              onSelectChannel={setSelectedChannel}
            />
          </div>
        )}

        {/* Sticky Footer CTA Button & Trust Signal matching Image 2 */}
        {!isSuccess && (
          <div className="p-5 sm:p-6 border-t border-slate-100 bg-white shrink-0 space-y-3">
            <button
              type="button"
              disabled={isLoading}
              onClick={handlePayClick}
              className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 active:scale-[0.99] text-white py-3 px-4 text-xs sm:text-sm font-bold shadow-md shadow-emerald-900/10 transition-all cursor-pointer disabled:opacity-50"
            >
              {isLoading ? (
                <span>Menghubungkan Midtrans Snap...</span>
              ) : (
                <>
                  <span>
                    Bayar via {channelNameMap[selectedChannel]} — {formatCurrency(chargeAmount)}
                  </span>
                  <ArrowRight className="h-4 w-4" />
                </>
              )}
            </button>

            <div className="flex items-center justify-center gap-1.5 text-[11px] text-slate-400 font-medium pt-0.5">
              <ShieldCheck className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
              <span>Transaksi resmi dilindungi Midtrans Payment Gateway &amp; OJK</span>
            </div>

            {!IS_PRODUCTION && (
              <div className="flex items-center justify-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-amber-700 bg-amber-50 border border-amber-200 rounded-lg py-1.5">
                <span>Mode Testing Sandbox — nominal disamakan Rp 1.000.000</span>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
