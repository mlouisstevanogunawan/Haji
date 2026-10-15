import { createClient } from "@/lib/supabase/client";
import { Database } from "@/types/supabase.types";

export type InvoiceRow = Database["public"]["Tables"]["invoices"]["Row"];
export type InvoiceInsert = Database["public"]["Tables"]["invoices"]["Insert"];
export type InvoiceUpdate = Database["public"]["Tables"]["invoices"]["Update"];
export type PaymentRow = Database["public"]["Tables"]["payments"]["Row"];

export type InvoiceWithDetails = InvoiceRow & {
  profiles?: {
    id: string;
    full_name: string | null;
    email: string | null;
    phone?: string | null;
  } | null;
  bookings?: {
    id: string;
    package_id: string;
    packages?: {
      name: string;
    } | null;
  } | null;
};

export async function getInvoices(): Promise<InvoiceWithDetails[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("invoices")
    .select(`
      *,
      profiles:jamaah_id (id, full_name, email, phone),
      bookings:booking_id (
        id,
        package_id,
        packages:package_id (name)
      )
    `)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching invoices from Supabase:", error.message);
    throw new Error(error.message);
  }

  return (data as unknown as InvoiceWithDetails[]) || [];
}

export async function getInvoiceByNumber(invoiceNumber: string): Promise<InvoiceWithDetails | null> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("invoices")
    .select(`
      *,
      profiles:jamaah_id (id, full_name, email, phone),
      bookings:booking_id (
        id,
        package_id,
        packages:package_id (name)
      )
    `)
    .eq("invoice_number", invoiceNumber)
    .single();

  if (error) {
    console.error("Error fetching invoice by number:", error.message);
    return null;
  }

  return data as unknown as InvoiceWithDetails;
}

export async function createInvoice(payload: InvoiceInsert): Promise<InvoiceRow> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("invoices")
    .insert([payload])
    .select()
    .single();

  if (error) {
    console.error("Error creating invoice:", error.message);
    throw new Error(error.message);
  }

  return data;
}

export async function updateInvoice(id: string, payload: InvoiceUpdate): Promise<InvoiceRow> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("invoices")
    .update(payload)
    .eq("id", id)
    .select()
    .single();

  if (error) {
    console.error("Error updating invoice:", error.message);
    throw new Error(error.message);
  }

  return data;
}

export async function deleteInvoice(id: string): Promise<boolean> {
  const supabase = createClient();
  const { error } = await supabase.from("invoices").delete().eq("id", id);

  if (error) {
    console.error("Error deleting invoice:", error.message);
    throw new Error(error.message);
  }

  return true;
}

export async function getPayments(): Promise<PaymentRow[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("payments")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching payments from Supabase:", error.message);
    throw new Error(error.message);
  }

  return data || [];
}

export async function recordInvoicePayment(
  invoiceId: string,
  amount: number,
  paymentMethod: string
): Promise<InvoiceRow> {
  const supabase = createClient();

  const { data: inv, error: fetchErr } = await supabase
    .from("invoices")
    .select("*")
    .eq("id", invoiceId)
    .single();

  if (fetchErr || !inv) {
    throw new Error(fetchErr?.message || "Invoice tidak ditemukan");
  }

  const newPaid = Number(inv.paid_amount || 0) + Number(amount);
  const total = Number(inv.amount || 0);
  const newStatus = newPaid >= total ? "paid" : newPaid > 0 ? "partial" : "unpaid";

  const { data, error } = await supabase
    .from("invoices")
    .update({
      paid_amount: newPaid,
      status: newStatus,
      payment_method: paymentMethod,
      payment_date: new Date().toISOString(),
    })
    .eq("id", invoiceId)
    .select()
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return data;
}
