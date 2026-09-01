import { supabase } from "@/lib/supabase";
import { type Cycle, type CycleDay, type Flow, type Symptom } from "@/lib/db";

async function getUserId() {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");
  return user.id;
}

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
  const user_id = await getUserId();
  const { data, error } = await supabase
    .from("cycles")
    .select("*")
    .eq("user_id", user_id)
    .is("end_date", null)
    .order("start_date", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error) throw error;
  if (!data) return undefined;
  return {
    id: data.id,
    startDate: data.start_date,
    endDate: data.end_date,
    lengthDays: data.length_days,
    createdAt: data.created_at
  } as Cycle;
}

export async function startPeriodToday(): Promise<void> {
  const active = await getActiveCycle();
  if (active) return;
  const user_id = await getUserId();
  await supabase.from("cycles").insert([{
    user_id,
    start_date: toISODate(),
    end_date: null,
    length_days: null,
    created_at: Date.now()
  }]);
}

export async function endPeriodToday(): Promise<void> {
  const active = await getActiveCycle();
  if (!active) return;
  const endDate = toISODate();
  await supabase.from("cycles").update({
    end_date: endDate,
    length_days: daysBetween(active.startDate, endDate) + 1
  }).eq("id", active.id);
}

export async function getDayLog(cycleId: string, date: string): Promise<CycleDay | undefined> {
  const { data, error } = await supabase
    .from("cycle_days")
    .select("*")
    .eq("cycle_id", cycleId)
    .eq("date", date)
    .maybeSingle();
  if (error) throw error;
  if (!data) return undefined;
  return {
    id: data.id,
    cycleId: data.cycle_id,
    date: data.date,
    flow: data.flow as Flow,
    symptoms: data.symptoms as Symptom[],
    createdAt: data.created_at
  } as CycleDay;
}

export async function setDayLog(
  cycleId: string,
  date: string,
  patch: { flow?: Flow | null; symptoms?: Symptom[] },
): Promise<void> {
  const existing = await getDayLog(cycleId, date);
  const user_id = await getUserId();
  if (existing) {
    const updatePayload: any = {};
    if (patch.flow !== undefined) updatePayload.flow = patch.flow;
    if (patch.symptoms !== undefined) updatePayload.symptoms = patch.symptoms;
    await supabase.from("cycle_days").update(updatePayload).eq("id", existing.id);
  } else {
    await supabase.from("cycle_days").insert([{
      user_id,
      cycle_id: cycleId,
      date,
      flow: patch.flow ?? null,
      symptoms: patch.symptoms ?? [],
      created_at: Date.now()
    }]);
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
