/**
 * MOS Data Export Utilities
 * Exports data from Supabase as a ZIP file.
 */

import JSZip from "jszip";
import { supabase } from "./supabase";

function triggerDownload(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

function pad(n: number) {
  return String(n).padStart(2, "0");
}

function formatTs(ts: number) {
  const d = new Date(ts);
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}_${pad(d.getHours())}-${pad(d.getMinutes())}`;
}

async function downloadStorageFile(path: string): Promise<Blob | null> {
  const { data, error } = await supabase.storage.from("diary-media").download(path);
  if (error) {
    console.warn("Could not download", path, error);
    return null;
  }
  return data;
}

async function getUserId(): Promise<string> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");
  return user.id;
}

/** Export the entire JB (diary) — text + all media — as a ZIP */
export async function exportDiary() {
  const { data: entries, error } = await supabase
    .from("diary_entries")
    .select("*")
    .order("timestamp", { ascending: false });
  if (error) throw error;
  if (!entries?.length) throw new Error("No diary entries to export.");

  const zip = new JSZip();
  const manifest: object[] = [];

  for (const entry of entries) {
    const label = formatTs(entry.timestamp);
    const folder = zip.folder(label)!;

    let text = entry.text || "";
    if (entry.tags?.length) text += `\n\nTags: ${entry.tags.join(", ")}`;
    if (entry.sticker) text += `\nSticker: ${entry.sticker}`;
    folder.file("entry.txt", text);

    const imageFolder = folder.folder("images")!;
    for (let i = 0; i < (entry.image_paths?.length ?? 0); i++) {
      const blob = await downloadStorageFile(entry.image_paths[i]);
      if (blob) imageFolder.file(`image_${i + 1}`, blob);
    }

    const voiceFolder = folder.folder("voice_notes")!;
    for (let i = 0; i < (entry.voice_paths?.length ?? 0); i++) {
      const blob = await downloadStorageFile(entry.voice_paths[i]);
      if (blob) voiceFolder.file(`voice_${i + 1}`, blob);
    }

    const attachFolder = folder.folder("files")!;
    for (const meta of (entry.attachment_meta ?? [])) {
      const blob = await downloadStorageFile(meta.path);
      if (blob) attachFolder.file(meta.filename || meta.path.split("/").pop()!, blob);
    }

    manifest.push({
      id: entry.id,
      timestamp: entry.timestamp,
      date: label,
      imageCount: entry.image_paths?.length ?? 0,
      voiceNoteCount: entry.voice_paths?.length ?? 0,
      attachmentCount: entry.attachment_meta?.length ?? 0,
      tags: entry.tags ?? [],
      sticker: entry.sticker ?? null,
    });
  }

  zip.file("manifest.json", JSON.stringify(manifest, null, 2));
  const blob = await zip.generateAsync({ type: "blob", compression: "DEFLATE" });
  triggerDownload(blob, `MOS_JB_${formatTs(Date.now())}.zip`);
}

/** Export all structured data as JSON */
export async function exportEverything() {
  const [
    { data: notes },
    { data: cycles },
    { data: cycleDays },
    { data: metricCategories },
    { data: metricEntries },
    { data: classes },
    { data: deadlines },
    { data: pendingEvents },
    { data: holidays },
    { data: entries },
  ] = await Promise.all([
    supabase.from("notes").select("*"),
    supabase.from("cycles").select("*"),
    supabase.from("cycle_days").select("*"),
    supabase.from("metric_categories").select("*"),
    supabase.from("metric_entries").select("*"),
    supabase.from("classes").select("*"),
    supabase.from("deadlines").select("*"),
    supabase.from("pending_events").select("*"),
    supabase.from("holidays").select("*"),
    supabase.from("diary_entries").select("*").order("timestamp", { ascending: false }),
  ]);

  const zip = new JSZip();

  zip.file("brain_dump/notes.json", JSON.stringify(notes ?? [], null, 2));
  zip.file("period/cycles.json", JSON.stringify(cycles ?? [], null, 2));
  zip.file("period/cycle_days.json", JSON.stringify(cycleDays ?? [], null, 2));
  zip.file("metrics/categories.json", JSON.stringify(metricCategories ?? [], null, 2));
  zip.file("metrics/entries.json", JSON.stringify(metricEntries ?? [], null, 2));
  zip.file("schedule/classes.json", JSON.stringify(classes ?? [], null, 2));
  zip.file("schedule/deadlines.json", JSON.stringify(deadlines ?? [], null, 2));
  zip.file("schedule/pending_events.json", JSON.stringify(pendingEvents ?? [], null, 2));
  zip.file("schedule/holidays.json", JSON.stringify(holidays ?? [], null, 2));

  // Diary with all blobs from Supabase Storage
  const diaryFolder = zip.folder("jb")!;
  const manifest: object[] = [];
  for (const entry of (entries ?? [])) {
    const label = formatTs(entry.timestamp);
    const folder = diaryFolder.folder(label)!;
    let text = entry.text || "";
    if (entry.tags?.length) text += `\n\nTags: ${entry.tags.join(", ")}`;
    if (entry.sticker) text += `\nSticker: ${entry.sticker}`;
    folder.file("entry.txt", text);
    for (let i = 0; i < (entry.image_paths?.length ?? 0); i++) {
      const blob = await downloadStorageFile(entry.image_paths[i]);
      if (blob) folder.folder("images")!.file(`image_${i + 1}`, blob);
    }
    for (let i = 0; i < (entry.voice_paths?.length ?? 0); i++) {
      const blob = await downloadStorageFile(entry.voice_paths[i]);
      if (blob) folder.folder("voice_notes")!.file(`voice_${i + 1}`, blob);
    }
    for (const meta of (entry.attachment_meta ?? [])) {
      const blob = await downloadStorageFile(meta.path);
      if (blob) folder.folder("files")!.file(meta.filename || meta.path.split("/").pop()!, blob);
    }
    manifest.push({ id: entry.id, timestamp: entry.timestamp, date: label, tags: entry.tags, sticker: entry.sticker });
  }
  diaryFolder.file("manifest.json", JSON.stringify(manifest, null, 2));

  zip.file(
    "README.txt",
    `MOS Full Data Export
Generated: ${new Date().toISOString()}

Folders:
  jb/                — JB diary entries (text + images + voice notes + files)
  brain_dump/        — Brain dump notes
  period/            — Period tracker cycles and days
  metrics/           — Tracked metrics and entries
  schedule/          — Classes, deadlines, pending events, holidays
`
  );

  const blob = await zip.generateAsync({ type: "blob", compression: "DEFLATE" });
  triggerDownload(blob, `MOS_Full_Export_${formatTs(Date.now())}.zip`);
}

/** Export just the brain dump notes as a text file */
export async function exportNotes() {
  const { data: notes, error } = await supabase.from("notes").select("*").order("created_at", { ascending: false });
  if (error) throw error;
  if (!notes?.length) throw new Error("No notes to export.");

  const text = notes
    .map((n) => `[${formatTs(n.created_at)}]\n${n.body}`)
    .join("\n\n---\n\n");

  const blob = new Blob([text], { type: "text/plain" });
  triggerDownload(blob, `MOS_BrainDump_${formatTs(Date.now())}.txt`);
}

/** Export schedule data as JSON */
export async function exportSchedule() {
  const [{ data: classes }, { data: deadlines }, { data: pendingEvents }, { data: holidays }] = await Promise.all([
    supabase.from("classes").select("*"),
    supabase.from("deadlines").select("*"),
    supabase.from("pending_events").select("*"),
    supabase.from("holidays").select("*"),
  ]);

  const zip = new JSZip();
  zip.file("classes.json", JSON.stringify(classes ?? [], null, 2));
  zip.file("deadlines.json", JSON.stringify(deadlines ?? [], null, 2));
  zip.file("pending_events.json", JSON.stringify(pendingEvents ?? [], null, 2));
  zip.file("holidays.json", JSON.stringify(holidays ?? [], null, 2));

  const blob = await zip.generateAsync({ type: "blob", compression: "DEFLATE" });
  triggerDownload(blob, `MOS_Schedule_${formatTs(Date.now())}.zip`);
}

/** Export metrics as JSON */
export async function exportMetrics() {
  const [{ data: categories }, { data: entries }] = await Promise.all([
    supabase.from("metric_categories").select("*"),
    supabase.from("metric_entries").select("*"),
  ]);

  const zip = new JSZip();
  zip.file("categories.json", JSON.stringify(categories ?? [], null, 2));
  zip.file("entries.json", JSON.stringify(entries ?? [], null, 2));

  const blob = await zip.generateAsync({ type: "blob", compression: "DEFLATE" });
  triggerDownload(blob, `MOS_Metrics_${formatTs(Date.now())}.zip`);
}

/** Export period data as JSON */
export async function exportPeriod() {
  const [{ data: cycles }, { data: cycleDays }] = await Promise.all([
    supabase.from("cycles").select("*"),
    supabase.from("cycle_days").select("*"),
  ]);

  const data = { cycles: cycles ?? [], cycleDays: cycleDays ?? [], exportedAt: new Date().toISOString() };
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
  triggerDownload(blob, `MOS_Period_${formatTs(Date.now())}.json`);
}
