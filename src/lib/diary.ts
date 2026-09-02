import { supabase } from "@/lib/supabase";
import { type DiaryAttachment } from "@/lib/db";

/** SHA-256 hex — the raw PIN is never stored. */
export async function hashPin(pin: string): Promise<string> {
  const bytes = new TextEncoder().encode(`mos-jb:${pin}`);
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

/** Stores PIN hash in Supabase user metadata (never the raw PIN). */
export async function getPinHash(): Promise<string | null> {
  const { data: { user } } = await supabase.auth.getUser();
  return (user?.user_metadata?.["diary_pin_hash"] as string | undefined) ?? null;
}

export async function setPin(pin: string): Promise<void> {
  const hash = await hashPin(pin);
  await supabase.auth.updateUser({ data: { diary_pin_hash: hash } });
}

export async function verifyPin(pin: string): Promise<boolean> {
  const stored = await getPinHash();
  if (!stored) return false;
  return (await hashPin(pin)) === stored;
}

export function isValidPin(pin: string): boolean {
  return /^\d{4,6}$/.test(pin);
}

/* JB re-locks on every navigation — no persisted unlock state. */

export const STICKERS = [
  "🌸",
  "🌙",
  "⭐",
  "☁️",
  "🔥",
  "🌊",
  "🍃",
  "☕",
  "🎧",
  "💤",
  "🛰️",
  "💗",
] as const;

/** Uploads a blob to Supabase Storage, returns the storage path. */
async function uploadBlob(blob: Blob, folder: string, filename: string, userId: string): Promise<string> {
  const path = `${userId}/${folder}/${filename}`;
  const { error } = await supabase.storage.from("diary-media").upload(path, blob, { upsert: true });
  if (error) throw error;
  return path;
}

export async function addEntry(input: {
  text: string;
  images: Blob[];
  voiceNotes: Blob[];
  attachments: DiaryAttachment[];
  tags: string[];
  sticker: string | null;
}): Promise<void> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");
  const ts = Date.now();
  const prefix = ts.toString();

  const imagePaths = await Promise.all(
    input.images.map((b, i) => uploadBlob(b, `images/${prefix}`, `img_${i}.${b.type.split("/")[1] ?? "bin"}`, user.id))
  );
  const voicePaths = await Promise.all(
    input.voiceNotes.map((b, i) => uploadBlob(b, `voice/${prefix}`, `voice_${i}.${b.type.split("/")[1] ?? "webm"}`, user.id))
  );
  const attachmentMeta = await Promise.all(
    input.attachments.map(async (a, i) => {
      const path = await uploadBlob(a.blob, `files/${prefix}`, a.filename || `file_${i}`, user.id);
      return { filename: a.filename, path, mime_type: a.blob.type };
    })
  );

  const { error } = await supabase.from("diary_entries").insert([{
    user_id: user.id,
    timestamp: ts,
    text: input.text,
    image_paths: imagePaths,
    voice_paths: voicePaths,
    attachment_meta: attachmentMeta,
    tags: input.tags,
    sticker: input.sticker,
  }]);
  if (error) throw error;
}

export async function removeEntry(id: string): Promise<void> {
  // Delete the row — storage files are left (orphan cleanup can be done separately)
  const { error } = await supabase.from("diary_entries").delete().eq("id", id);
  if (error) throw error;
}

/** Wipe every JB entry and the stored PIN hash. */
export async function clearDiaryData(): Promise<void> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;
  await supabase.from("diary_entries").delete().eq("user_id", user.id);
  await supabase.auth.updateUser({ data: { diary_pin_hash: null } });
}

export function parseTags(raw: string): string[] {
  return raw
    .split(",")
    .map((t) => t.trim().replace(/^#/, ""))
    .filter(Boolean);
}

export function entryDate(ts: number): string {
  return new Date(ts).toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export function preview(text: string, max = 120): string {
  const clean = text.replace(/\s+/g, " ").trim();
  return clean.length > max ? `${clean.slice(0, max)}…` : clean;
}
