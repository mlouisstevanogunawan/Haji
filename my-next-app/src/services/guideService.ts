import { createClient } from "@/lib/supabase/client";
import { dbInsert, dbUpdate, dbDelete } from "@/lib/db/write";
import { Database } from "@/types/supabase.types";

export type GuideRow = Database["public"]["Tables"]["guides"]["Row"];
export type GuideInsert = Database["public"]["Tables"]["guides"]["Insert"];
export type GuideUpdate = Database["public"]["Tables"]["guides"]["Update"];

export async function getGuides(): Promise<GuideRow[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("guides")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching guides from Supabase:", error.message);
    throw new Error(error.message);
  }

  return data || [];
}

export async function getGuideById(id: string): Promise<GuideRow | null> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("guides")
    .select("*")
    .eq("id", id)
    .single();

  if (error) {
    console.error("Error fetching guide by id:", error.message);
    return null;
  }

  return data;
}

export async function createGuide(payload: GuideInsert): Promise<GuideRow> {
  return dbInsert<GuideRow>("guides", { ...payload });
}

export async function updateGuide(id: string, payload: GuideUpdate): Promise<GuideRow> {
  return dbUpdate<GuideRow>("guides", id, { ...payload });
}

export async function deleteGuide(id: string): Promise<boolean> {
  return dbDelete("guides", id);
}
