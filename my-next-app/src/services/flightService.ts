import { createClient } from "@/lib/supabase/client";
import { Database } from "@/types/supabase.types";

export type FlightRow = Database["public"]["Tables"]["flights"]["Row"];
export type FlightInsert = Database["public"]["Tables"]["flights"]["Insert"];
export type FlightUpdate = Database["public"]["Tables"]["flights"]["Update"];

export async function getFlights(): Promise<FlightRow[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("flights")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching flights from Supabase:", error.message);
    throw new Error(error.message);
  }

  return data || [];
}

export async function getFlightById(id: string): Promise<FlightRow | null> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("flights")
    .select("*")
    .eq("id", id)
    .single();

  if (error) {
    console.error("Error fetching flight by id:", error.message);
    return null;
  }

  return data;
}

export async function createFlight(payload: FlightInsert): Promise<FlightRow> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("flights")
    .insert([payload])
    .select()
    .single();

  if (error) {
    console.error("Error inserting flight:", error.message);
    throw new Error(error.message);
  }

  return data;
}

export async function updateFlight(id: string, payload: FlightUpdate): Promise<FlightRow> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("flights")
    .update(payload)
    .eq("id", id)
    .select()
    .single();

  if (error) {
    console.error("Error updating flight:", error.message);
    throw new Error(error.message);
  }

  return data;
}

export async function deleteFlight(id: string): Promise<boolean> {
  const supabase = createClient();
  const { error } = await supabase.from("flights").delete().eq("id", id);

  if (error) {
    console.error("Error deleting flight:", error.message);
    throw new Error(error.message);
  }

  return true;
}
