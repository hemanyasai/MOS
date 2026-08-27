import type { MascotExpression } from "@/components/Mascot";
import content from "./personality-content.json";
import type { ChaosLevel, SarcasmLevel } from "./personality-settings";
import type { ThemeName } from "./theme";

export type ContentTheme = "light" | "dark";
export type Pool = "low" | "high";
export type TriggerKey = keyof typeof content.triggers;

/** Triggers where sarcasm="none" pins the low pool regardless of the slider. */
const SARCASM_GATED: TriggerKey[] = ["task_overdue", "unfinished_tasks"];

export function contentTheme(theme: ThemeName): ContentTheme {
  return theme === "pastel" ? "light" : "dark";
}

export function poolFor(slider: number): Pool {
  return slider < 50 ? "low" : "high";
}

function goblinExtras(trigger: string, theme: ContentTheme): string[] {
  const bonus = (content.goblin_bonus as Record<string, Record<string, string[]>>)[theme];
  return bonus?.[trigger] ?? [];
}

export function linesFor(trigger: TriggerKey, theme: ContentTheme, pool: Pool, chaos: ChaosLevel) {
  const t = content.triggers[trigger] as any;
  const base = t[theme][pool] as string[];
  if (chaos === "goblin" && pool === "high") return [...base, ...goblinExtras(trigger, theme)];
  return [...base];
}

export function emptyStateLines(theme: ContentTheme): string[] {
  return [...content.empty_states[theme]];
}


/* ---------- shuffle bag ---------- */

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j]!, a[i]!];
  }
  return a;
}

const read = (key: string) => {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as unknown) : null;
  } catch {
    return null;
  }
};

const write = (key: string, value: unknown) => {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* storage unavailable — fall back to plain random */
  }
};

/**
 * Draws a line from a shuffle bag: every line plays once before any repeat,
 * and the same line is never shown twice in a row (even across reshuffles).
 */
export function drawFromBag(bagId: string, lines: string[]): string {
  if (lines.length === 0) return "";
  if (lines.length === 1) return lines[0]!;

  const bagKey = `mos.personality.bag.${bagId}`;
  const lastKey = `mos.personality.last.${bagId}`;
  const last = typeof read(lastKey) === "string" ? (read(lastKey) as string) : null;

  let bag = (read(bagKey) as string[] | null)?.filter((l) => lines.includes(l)) ?? null;
  if (!bag || bag.length === 0) {
    bag = shuffle(lines);
    // avoid an immediate repeat across reshuffles
    if (bag[bag.length - 1] === last && bag.length > 1) {
      const swap = bag.length - 2;
      [bag[bag.length - 1], bag[swap]] = [bag[swap]!, bag[bag.length - 1]!];
    }
  }

  let pick = bag.pop()!;
  if (pick === last && bag.length > 0) {
    const next = bag.pop()!;
    bag.unshift(pick);
    pick = next;
  }

  write(bagKey, bag);
  write(lastKey, pick);
  return pick;
}

export function pickLine(
  trigger: TriggerKey,
  theme: ThemeName,
  slider: number,
  chaos: ChaosLevel = "normal",
  sarcasm: SarcasmLevel = "mild",
): { line: string; expression: MascotExpression } {
  const ct = contentTheme(theme);
  const gated = SARCASM_GATED.includes(trigger) && sarcasm === "none";
  const pool: Pool = gated ? "low" : poolFor(slider);
  const line = drawFromBag(`${trigger}.${ct}.${pool}`, linesFor(trigger, ct, pool, chaos));
  
  let expression = (content.triggers[trigger] as any).expression as MascotExpression;
  if (chaos === "goblin" && goblinExtras(trigger, ct).includes(line)) {
    expression = "goblin" as MascotExpression;
  }
  
  return { line, expression };
}


export function pickEmptyState(theme: ThemeName): string {
  const ct = contentTheme(theme);
  return drawFromBag(`empty_states.${ct}`, emptyStateLines(ct));
}
