import { ReportTransaction } from "@/types/database.types";
import { createClient } from "@/lib/supabase/client";

export async function getTransactions(): Promise<ReportTransaction[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("invoices")
    .select(`
      *,
      profiles:jamaah_id (id, full_name, email)
    `)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching transactions/invoices from Supabase:", error.message);
    throw new Error(error.message);
  }

  return (data || []).map((inv: any) => ({
    id: inv.id,
    transactionNumber: inv.invoice_number,
    pilgrimName: inv.profiles?.full_name || "Jamaah",
    passportNumber: "-",
    packageName: "Paket Umroh Reguler",
    packageCategory: "Reguler",
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
  const supabase = createClient();
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

  const { data, error } = await supabase
    .from("invoices")
    .insert([newInvoice])
    .select()
    .single();

  if (error) {
    console.error("Error creating transaction in Supabase:", error.message);
    throw new Error(error.message);
  }

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
