import { ReportTransaction } from "@/types/database.types";
import { dbRead, dbInsert } from "@/lib/db/write";

export async function getTransactions(): Promise<ReportTransaction[]> {
  // Lewat proxy service-role: policy SELECT invoices menuntut auth.uid()/admin.
  // Pembacaan lintas jamaah hanya diizinkan untuk sesi staf (lihat /api/db).
  const data = await dbRead<any>("invoices", {
    select: `
      *,
      profiles:jamaah_id (id, full_name, email, passport_number),
      bookings:booking_id (packages:package_id (name, type))
    `,
    order: "created_at",
    desc: true,
  });

  return data.map((inv: any) => ({
    id: inv.id,
    transactionNumber: inv.invoice_number,
    pilgrimName: inv.profiles?.full_name || "Jamaah",
    passportNumber: inv.profiles?.passport_number || "-",
    packageName: inv.bookings?.packages?.name || "-",
    packageCategory: inv.bookings?.packages?.type || "-",
    amount: Number(inv.amount) || 0,
    paymentType: inv.type === "dp" ? "DP" : inv.type === "pelunasan" ? "Pelunasan" : "Full Payment",
    paymentMethod: (inv.payment_method as any) || "BSI Virtual Account",
    status: inv.status === "paid" ? "Berhasil" : inv.status === "cancelled" ? "Gagal" : "Pending",
    transactionDate: inv.created_at?.split("T")[0] || new Date().toISOString().split("T")[0],
  }));
}

export async function createTransaction(
  input: Omit<ReportTransaction, "id" | "transactionNumber">
): Promise<ReportTransaction> {
  const invoiceNumber = `INV-${Date.now().toString().slice(-6)}`;

  const newInvoice = {
    invoice_number: invoiceNumber,
    type: input.paymentType === "DP" ? "dp" : "pelunasan",
    amount: input.amount,
    paid_amount: input.status === "Berhasil" ? input.amount : 0,
    status: input.status === "Berhasil" ? "paid" : "unpaid",
    due_date: new Date().toISOString().split("T")[0],
    payment_method: input.paymentMethod,
  };

  const data = await dbInsert<{ id: string; invoice_number: string; amount: number; created_at?: string }>(
    "invoices",
    newInvoice
  );

  return {
    id: data.id,
    transactionNumber: data.invoice_number,
    pilgrimName: input.pilgrimName,
    passportNumber: input.passportNumber,
    packageName: input.packageName,
    packageCategory: input.packageCategory,
    amount: Number(data.amount) || input.amount,
    paymentType: input.paymentType,
    paymentMethod: input.paymentMethod,
    status: input.status,
    transactionDate: data.created_at?.split("T")[0] || new Date().toISOString().split("T")[0],
  };
}
