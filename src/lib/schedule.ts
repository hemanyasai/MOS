import {
  db,
  type ClassImportance,
  type ClassItem,
  type Deadline,
  type DeadlineImportance,
  type Holiday,
  type PendingEvent,
} from "@/lib/db";
import { fromISODate, toISODate } from "@/lib/period";


export const DAY_NAMES = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
] as const;

export const DAY_SHORT = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"] as const;

export const CLASS_IMPORTANCE: ClassImportance[] = ["normal", "important", "extra"];
export const DEADLINE_IMPORTANCE: DeadlineImportance[] = ["normal", "important"];

/** Colour communicates, not size: small accents only. */
export function accentColor(kind: ClassImportance | DeadlineImportance | "overdue"): string {
  switch (kind) {
    case "important":
      return "var(--primary)";
    case "extra":
      return "var(--accent)";
    case "overdue":
      return "var(--destructive)";
    default:
      return "var(--glass-border)";
  }
}

export function formatTime(hhmm: string): string {
  const [h, m] = hhmm.split(":").map(Number);
  if (!Number.isFinite(h)) return hhmm;
  const d = new Date();
  d.setHours(h ?? 0, m ?? 0, 0, 0);
  return d.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" });
}

export function byTime(a: ClassItem, b: ClassItem): number {
  return a.startTime.localeCompare(b.startTime);
}

export async function addClass(input: {
  subject: string;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  location: string | null;
  importance: ClassImportance;
}): Promise<void> {
  await db.classes.add({ ...input, createdAt: Date.now() } as ClassItem);
}

export async function removeClass(id: number): Promise<void> {
  await db.classes.delete(id);
}

export async function addDeadline(input: {
  title: string;
  dueDate: string;
  dueTime: string | null;
  category: string | null;
  importance: DeadlineImportance;
}): Promise<void> {
  await db.deadlines.add({ ...input, doneAt: null, createdAt: Date.now() } as Deadline);
}

/** Archive out of the active list; history is never deleted. */
export async function markDeadlineDone(id: number, done = true): Promise<void> {
  await db.deadlines.update(id, { doneAt: done ? Date.now() : null });
}

export async function addPendingEvent(input: { title: string; note: string | null }): Promise<void> {
  await db.pendingEvents.add({
    ...input,
    status: "date unknown",
    date: null,
    createdAt: Date.now(),
  } as PendingEvent);
}

export async function confirmPendingDate(id: number, date: string): Promise<void> {
  await db.pendingEvents.update(id, { date, status: "date confirmed" });
}

export async function unconfirmPendingDate(id: number): Promise<void> {
  await db.pendingEvents.update(id, { date: null, status: "date unknown" });
}

export async function removePendingEvent(id: number): Promise<void> {
  await db.pendingEvents.delete(id);
}

export function isOverdue(d: Deadline, todayIso = toISODate()): boolean {
  if (d.doneAt !== null) return false;
  if (d.dueDate < todayIso) return true;
  // Same day: overdue only if a specific time was set and it's already passed
  if (d.dueDate === todayIso && d.dueTime) {
    const [h, m] = d.dueTime.split(":").map(Number);
    const due = new Date();
    due.setHours(h ?? 0, m ?? 0, 0, 0);
    return new Date() > due;
  }
  return false;
}

export function sortDeadlines(list: Deadline[]): Deadline[] {
  return [...list].sort((a, b) =>
    a.dueDate === b.dueDate
      ? (a.dueTime ?? "99:99").localeCompare(b.dueTime ?? "99:99")
      : a.dueDate.localeCompare(b.dueDate),
  );
}

export function activeDeadlines(list: Deadline[]): Deadline[] {
  return sortDeadlines(list.filter((d) => d.doneAt === null));
}

export function todaysClasses(list: ClassItem[], date = new Date()): ClassItem[] {
  return list.filter((c) => c.dayOfWeek === date.getDay()).sort(byTime);
}

export function dueLabel(d: Deadline): string {
  const date = fromISODate(d.dueDate).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
  });
  return d.dueTime ? `${date} · ${formatTime(d.dueTime)}` : date;
}

export type DayMarker = { kind: "class" | "deadline" | "event" | "holiday"; label: string };

export async function addHoliday(input: { title: string; date: string }): Promise<void> {
  await db.holidays.add({ ...input, createdAt: Date.now() } as Holiday);
}

export async function updateHoliday(
  id: number,
  patch: Partial<Pick<Holiday, "title" | "date">>,
): Promise<void> {
  await db.holidays.update(id, patch);
}

export async function removeHoliday(id: number): Promise<void> {
  await db.holidays.delete(id);
}

/** All markers for a given ISO date, used by the Almanac dots. */
export function markersForDate(
  iso: string,
  classes: ClassItem[],
  deadlines: Deadline[],
  events: PendingEvent[],
  holidays: Holiday[] = [],
): DayMarker[] {
  const dow = fromISODate(iso).getDay();
  const out: DayMarker[] = [];
  for (const h of holidays.filter((h) => h.date === iso)) {
    out.push({ kind: "holiday", label: h.title });
  }
  for (const c of classes.filter((c) => c.dayOfWeek === dow).sort(byTime)) {
    out.push({ kind: "class", label: `${formatTime(c.startTime)} ${c.subject}` });
  }
  for (const d of sortDeadlines(deadlines.filter((d) => d.dueDate === iso))) {
    out.push({ kind: "deadline", label: `${d.title}${d.doneAt ? " (done)" : ""}` });
  }
  for (const e of events.filter((e) => e.status === "date confirmed" && e.date === iso)) {
    out.push({ kind: "event", label: e.title });
  }
  return out;
}

