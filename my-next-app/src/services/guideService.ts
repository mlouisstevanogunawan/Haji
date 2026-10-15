import { createClient } from "@/lib/supabase/client";
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
  const supabase = createClient();
  const { data, error } = await supabase
    .from("guides")
    .insert([payload])
    .select()
    .single();

  if (error) {
    console.error("Error creating guide:", error.message);
    throw new Error(error.message);
  }

  return data;
}

export async function updateGuide(id: string, payload: GuideUpdate): Promise<GuideRow> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("guides")
    .update(payload)
    .eq("id", id)
    .select()
    .single();

  if (error) {
    console.error("Error updating guide:", error.message);
    throw new Error(error.message);
  }

  return data;
}

export async function deleteGuide(id: string): Promise<boolean> {
  const supabase = createClient();
  const { error } = await supabase.from("guides").delete().eq("id", id);

  if (error) {
    console.error("Error deleting guide:", error.message);
    throw new Error(error.message);
  }

  return true;
}
