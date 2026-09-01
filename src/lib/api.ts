import { supabase } from "./supabase";

export async function getNotes() {
  const { data, error } = await supabase.from("notes").select("*").order("created_at", { ascending: false });
  if (error) throw error;
  return data;
}

export async function addNote(body: string) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");
  const { error } = await supabase.from("notes").insert([{ user_id: user.id, body, created_at: Date.now() }]);
  if (error) throw error;
}

export async function deleteNote(id: string) {
  const { error } = await supabase.from("notes").delete().eq("id", id);
  if (error) throw error;
}

export async function getClasses() {
  const { data, error } = await supabase.from("classes").select("*");
  if (error) throw error;
  return data;
}

export async function addClass(classItem: any) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");
  const { error } = await supabase.from("classes").insert([{ ...classItem, user_id: user.id, created_at: Date.now() }]);
  if (error) throw error;
}

export async function deleteClass(id: string) {
  const { error } = await supabase.from("classes").delete().eq("id", id);
  if (error) throw error;
}
