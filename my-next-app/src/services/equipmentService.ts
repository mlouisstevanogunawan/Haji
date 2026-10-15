import { createClient } from "@/lib/supabase/client";
import { Database } from "@/types/supabase.types";

export type EquipmentRow = Database["public"]["Tables"]["equipment"]["Row"];
export type EquipmentInsert = Database["public"]["Tables"]["equipment"]["Insert"];
export type EquipmentUpdate = Database["public"]["Tables"]["equipment"]["Update"];
export type EquipmentCondition = Database["public"]["Enums"]["equipment_condition"];

export async function getEquipment(): Promise<EquipmentRow[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("equipment")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching equipment from Supabase:", error.message);
    throw new Error(error.message);
  }

  return data || [];
}

export async function getEquipmentById(id: string): Promise<EquipmentRow | null> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("equipment")
    .select("*")
    .eq("id", id)
    .single();

  if (error) {
    console.error("Error fetching equipment by id:", error.message);
    return null;
  }

  return data;
}

export async function createEquipment(payload: EquipmentInsert): Promise<EquipmentRow> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("equipment")
    .insert([payload])
    .select()
    .single();

  if (error) {
    console.error("Error creating equipment:", error.message);
    throw new Error(error.message);
  }

  return data;
}

export async function updateEquipment(id: string, payload: EquipmentUpdate): Promise<EquipmentRow> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("equipment")
    .update(payload)
    .eq("id", id)
    .select()
    .single();

  if (error) {
    console.error("Error updating equipment:", error.message);
    throw new Error(error.message);
  }

  return data;
}

export async function deleteEquipment(id: string): Promise<boolean> {
  const supabase = createClient();
  const { error } = await supabase.from("equipment").delete().eq("id", id);

  if (error) {
    console.error("Error deleting equipment:", error.message);
    throw new Error(error.message);
  }

  return true;
}
