import { db, type Cycle, type CycleDay, type Flow, type Symptom } from "@/lib/db";

/** ISO yyyy-mm-dd for a local date. */
export function toISODate(d: Date = new Date()): string {
  const y = d.getFullYear();
  const m = `${d.getMonth() + 1}`.padStart(2, "0");
  const day = `${d.getDate()}`.padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function fromISODate(iso: string): Date {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(y!, (m ?? 1) - 1, d ?? 1);
}

export function addDays(iso: string, days: number): string {
  const d = fromISODate(iso);
  d.setDate(d.getDate() + days);
  return toISODate(d);
}

export function daysBetween(a: string, b: string): number {
  return Math.round((fromISODate(b).getTime() - fromISODate(a).getTime()) / 86_400_000);
}

export function formatFriendly(iso: string): string {
  return fromISODate(iso).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
  });
}

export async function getActiveCycle(): Promise<Cycle | undefined> {
  const all = await db.cycles.toArray();
  return all.filter((c) => c.endDate === null).sort((a, b) => (a.startDate < b.startDate ? 1 : -1))[0];
}

export async function startPeriodToday(): Promise<void> {
  const active = await getActiveCycle();
  if (active) return;
  await db.cycles.add({ startDate: toISODate(), endDate: null, lengthDays: null } as Cycle);
}

export async function endPeriodToday(): Promise<void> {
  const active = await getActiveCycle();
  if (!active) return;
  const endDate = toISODate();
  await db.cycles.update(active.id, {
    endDate,
    lengthDays: daysBetween(active.startDate, endDate) + 1,
  });
}

export async function getDayLog(cycleId: number, date: string): Promise<CycleDay | undefined> {
  return db.cycleDays.where({ cycleId, date }).first();
}

export async function setDayLog(
  cycleId: number,
  date: string,
  patch: { flow?: Flow | null; symptoms?: Symptom[] },
): Promise<void> {
  const existing = await getDayLog(cycleId, date);
  if (existing) {
    await db.cycleDays.update(existing.id, patch);
  } else {
    await db.cycleDays.add({
      cycleId,
      date,
      flow: patch.flow ?? null,
      symptoms: patch.symptoms ?? [],
    } as CycleDay);
  }
}

/** Simple average of the gaps between the last 3-6 completed cycle starts. */
export function averageCycleLength(cycles: Cycle[]): number | null {
  const starts = cycles
    .map((c) => c.startDate)
    .sort()
    .slice(-7);
  if (starts.length < 2) return null;
  const gaps: number[] = [];
  for (let i = 1; i < starts.length; i++) gaps.push(daysBetween(starts[i - 1]!, starts[i]!));
  const recent = gaps.slice(-6);
  const usable = recent.filter((g) => g > 10 && g < 90);
  if (usable.length === 0) return null;
  return Math.round(usable.reduce((a, b) => a + b, 0) / usable.length);
}

/** Predicted next start date, or null if there isn't enough history. */
export function predictNextStart(cycles: Cycle[]): string | null {
  const avg = averageCycleLength(cycles);
  if (!avg) return null;
  const lastStart = cycles
    .map((c) => c.startDate)
    .sort()
    .slice(-1)[0];
  if (!lastStart) return null;
  return addDays(lastStart, avg);
}
