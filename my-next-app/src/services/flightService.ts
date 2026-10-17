import { createClient } from "@/lib/supabase/client";
import { dbInsert, dbUpdate, dbDelete } from "@/lib/db/write";
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
  return dbInsert<FlightRow>("flights", { ...payload });
}

export async function updateFlight(id: string, payload: FlightUpdate): Promise<FlightRow> {
  return dbUpdate<FlightRow>("flights", id, { ...payload });
}

export async function deleteFlight(id: string): Promise<boolean> {
  return dbDelete("flights", id);
}
