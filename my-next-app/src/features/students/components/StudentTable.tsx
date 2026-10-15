import * as React from "react";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/Table";
import { Pilgrim } from "@/types/database.types";
import { formatRupiah, formatDateShort } from "@/lib/utils";
import {
  CheckCircle2,
  Clock,
  AlertCircle,
  Eye,
  Pencil,
  Trash2,
  CheckCircle,
  XCircle,
} from "lucide-react";
import { Button } from "@/components/ui/Button";

interface StudentTableProps {
  pilgrims: Pilgrim[];
  onView: (pilgrim: Pilgrim) => void;
  onEdit: (pilgrim: Pilgrim) => void;
  onDelete: (pilgrim: Pilgrim) => void;
}

export const StudentTable: React.FC<StudentTableProps> = ({
  pilgrims,
  onView,
  onEdit,
  onDelete,
}) => {
  const renderPaymentBadge = (status: Pilgrim["paymentStatus"]) => {
    switch (status) {
      case "Lunas":
        return (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-800 border border-emerald-200">
            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
            Lunas
          </span>
        );
      case "DP":
        return (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 px-2.5 py-1 text-xs font-semibold text-amber-800 border border-amber-200">
            <Clock className="h-3.5 w-3.5 text-amber-600" />
            DP Terbayar
          </span>
        );
      case "Belum Bayar":
      default:
        return (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-red-50 px-2.5 py-1 text-xs font-semibold text-red-800 border border-red-200">
            <AlertCircle className="h-3.5 w-3.5 text-red-600" />
            Belum Bayar
          </span>
        );
    }
  };

  const renderVisaBadge = (status: Pilgrim["visaStatus"]) => {
    switch (status) {
      case "Approved":
        return (
          <span className="inline-flex items-center gap-1 rounded-md bg-purple-50 px-2 py-0.5 text-xs font-bold text-purple-700 border border-purple-200">
            <CheckCircle className="h-3 w-3" />
            Approved
          </span>
        );
      case "Process":
        return (
          <span className="inline-flex items-center gap-1 rounded-md bg-blue-50 px-2 py-0.5 text-xs font-bold text-blue-700 border border-blue-200">
            <Clock className="h-3 w-3" />
            Process
          </span>
        );
      case "Rejected":
        return (
          <span className="inline-flex items-center gap-1 rounded-md bg-red-50 px-2 py-0.5 text-xs font-bold text-red-700 border border-red-200">
            <XCircle className="h-3 w-3" />
            Rejected
          </span>
        );
      case "Pending":
      default:
        return (
          <span className="inline-flex items-center gap-1 rounded-md bg-slate-100 px-2 py-0.5 text-xs font-bold text-slate-600 border border-slate-200">
            <Clock className="h-3 w-3" />
            Pending
          </span>
        );
    }
  };

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Nama Jamaah</TableHead>
          <TableHead>No. Paspor</TableHead>
          <TableHead>Paket Umroh</TableHead>
          <TableHead>Status Pembayaran</TableHead>
          <TableHead>Status Visa</TableHead>
          <TableHead className="text-right">Aksi</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {pilgrims.map((pilgrim) => (
          <TableRow key={pilgrim.id} className="group">
            {/* Nama */}
            <TableCell>
              <div className="flex items-center gap-3">
                <div className="h-9 w-9 rounded-full bg-emerald-100 text-emerald-800 font-bold flex items-center justify-center text-xs flex-shrink-0">
                  {pilgrim.fullName
                    .split(" ")
                    .slice(0, 2)
                    .map((n) => n[0])
                    .join("")}
                </div>
                <div>
                  <span className="font-bold text-slate-900 block group-hover:text-emerald-800 transition">
                    {pilgrim.fullName}
                  </span>
                  <span className="text-[11px] text-slate-500">
                    {pilgrim.city} • {pilgrim.phone}
                  </span>
                </div>
              </div>
            </TableCell>

            {/* No. Paspor */}
            <TableCell>
              <span className="font-mono font-semibold text-slate-800 bg-slate-100 px-2 py-1 rounded text-xs">
                {pilgrim.passportNumber}
              </span>
            </TableCell>

            {/* Paket */}
            <TableCell>
              <div>
                <span className="font-semibold text-slate-800 block text-xs">
                  {pilgrim.packageName}
                </span>
                <span className="text-[11px] text-slate-500">
                  Berangkat: {formatDateShort(pilgrim.departureDate)}
                </span>
              </div>
            </TableCell>

            {/* Status Pembayaran */}
            <TableCell>
              <div className="space-y-1">
                {renderPaymentBadge(pilgrim.paymentStatus)}
                <div className="text-[11px] text-slate-500">
                  Total: {formatRupiah(pilgrim.totalPaid)}
                </div>
              </div>
            </TableCell>

            {/* Status Visa */}
            <TableCell>{renderVisaBadge(pilgrim.visaStatus)}</TableCell>

            {/* Actions */}
            <TableCell className="text-right">
              <div className="flex items-center justify-end gap-1">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => onView(pilgrim)}
                  title="Lihat Detail Jamaah"
                  className="h-8 w-8 text-slate-500 hover:text-emerald-800 hover:bg-emerald-50"
                >
                  <Eye className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => onEdit(pilgrim)}
                  title="Edit Data Jamaah"
                  className="h-8 w-8 text-slate-500 hover:text-amber-800 hover:bg-amber-50"
                >
                  <Pencil className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => onDelete(pilgrim)}
                  title="Hapus Jamaah"
                  className="h-8 w-8 text-slate-500 hover:text-red-700 hover:bg-red-50"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
};
