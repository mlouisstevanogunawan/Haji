import * as React from "react";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/Table";
import { ReportTransaction } from "@/types/database.types";
import { formatRupiah, formatDateShort } from "@/lib/utils";
import { CheckCircle2, CreditCard, Banknote } from "lucide-react";

interface ReportTableProps {
  transactions: ReportTransaction[];
}

export const ReportTable: React.FC<ReportTableProps> = ({ transactions }) => {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>No. Kuitansi</TableHead>
          <TableHead>Nama Jamaah & Paspor</TableHead>
          <TableHead>Paket Keberangkatan</TableHead>
          <TableHead>Jenis & Metode Bayar</TableHead>
          <TableHead className="text-right">Nominal Setoran</TableHead>
          <TableHead>Tanggal</TableHead>
          <TableHead className="text-center">Status</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {transactions.map((tx) => (
          <TableRow key={tx.id} className="group">
            {/* No. Kuitansi */}
            <TableCell>
              <span className="font-mono text-xs font-bold text-slate-800 bg-slate-100 px-2 py-1 rounded">
                {tx.transactionNumber}
              </span>
            </TableCell>

            {/* Nama Jamaah */}
            <TableCell>
              <div>
                <span className="font-bold text-slate-900 block group-hover:text-emerald-800 transition">
                  {tx.pilgrimName}
                </span>
                <span className="font-mono text-[11px] text-slate-500">
                  Paspor: {tx.passportNumber}
                </span>
              </div>
            </TableCell>

            {/* Paket */}
            <TableCell>
              <div>
                <span className="font-semibold text-xs text-slate-800 block">
                  {tx.packageName}
                </span>
                <span className="rounded bg-emerald-50 px-1.5 py-0.2 text-[10px] font-bold text-emerald-800">
                  {tx.packageCategory}
                </span>
              </div>
            </TableCell>

            {/* Jenis & Metode */}
            <TableCell>
              <div className="space-y-0.5">
                <span className="font-semibold text-xs text-slate-800 block">
                  {tx.paymentType}
                </span>
                <div className="flex items-center gap-1 text-[11px] text-slate-500">
                  <CreditCard className="h-3 w-3 text-slate-400" />
                  <span>{tx.paymentMethod}</span>
                </div>
              </div>
            </TableCell>

            {/* Nominal */}
            <TableCell className="text-right">
              <span className="text-sm font-extrabold text-emerald-900">
                {formatRupiah(tx.amount)}
              </span>
            </TableCell>

            {/* Tanggal */}
            <TableCell>
              <span className="text-xs text-slate-600">
                {formatDateShort(tx.transactionDate)}
              </span>
            </TableCell>

            {/* Status */}
            <TableCell className="text-center">
              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-semibold text-emerald-800 border border-emerald-200">
                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                {tx.status}
              </span>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
};
