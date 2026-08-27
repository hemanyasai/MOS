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
import { db, type MetricCategory, type MetricEntry, type MetricType } from "@/lib/db";
import { toISODate } from "@/lib/period";

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
    const count = await db.metricCategories.count();
    if (count > 0) return;
    const now = Date.now();
    await db.metricCategories.bulkAdd(
      DEFAULTS.map((d, i) => ({ ...d, createdAt: now + i }) as MetricCategory),
    );
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
  await db.metricCategories.add({ ...input, archived: false, createdAt: Date.now() } as MetricCategory);
}

/** Soft delete: entries are always kept. */
export async function setArchived(id: number, archived: boolean): Promise<void> {
  await db.metricCategories.update(id, { archived });
}

export async function logEntry(
  categoryId: number,
  value: number,
  text: string | null = null,
): Promise<void> {
  await db.metricEntries.add({
    categoryId,
    date: toISODate(),
    value,
    text,
    createdAt: Date.now(),
  } as MetricEntry);
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
