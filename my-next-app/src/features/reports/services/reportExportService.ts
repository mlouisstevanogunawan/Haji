import { ReportTransaction } from "@/types/database.types";

export function exportTransactionsToCSV(
  transactions: ReportTransaction[],
  filename: string = `Laporan_Keuangan_Umroh_${new Date().toISOString().split("T")[0]}.csv`
): void {
  const headers = [
    "No Transaksi",
    "Nama Jamaah",
    "No Paspor",
    "Paket Umroh",
    "Kategori",
    "Nominal (IDR)",
    "Jenis Pembayaran",
    "Metode Pembayaran",
    "Status Transaksi",
    "Tanggal Transaksi",
  ];

  const rows = transactions.map((t) => [
    `"${t.transactionNumber}"`,
    `"${t.pilgrimName.replace(/"/g, '""')}"`,
    `"${t.passportNumber}"`,
    `"${t.packageName.replace(/"/g, '""')}"`,
    `"${t.packageCategory}"`,
    t.amount,
    `"${t.paymentType}"`,
    `"${t.paymentMethod}"`,
    `"${t.status}"`,
    `"${t.transactionDate}"`,
  ]);

  // UTF-8 BOM for Microsoft Excel Indonesian compatibility
  const csvContent = "\uFEFF" + [headers.join(","), ...rows.map((e) => e.join(","))].join("\r\n");

  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const link = document.createElement("a");
  const url = URL.createObjectURL(blob);

  link.setAttribute("href", url);
  link.setAttribute("download", filename);
  link.style.visibility = "hidden";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
