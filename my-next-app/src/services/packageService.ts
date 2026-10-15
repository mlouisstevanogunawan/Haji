import { createClient } from "@/lib/supabase/client";
import { Database } from "@/types/supabase.types";

export type PackageRow = Database["public"]["Tables"]["packages"]["Row"];
export type PackageInsert = Database["public"]["Tables"]["packages"]["Insert"];
export type PackageUpdate = Database["public"]["Tables"]["packages"]["Update"];
export type PackageType = Database["public"]["Enums"]["package_type"];

export async function getPackages(type?: PackageType): Promise<PackageRow[]> {
  const supabase = createClient();
  let query = supabase
    .from("packages")
    .select("*")
    .order("created_at", { ascending: false });

  if (type) {
    query = query.eq("type", type);
  }

  const { data, error } = await query;

  if (error) {
    console.error("Error fetching packages from Supabase:", error.message);
    throw new Error(error.message);
  }

  return data || [];
}

export async function getPackageById(id: string): Promise<PackageRow | null> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("packages")
    .select("*")
    .eq("id", id)
    .single();

  if (error) {
    console.error("Error fetching package by id:", error.message);
    return null;
  }

  return data;
}

export async function createPackage(payload: PackageInsert): Promise<PackageRow> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("packages")
    .insert([payload])
    .select()
    .single();

  if (error) {
    console.error("Error creating package:", error.message);
    throw new Error(error.message);
  }

  return data;
}

export async function updatePackage(id: string, payload: PackageUpdate): Promise<PackageRow> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("packages")
    .update(payload)
    .eq("id", id)
    .select()
    .single();

  if (error) {
    console.error("Error updating package:", error.message);
    throw new Error(error.message);
  }

  return data;
}

export async function deletePackage(id: string): Promise<boolean> {
  const supabase = createClient();
  const { error } = await supabase.from("packages").delete().eq("id", id);

  if (error) {
    console.error("Error deleting package:", error.message);
    throw new Error(error.message);
  }

  return true;
}
