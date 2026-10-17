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
  } | null;
  packages: {
    id: string;
    name: string;
    type: string;
    price: number;
    duration_days: number;
    quota: number;
  } | null;
};

const BOOKING_SELECT = `
  *,
  profiles:pilgrim_id (id, full_name, email, phone, avatar_url),
  packages:package_id (id, name, type, price, duration_days, quota)
`;

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

export async function createBooking(payload: BookingInsert): Promise<BookingRow> {
  return dbInsert<BookingRow>("bookings", { ...payload });
}

export async function updateBooking(id: string, payload: BookingUpdate): Promise<BookingRow> {
  return dbUpdate<BookingRow>("bookings", id, { ...payload });
}

export async function deleteBooking(id: string): Promise<boolean> {
  return dbDelete("bookings", id);
}
