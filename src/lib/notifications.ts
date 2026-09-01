import { db } from "@/lib/db";
import { toISODate } from "@/lib/period";
import { activeDeadlines, dueLabel, formatTime, todaysClasses } from "@/lib/schedule";
import { toast } from "sonner";

/**
 * Local-only notification state. Everything lives in the existing settings table
 * so it survives reloads without any backend.
 */
export const NOTIF_ENABLED = "notifications.enabled";
export const DIGEST_TIME = "notifications.digestTime";
export const LAST_DIGEST_DATE = "notifications.lastDigestDate";
export const NOTIFIED_DUE = "notifications.notifiedDue"; // legacy key kept for compat
export const NOTIFIED_OVERDUE = "notifications.notifiedOverdue"; // number[]
const NOTIFIED_NUDGES_DATE = "notifications.notifiedNudgesDate";
const NOTIFIED_NUDGES = "notifications.notifiedNudges"; // { [deadlineId]: string[] }

export const QUIET_START = "notifications.quietStart";
export const QUIET_END = "notifications.quietEnd";

export const DEFAULT_DIGEST_TIME = "07:30";
export const DEFAULT_QUIET_START = "23:00";
export const DEFAULT_QUIET_END = "07:00";

async function get<T>(key: string, fallback: T): Promise<T> {
  const row = await db.settings.get(key);
  return row === undefined ? fallback : (row.value as T);
}

async function set(key: string, value: unknown): Promise<void> {
  await db.settings.put({ key, value });
}

export const getNotifEnabled = () => get<boolean>(NOTIF_ENABLED, false);
export const setNotifEnabled = (v: boolean) => set(NOTIF_ENABLED, v);
export const getDigestTime = () => get<string>(DIGEST_TIME, DEFAULT_DIGEST_TIME);
export const setDigestTime = (v: string) => set(DIGEST_TIME, v);
export const getQuietStart = () => get<string>(QUIET_START, DEFAULT_QUIET_START);
export const setQuietStart = (v: string) => set(QUIET_START, v);
export const getQuietEnd = () => get<string>(QUIET_END, DEFAULT_QUIET_END);
export const setQuietEnd = (v: string) => set(QUIET_END, v);

function minutes(hhmm: string): number {
  const [h, m] = hhmm.split(":").map(Number);
  return (h ?? 0) * 60 + (m ?? 0);
}

/** True when `now` falls inside the quiet window (supports windows crossing midnight). */
export function isQuietNow(start: string, end: string, now = new Date()): boolean {
  const cur = now.getHours() * 60 + now.getMinutes();
  const s = minutes(start);
  const e = minutes(end);
  if (s === e) return false;
  return s < e ? cur >= s && cur < e : cur >= s || cur < e;
}

export function permissionState(): NotificationPermission | "unsupported" {
  if (typeof window === "undefined" || !("Notification" in window)) return "unsupported";
  return Notification.permission;
}

/** Ask the browser for permission; returns true when granted. */
export async function requestPermission(): Promise<boolean> {
  if (permissionState() === "unsupported") return false;
  if (Notification.permission === "granted") return true;
  const result = await Notification.requestPermission();
  return result === "granted";
}

/** Fire a browser OS notification. */
function showBrowser(title: string, body: string) {
  try {
    new Notification(title, { body, tag: "mos-nudge" });
  } catch {
    /* notification blocked */
  }
}

/** Fire an in-app sonner toast for a deadline nudge. */
function showToast(label: string, title: string, timeStr: string | null, isOverdueFlag = false) {
  const description = timeStr ? `at ${timeStr}` : undefined;
  if (isOverdueFlag) {
    toast.error(`${label}: ${title}`, { description, duration: 8000 });
  } else if (label === "Due in 5 mins" || label === "Due now") {
    toast.warning(`${label}: ${title}`, { description, duration: 8000 });
  } else {
    toast(`${label}: ${title}`, { description, duration: 6000 });
  }
}

/** Small marker so important/extra classes stand out in plain-text notifications. */
function marker(importance: string): string {
  if (importance === "important") return "★ ";
  if (importance === "extra") return "◆ ";
  return "• ";
}

function timeReached(hhmm: string, now = new Date()): boolean {
  const [h, m] = hhmm.split(":").map(Number);
  const target = new Date(now);
  target.setHours(h ?? 0, m ?? 0, 0, 0);
  return now.getTime() >= target.getTime();
}

