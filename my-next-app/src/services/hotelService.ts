import { createClient } from "@/lib/supabase/client";
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
  const supabase = createClient();
  const { data, error } = await supabase
    .from("hotels")
    .insert([payload])
    .select()
    .single();

  if (error) {
    console.error("Error inserting hotel:", error.message);
    throw new Error(error.message);
  }

  return data;
}

export async function updateHotel(id: string, payload: HotelUpdate): Promise<HotelRow> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("hotels")
    .update(payload)
    .eq("id", id)
    .select()
    .single();

  if (error) {
    console.error("Error updating hotel:", error.message);
    throw new Error(error.message);
  }

  return data;
}

export async function deleteHotel(id: string): Promise<boolean> {
  const supabase = createClient();
  const { error } = await supabase.from("hotels").delete().eq("id", id);

  if (error) {
    console.error("Error deleting hotel:", error.message);
    throw new Error(error.message);
  }

  return true;
}
