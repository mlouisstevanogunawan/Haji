import { createClient } from "@/lib/supabase/client";
import { Database } from "@/types/supabase.types";

export type AnnouncementRow = Database["public"]["Tables"]["announcements"]["Row"];
export type AnnouncementInsert = Database["public"]["Tables"]["announcements"]["Insert"];
export type AnnouncementUpdate = Database["public"]["Tables"]["announcements"]["Update"];
export type AnnouncementAudience = Database["public"]["Enums"]["announcement_audience"];

export async function getAnnouncements(audience?: AnnouncementAudience): Promise<AnnouncementRow[]> {
  const supabase = createClient();
  let query = supabase
    .from("announcements")
    .select("*")
    .order("created_at", { ascending: false });

  if (audience && audience !== "all") {
    query = query.or(`target_audience.eq.${audience},target_audience.eq.all`);
  }

  const { data, error } = await query;

  if (error) {
    console.error("Error fetching announcements from Supabase:", error.message);
    throw new Error(error.message);
  }

  return data || [];
}

export async function getAnnouncementById(id: string): Promise<AnnouncementRow | null> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("announcements")
    .select("*")
    .eq("id", id)
    .single();

  if (error) {
    console.error("Error fetching announcement by id:", error.message);
    return null;
  }

  return data;
}

export async function createAnnouncement(payload: AnnouncementInsert): Promise<AnnouncementRow> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("announcements")
    .insert([payload])
    .select()
    .single();

  if (error) {
    console.error("Error creating announcement:", error.message);
    throw new Error(error.message);
  }

  return data;
}

export async function updateAnnouncement(id: string, payload: AnnouncementUpdate): Promise<AnnouncementRow> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("announcements")
    .update(payload)
    .eq("id", id)
    .select()
    .single();

  if (error) {
    console.error("Error updating announcement:", error.message);
    throw new Error(error.message);
  }

  return data;
}

export async function deleteAnnouncement(id: string): Promise<boolean> {
  const supabase = createClient();
  const { error } = await supabase.from("announcements").delete().eq("id", id);

  if (error) {
    console.error("Error deleting announcement:", error.message);
    throw new Error(error.message);
  }

  return true;
}
