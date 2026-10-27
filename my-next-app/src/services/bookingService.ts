import { dbRead, dbInsert, dbUpdate, dbDelete } from "@/lib/db/write";
import { Database } from "@/types/supabase.types";

export type BookingRow = Database["public"]["Tables"]["bookings"]["Row"];
export type BookingInsert = Database["public"]["Tables"]["bookings"]["Insert"];
export type BookingUpdate = Database["public"]["Tables"]["bookings"]["Update"];
export type BookingStatus = Database["public"]["Enums"]["booking_status"];

export type BookingWithDetails = BookingRow & {
  profiles: {
    id: string;
    full_name: string | null;
    email: string | null;
    phone?: string | null;
    avatar_url?: string | null;
    passport_number?: string | null;
  } | null;
  packages: {
    id: string;
    name: string;
    type: string;
    price: number;
    duration_days: number;
    quota: number;
    booked_count: number;
    departure_date: string | null;
    down_payment: number | null;
  } | null;
};

export const BOOKING_SELECT = `
  *,
  profiles:pilgrim_id (id, full_name, email, phone, avatar_url, passport_number),
  packages:package_id (id, name, type, price, duration_days, quota, booked_count, departure_date, down_payment)
`;

/** Sisa kursi paket pada saat booking dibuat. */
export function seatsLeft(pkg: BookingWithDetails["packages"]): number | null {
  if (!pkg || pkg.quota == null) return null;
  return Math.max(0, pkg.quota - (pkg.booked_count ?? 0));
}

export async function getBookings(): Promise<BookingWithDetails[]> {
  // Policy SELECT bookings menuntut is_admin() atau auth.uid() = pilgrim_id,
  // sehingga query browser (anon) tidak mengembalikan apa pun.
  const data = await dbRead<BookingWithDetails>("bookings", {
    select: BOOKING_SELECT,
    order: "created_at",
    desc: true,
  });
  return data || [];
}

export async function getBookingById(id: string): Promise<BookingWithDetails | null> {
  try {
    const rows = await dbRead<BookingWithDetails>("bookings", {
      select: BOOKING_SELECT,
      eq: { id },
    });
    return rows[0] ?? null;
  } catch {
    return null;
  }
}

/**
 * Pesan error dari trigger database diterjemahkan agar toast di form bisa
 * dibaca jamaah/staf, bukan menampilkan constraint Postgres mentah.
 */
function explainBookingError(err: unknown): Error {
  const raw = err instanceof Error ? err.message : String(err);
  if (/Kuota paket sudah penuh/i.test(raw)) {
    return new Error(raw.replace(/^.*?(Kuota paket sudah penuh[^\d]*)/, "$1"));
  }
  if (/bookings_one_active_per_pilgrim_package|duplicate key value/i.test(raw)) {
    return new Error(
      "Jamaah ini sudah terdaftar pada paket tersebut. Batalkan dulu pendaftaran lama bila ingin mendaftar ulang."
    );
  }
  if (/bookings_kode_booking_key/i.test(raw)) {
    return new Error("Nomor pendaftaran bertabrakan, silakan coba lagi.");
  }
  return new Error(raw);
}

export async function createBooking(payload: BookingInsert): Promise<BookingRow> {
  try {
    return await dbInsert<BookingRow>("bookings", { ...payload });
  } catch (err) {
    throw explainBookingError(err);
  }
}

export async function updateBooking(id: string, payload: BookingUpdate): Promise<BookingRow> {
  return dbUpdate<BookingRow>("bookings", id, { ...payload });
}

export async function deleteBooking(id: string): Promise<boolean> {
  return dbDelete("bookings", id);
}
