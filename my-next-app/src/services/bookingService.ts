import { createClient } from "@/lib/supabase/client";
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

export async function getBookings(): Promise<BookingWithDetails[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("bookings")
    .select(`
      *,
      profiles:pilgrim_id (id, full_name, email, phone, avatar_url),
      packages:package_id (id, name, type, price, duration_days, quota)
    `)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching bookings from Supabase:", error.message);
    throw new Error(error.message);
  }

  return (data as unknown as BookingWithDetails[]) || [];
}

export async function getBookingById(id: string): Promise<BookingWithDetails | null> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("bookings")
    .select(`
      *,
      profiles:pilgrim_id (id, full_name, email, phone, avatar_url),
      packages:package_id (id, name, type, price, duration_days, quota)
    `)
    .eq("id", id)
    .single();

  if (error) {
    console.error("Error fetching booking by id:", error.message);
    return null;
  }

  return data as unknown as BookingWithDetails;
}

export async function createBooking(payload: BookingInsert): Promise<BookingRow> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("bookings")
    .insert([payload])
    .select()
    .single();

  if (error) {
    console.error("Error creating booking:", error.message);
    throw new Error(error.message);
  }

  return data;
}

export async function updateBooking(id: string, payload: BookingUpdate): Promise<BookingRow> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("bookings")
    .update(payload)
    .eq("id", id)
    .select()
    .single();

  if (error) {
    console.error("Error updating booking:", error.message);
    throw new Error(error.message);
  }

  return data;
}

export async function deleteBooking(id: string): Promise<boolean> {
  const supabase = createClient();
  const { error } = await supabase.from("bookings").delete().eq("id", id);

  if (error) {
    console.error("Error deleting booking:", error.message);
    throw new Error(error.message);
  }

  return true;
}
