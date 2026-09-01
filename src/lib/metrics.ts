import {
  Activity,
  BookOpen,
  Brain,
  Clock,
  Droplets,
  Dumbbell,
  Footprints,
  Heart,
  Leaf,
  Moon,
  Music,
  PenLine,
  Star,
  type LucideIcon,
} from "lucide-react";
import { toISODate } from "@/lib/period";
import { supabase } from "@/lib/supabase";
import { type MetricCategory, type MetricEntry, type MetricType } from "@/lib/db";

async function getUserId() {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");
  return user.id;
}

export const METRIC_ICONS: Record<string, LucideIcon> = {
  clock: Clock,
  droplets: Droplets,
  footprints: Footprints,
  book: BookOpen,
  brain: Brain,
  dumbbell: Dumbbell,
  heart: Heart,
  leaf: Leaf,
  moon: Moon,
  music: Music,
  pen: PenLine,
  star: Star,
  activity: Activity,
};

export function metricIcon(key: string): LucideIcon {
  return METRIC_ICONS[key] ?? Star;
}

export const METRIC_TYPES: MetricType[] = ["counter", "duration", "text_log"];

const DEFAULTS: Array<Omit<MetricCategory, "id" | "createdAt">> = [
  {
    name: "Study/Work Hours",
    icon: "clock",
    type: "duration",
    unit: "hours",
    dailyGoal: 240,
    archived: false,
  },
  {
    name: "Water Intake",
    icon: "droplets",
    type: "counter",
    unit: "glasses",
    dailyGoal: 8,
    archived: false,
  },
  {
    name: "Steps",
    icon: "footprints",
    type: "counter",
    unit: "steps",
    dailyGoal: 6000,
    archived: false,
  },
];

let seeding: Promise<void> | null = null;

/** Seeds the three default categories once, on first run. */
export function ensureDefaultCategories(): Promise<void> {
  seeding ??= (async () => {
    try {
      const user_id = await getUserId();
      const { count } = await supabase.from("metric_categories").select("*", { count: "exact", head: true });
      if (count && count > 0) return;
      
      const now = Date.now();
      await supabase.from("metric_categories").insert(
        DEFAULTS.map((d, i) => ({
          user_id,
          name: d.name,
          icon: d.icon,
          type: d.type,
          unit: d.unit,
          daily_goal: d.dailyGoal,
          archived: d.archived,
          created_at: now + i
        }))
      );
    } catch (err) {
      console.warn("Failed to ensure default categories", err);
    }
  })();
  return seeding;
}

export async function addCategory(input: {
  name: string;
  icon: string;
  type: MetricType;
  unit: string;
  dailyGoal: number | null;
}): Promise<void> {
  const user_id = await getUserId();
  await supabase.from("metric_categories").insert([{
    user_id,
    name: input.name,
    icon: input.icon,
    type: input.type,
    unit: input.unit,
    daily_goal: input.dailyGoal,
    archived: false,
    created_at: Date.now()
  }]);
}

/** Soft delete: entries are always kept. */
export async function setArchived(id: string, archived: boolean): Promise<void> {
  await supabase.from("metric_categories").update({ archived }).eq("id", id);
}

export async function logEntry(
  categoryId: string,
  value: number,
  text: string | null = null,
): Promise<void> {
  const user_id = await getUserId();
  await supabase.from("metric_entries").insert([{
    user_id,
    category_id: categoryId,
    date: toISODate(),
    value,
    text,
    created_at: Date.now()
  }]);
}

export function dayTotal(entries: MetricEntry[]): number {
  return entries.reduce((sum, e) => sum + (e.value || 0), 0);
}

export function formatValue(type: MetricType, value: number, unit: string): string {
  if (type === "duration") {
    const h = Math.floor(value / 60);
    const m = Math.round(value % 60);
    return h > 0 ? `${h}h ${m}m` : `${m}m`;
  }
  return `${Math.round(value * 100) / 100} ${unit}`.trim();
}
