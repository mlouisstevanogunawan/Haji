import { createClient } from "@/lib/supabase/client";
import { dbInsert, dbUpdate, dbDelete } from "@/lib/db/write";
import { Database } from "@/types/supabase.types";

export type HotelRow = Database["public"]["Tables"]["hotels"]["Row"];
export type HotelInsert = Database["public"]["Tables"]["hotels"]["Insert"];
export type HotelUpdate = Database["public"]["Tables"]["hotels"]["Update"];
export type HotelCity = Database["public"]["Enums"]["hotel_city"];

export async function getHotels(city?: HotelCity): Promise<HotelRow[]> {
  const supabase = createClient();
  let query = supabase
    .from("hotels")
    .select("*")
    .order("created_at", { ascending: false });

  if (city) {
    query = query.eq("city", city);
  }

  const { data, error } = await query;

  if (error) {
    console.error("Error fetching hotels from Supabase:", error.message);
    throw new Error(error.message);
  }

  return data || [];
}

export async function getHotelById(id: string): Promise<HotelRow | null> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("hotels")
    .select("*")
    .eq("id", id)
    .single();

  if (error) {
    console.error("Error fetching hotel by id:", error.message);
    return null;
  }

  return data;
}

export async function createHotel(payload: HotelInsert): Promise<HotelRow> {
  return dbInsert<HotelRow>("hotels", { ...payload });
}

export async function updateHotel(id: string, payload: HotelUpdate): Promise<HotelRow> {
  return dbUpdate<HotelRow>("hotels", id, { ...payload });
}

export async function deleteHotel(id: string): Promise<boolean> {
  return dbDelete("hotels", id);
}
