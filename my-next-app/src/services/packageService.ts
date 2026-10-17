import { createClient } from "@/lib/supabase/client";
import { dbInsert, dbUpdate, dbDelete } from "@/lib/db/write";
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
  return dbInsert<PackageRow>("packages", { ...payload });
}

export async function updatePackage(id: string, payload: PackageUpdate): Promise<PackageRow> {
  return dbUpdate<PackageRow>("packages", id, { ...payload });
}

export async function deletePackage(id: string): Promise<boolean> {
  return dbDelete("packages", id);
}
