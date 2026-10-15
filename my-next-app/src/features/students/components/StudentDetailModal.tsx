import * as React from "react";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { Pilgrim } from "@/types/database.types";
import { formatRupiah, formatDateIndo } from "@/lib/utils";
import { User, CreditCard, FileText, CheckCircle2, Shield } from "lucide-react";

interface StudentDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  pilgrim: Pilgrim | null;
}

export const StudentDetailModal: React.FC<StudentDetailModalProps> = ({
  isOpen,
  onClose,
  pilgrim,
}) => {
  if (!pilgrim) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Lembar Data Jamaah"
      description={`ID Registrasi: ${pilgrim.id} • Terdaftar ${formatDateIndo(pilgrim.registrationDate)}`}
      maxWidth="lg"
    >
      <div className="space-y-5 text-sm">
        {/* Profile Card */}
        <div className="flex items-center gap-4 rounded-xl bg-slate-50 p-4 border border-slate-200/80">
          <div className="h-14 w-14 rounded-full bg-emerald-800 text-amber-300 font-extrabold flex items-center justify-center text-lg shadow">
            {pilgrim.fullName
              .split(" ")
              .slice(0, 2)
              .map((n) => n[0])
              .join("")}
          </div>
          <div>
            <h4 className="font-extrabold text-base text-slate-900">
              {pilgrim.fullName}
            </h4>
            <div className="flex items-center gap-2 text-xs text-slate-600 mt-1">
              <span className="font-mono font-semibold bg-emerald-100 text-emerald-900 px-2 py-0.5 rounded">
                Paspor: {pilgrim.passportNumber}
              </span>
              <span>•</span>
              <span>{pilgrim.gender}</span>
              <span>•</span>
              <span>{pilgrim.city}</span>
            </div>
          </div>
        </div>

        {/* Details Grid */}
        <div className="grid grid-cols-2 gap-4">
          <div className="rounded-xl border border-slate-200/80 p-3 space-y-1">
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
              Nomor Induk Kependudukan (NIK)
            </span>
            <span className="font-mono font-bold text-slate-800">
              {pilgrim.nik}
            </span>
          </div>

          <div className="rounded-xl border border-slate-200/80 p-3 space-y-1">
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
              Kontak WhatsApp
            </span>
            <span className="font-bold text-slate-800">{pilgrim.phone}</span>
          </div>

          <div className="rounded-xl border border-slate-200/80 p-3 space-y-1">
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
              Paket Keberangkatan
            </span>
            <span className="font-bold text-emerald-900 block">
              {pilgrim.packageName}
            </span>
            <span className="text-xs text-slate-500">
              Jadwal: {formatDateIndo(pilgrim.departureDate)}
            </span>
          </div>

          <div className="rounded-xl border border-slate-200/80 p-3 space-y-1">
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
              Status Visa & Dokumen
            </span>
            <div className="flex items-center gap-2 mt-1">
              <span className="font-semibold text-purple-700 bg-purple-50 px-2 py-0.5 rounded text-xs">
                Visa: {pilgrim.visaStatus}
              </span>
              <span className="font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded text-xs">
                Berkas: {pilgrim.documentStatus}
              </span>
            </div>
          </div>
        </div>

        {/* Financial Summary */}
        <div className="rounded-xl bg-amber-50/60 p-4 border border-amber-200/70 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-amber-900">
              Total Pembayaran Masuk:
            </span>
            <span className="text-base font-black text-amber-900">
              {formatRupiah(pilgrim.totalPaid)}
            </span>
          </div>
          <div className="flex items-center justify-between text-xs text-amber-800">
            <span>Sisa Tagihan Pelunasan:</span>
            <span className="font-bold">
              {pilgrim.remainingAmount === 0
                ? "LUNAS (Tidak ada tagihan)"
                : formatRupiah(pilgrim.remainingAmount)}
            </span>
          </div>
        </div>

        {/* Notes */}
        {pilgrim.notes && (
          <div className="rounded-xl bg-slate-50 p-3.5 border border-slate-200/80">
            <span className="text-xs font-bold text-slate-700 block mb-1">
              Catatan Permintaan Khusus:
            </span>
            <p className="text-xs text-slate-600 italic">
              &quot;{pilgrim.notes}&quot;
            </p>
          </div>
        )}

        <div className="flex justify-end pt-2 border-t border-slate-100">
          <Button variant="default" size="sm" onClick={onClose}>
            Tutup
          </Button>
        </div>
      </div>
    </Modal>
  );
};
