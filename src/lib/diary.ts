import { db, type DiaryAttachment, type DiaryEntry } from "@/lib/db";

const PIN_KEY = "diary.pinHash";

/** SHA-256 hex — the raw PIN is never stored. */
export async function hashPin(pin: string): Promise<string> {
  const bytes = new TextEncoder().encode(`mos-jb:${pin}`);
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

export async function getPinHash(): Promise<string | null> {
  const row = await db.settings.get(PIN_KEY);
  return (row?.value as string | undefined) ?? null;
}

export async function setPin(pin: string): Promise<void> {
  await db.settings.put({ key: PIN_KEY, value: await hashPin(pin) });
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

export async function addEntry(input: {
  text: string;
  images: Blob[];
  voiceNotes: Blob[];
  attachments: DiaryAttachment[];
  tags: string[];
  sticker: string | null;
}): Promise<void> {
  await db.diaryEntries.add({ ...input, timestamp: Date.now() } as DiaryEntry);
}

export async function removeEntry(id: number): Promise<void> {
  await db.diaryEntries.delete(id);
}

/** Wipe every JB entry and the stored PIN hash. */
export async function clearDiaryData(): Promise<void> {
  await db.diaryEntries.clear();
  await db.settings.delete(PIN_KEY);
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
