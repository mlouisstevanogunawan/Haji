import { dbRead, dbInsert, dbUpdate, dbDelete } from "@/lib/db/write";
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

const INVOICE_SELECT = `
  *,
  profiles:jamaah_id (id, full_name, email, phone),
  bookings:booking_id (
    id,
    package_id,
    packages:package_id (name)
  )
`;

export async function getInvoices(): Promise<InvoiceWithDetails[]> {
  // Policy SELECT invoices membatasi baris ke auth.uid() = jamaah_id atau admin;
  // tanpa sesi Supabase asli query browser tidak melihat apa pun.
  const data = await dbRead<InvoiceWithDetails>("invoices", {
    select: INVOICE_SELECT,
    order: "created_at",
    desc: true,
  });
  return data || [];
}

export async function getInvoiceByNumber(invoiceNumber: string): Promise<InvoiceWithDetails | null> {
  try {
    const rows = await dbRead<InvoiceWithDetails>("invoices", {
      select: INVOICE_SELECT,
      eq: { invoice_number: invoiceNumber },
    });
    return rows[0] ?? null;
  } catch {
    return null;
  }
}

export async function createInvoice(payload: InvoiceInsert): Promise<InvoiceRow> {
  return dbInsert<InvoiceRow>("invoices", { ...payload });
}

export async function updateInvoice(id: string, payload: InvoiceUpdate): Promise<InvoiceRow> {
  return dbUpdate<InvoiceRow>("invoices", id, { ...payload });
}

export async function deleteInvoice(id: string): Promise<boolean> {
  return dbDelete("invoices", id);
}

export async function getPayments(): Promise<PaymentRow[]> {
  const data = await dbRead<PaymentRow>("payments", {
    select: "*",
    order: "created_at",
    desc: true,
  });

  return data || [];
}

export async function recordInvoicePayment(  invoiceId: string,
  amount: number,
  paymentMethod: string,
  orderId?: string
): Promise<InvoiceRow> {
  const invoiceRows = await dbRead<InvoiceRow>("invoices", {
    select: "*",
    eq: { id: invoiceId },
  });

  const inv = invoiceRows[0];

  if (!inv) {
    throw new Error("Invoice tidak ditemukan");
  }

  // Dedup lintas-jalur: bila order_id ini sudah pernah dicatat (mis. oleh webhook
  // Midtrans), jangan akumulasi paid_amount lagi agar tidak double-count.
  if (orderId) {
    const existing = await dbRead<{ id: string }>("payments", {
      select: "id",
      eq: { order_id: orderId },
    });
    if (existing.length > 0) {
      return inv;
    }
  }

  const newPaid = Number(inv.paid_amount || 0) + Number(amount);
  const total = Number(inv.amount || 0);
  const newStatus = newPaid >= total ? "paid" : newPaid > 0 ? "partial" : "unpaid";

  const data = await dbUpdate<InvoiceRow>("invoices", invoiceId, {
    paid_amount: newPaid,
    status: newStatus,
    payment_method: paymentMethod,
    payment_date: new Date().toISOString(),
  });

  // Cat jejak pembayaran dengan order_id yang sama supaya webhook dapat
  // mendeteksi pembayaran ini dan tidak menghitung ulang.
  if (orderId) {
    try {
      await dbInsert("payments", {
        invoice_id: invoiceId,
        order_id: orderId,
        payment_type: paymentMethod || "unknown",
        gross_amount: Number(amount) || 0,
        transaction_status: newStatus === "paid" ? "settlement" : "capture",
        settlement_time: new Date().toISOString(),
      });
    } catch {
      // jejak pembayaran bersifat best-effort; invoice sudah tersimpan
    }
  }

  return data;
}

export interface MassInvoiceSummary {
  created: number;
  skippedExisting: number;
  skippedNoAmount: number;
  failed: number;
}

const CICILAN_TERMS: Record<string, number> = {
  "Cicilan Bulanan (3x Termin)": 3,
  "Cicilan Bulanan (6x Termin)": 6,
};

/**
 * Membuat tagihan baru untuk booking yang belum punya invoice.
 * Satu booking maksimal satu tagihan agar pembayaran dan dedup order_id
 * tetap tak bermakna ganda.
 */
export async function createInvoicesForBookings(
  packageName: string,
  scheme: string
): Promise<MassInvoiceSummary> {
  const [bookings, existingInvoices] = await Promise.all([
    dbRead<{
      id: string;
      pilgrim_id: string | null;
      package_id: string | null;
      total_price: number | null;
      invoice_number: string | null;
      status: string | null;
      packages: { name: string | null; down_payment: number | null } | null;
    }>("bookings", {
      select:
        "id, pilgrim_id, package_id, total_price, invoice_number, status, packages:package_id(name, down_payment)",
      order: "created_at",
    }),
    dbRead<{ booking_id: string | null; amount: number; paid_amount: number | null }>(
      "invoices",
      { select: "booking_id, amount, paid_amount" }
    ),
  ]);

  const invoicedBookingIds = new Set(
    existingInvoices.map((inv) => inv.booking_id).filter((id): id is string => Boolean(id))
  );

  const terms = CICILAN_TERMS[scheme];
  const isDp = scheme.startsWith("Uang Muka");
  const dueDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);

  const summary: MassInvoiceSummary = {
    created: 0,
    skippedExisting: 0,
    skippedNoAmount: 0,
    failed: 0,
  };

  for (const booking of bookings) {
    if (packageName && booking.packages?.name !== packageName) continue;
    if (booking.status === "cancelled") continue;
    if (invoicedBookingIds.has(booking.id)) {
      summary.skippedExisting += 1;
      continue;
    }

    const total = Number(booking.total_price || 0);
    if (total <= 0) {
      summary.skippedNoAmount += 1;
      continue;
    }

    let amount = total;
    let type: Database["public"]["Enums"]["invoice_type"] = "pelunasan";
    if (isDp) {
      const dp = Number(booking.packages?.down_payment || 0);
      if (dp <= 0) {
        // Tanpa nominal DP di tabel paket, tagihan DP tidak bisa dihitung.
        summary.skippedNoAmount += 1;
        continue;
      }
      amount = Math.min(dp, total);
      type = "dp";
    } else if (terms) {
      amount = Math.round(total / terms);
      type = "cicilan";
    }

    const invoiceNumber =
      booking.invoice_number ||
      `INV-${new Date().toISOString().slice(2, 10).replace(/-/g, "")}-${booking.id.slice(0, 6).toUpperCase()}`;

    try {
      await createInvoice({
        invoice_number: invoiceNumber,
        jamaah_id: booking.pilgrim_id,
        booking_id: booking.id,
        type,
        amount,
        paid_amount: 0,
        status: "unpaid",
        due_date: dueDate,
      });
      invoicedBookingIds.add(booking.id);
      summary.created += 1;
    } catch (err) {
      console.error("Gagal membuat tagihan:", (err as Error).message);
      summary.failed += 1;
    }
  }

  return summary;
}
