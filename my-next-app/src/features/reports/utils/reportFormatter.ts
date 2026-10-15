import { formatRupiah, formatDateIndo, formatDateShort } from "@/lib/utils";
import { ReportTransaction } from "@/types/database.types";

export function formatTransactionRow(tx: ReportTransaction) {
  return {
    ...tx,
    formattedAmount: formatRupiah(tx.amount),
    formattedDate: formatDateShort(tx.transactionDate),
    fullDate: formatDateIndo(tx.transactionDate),
  };
}

export function calculateSummary(transactions: ReportTransaction[]) {
  const successful = transactions.filter((t) => t.status === "Berhasil");
  const totalRevenue = successful.reduce((sum, t) => sum + t.amount, 0);

  return {
    totalRevenue,
    totalTransactions: transactions.length,
    pilgrimsCountThisMonth: new Set(transactions.map((t) => t.pilgrimName)).size,
    avgPaymentPerPilgrim:
      successful.length > 0 ? Math.round(totalRevenue / successful.length) : 0,
    successfulTransactions: successful.length,
  };
}