/**
 * Runs on load/foreground/timer: morning digest + deadline nudges + newly overdue.
 * Browser OS notifications + in-app sonner toasts both fire.
 */
export async function runNotificationChecks(): Promise<void> {
  const osEnabled = await getNotifEnabled();

  // Quiet hours: skip entirely and leave everything marked as not-yet-sent.
  if (isQuietNow(await getQuietStart(), await getQuietEnd())) return;

  const today = toISODate();
  const browserSections: string[] = [];

  // --- Morning digest ---
  const digestTime = await getDigestTime();
  const lastDigest = await get<string | null>(LAST_DIGEST_DATE, null);
  let digestFired = false;
  if (lastDigest !== today && timeReached(digestTime)) {
    const classes = todaysClasses(await db.classes.toArray());
    if (classes.length > 0) {
      browserSections.push(
        classes
          .map((c) => `${marker(c.importance)}${formatTime(c.startTime)} ${c.subject}`)
          .join("\n"),
      );
      digestFired = true;
    }
  }

  // --- Deadline nudge tracking ---
  const deadlines = activeDeadlines(await db.deadlines.toArray());
  const notifiedOverdue = await get<string[]>(NOTIFIED_OVERDUE, []);

  let nudgesDate = await get<string | null>(NOTIFIED_NUDGES_DATE, null);
  let nudges = await get<Record<string, string[]>>(NOTIFIED_NUDGES, {});

  // Reset nudge tracking each new day
  if (nudgesDate !== today) {
    nudges = {};
    nudgesDate = today;
  }

  // Newly overdue (past due date, fire once ever)
  const newlyOverdue = deadlines.filter(
    (d) => d.dueDate < today && !notifiedOverdue.includes(String(d.id)),
  );
  if (newlyOverdue.length > 0) {
    browserSections.push(newlyOverdue.map((d) => `Overdue: ${d.title} (${dueLabel(d)})`).join("\n"));
    for (const d of newlyOverdue) {
      showToast("Overdue", d.title, d.dueTime, true);
    }
  }

  // Deadlines due today — granular nudges
  const dueToday = deadlines.filter((d) => d.dueDate === today);
  const now = new Date();
  const currentMinutes = now.getHours() * 60 + now.getMinutes();

  let nudgesChanged = false;

  for (const d of dueToday) {
    const dNudges = nudges[d.id] ?? [];
    let fireNudge: string | null = null;
    let label = "";

    if (d.dueTime) {
      // Timed deadline: 30m, 5m, and at-time nudges
      const targetMins = minutes(d.dueTime);
      const diff = targetMins - currentMinutes;

      if (diff <= 30 && diff > 5 && !dNudges.includes("-30m")) {
        fireNudge = "-30m";
        label = "Due in 30 mins";
      } else if (diff <= 5 && diff > 0 && !dNudges.includes("-5m")) {
        fireNudge = "-5m";
        label = "Due in 5 mins";
      } else if (diff <= 0 && !dNudges.includes("0m")) {
        fireNudge = "0m";
        label = "Due now";
      }
    } else {
      // Untimed deadline: nudge at 09:00, 13:00, 18:00, 21:00
      const times = [
        { id: "09:00", m: minutes("09:00") },
        { id: "13:00", m: minutes("13:00") },
        { id: "18:00", m: minutes("18:00") },
        { id: "21:00", m: minutes("21:00") },
      ];
      for (const t of times) {
        if (currentMinutes >= t.m && !dNudges.includes(t.id)) {
          fireNudge = t.id;
          label = "Reminder";
        }
      }
    }

    if (fireNudge) {
      const line = `${label}: ${d.title}${d.dueTime ? ` at ${d.dueTime}` : ""}`;
      browserSections.push(line);
      showToast(label, d.title, d.dueTime);
      nudges[d.id] = [...dNudges, fireNudge];
      nudgesChanged = true;
    }
  }

  // Fire combined OS browser notification if we have anything (and it's enabled)
  if (browserSections.length > 0 && osEnabled && permissionState() === "granted") {
    showBrowser(`MOS — ${today}`, browserSections.join("\n\n"));
  }

  // Persist state
  if (digestFired) await set(LAST_DIGEST_DATE, today);
  if (newlyOverdue.length > 0) {
    await set(NOTIFIED_OVERDUE, [...notifiedOverdue, ...newlyOverdue.map((d) => d.id)]);
  }
  if (nudgesChanged) {
    await set(NOTIFIED_NUDGES_DATE, today);
    await set(NOTIFIED_NUDGES, nudges);
  }
}
