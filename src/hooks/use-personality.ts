import { useEffect, useState } from "react";
import type { MascotExpression } from "@/components/Mascot";
import { db } from "@/lib/db";
import { pickEmptyState, pickLine, type TriggerKey } from "@/lib/personality";
import { usePersonalitySettings } from "@/lib/personality-settings";
import { useTheme } from "@/lib/theme";
import { toISODate, addDays } from "@/lib/period";

/** Returns true if the app currently has any unfinished todos stored locally. */
async function hasUnfinishedTasks(): Promise<boolean> {
  try {
    const table = db.tables.find((t) => t.name === "todos");
    if (!table) return false;
    const rows = (await table.toArray()) as Array<{ done?: boolean; completed?: boolean }>;
    return rows.some((r) => !(r.done ?? r.completed ?? false));
  } catch {
    return false;
  }
}

/** Resolves today's active trigger from local data + time of day. */
async function resolveTrigger(): Promise<TriggerKey> {
  const hour = new Date().getHours();
  if (hour >= 23 || hour < 5) return "late_night";

  try {
    const deadlines = await db.deadlines.toArray();
    const open = deadlines.filter((d) => !d.doneAt);
    const soonCutoff = addDays(toISODate(), 3);
    if (open.some((d) => d.dueDate && d.dueDate <= soonCutoff)) return "exam_or_deadline_soon";
    if (deadlines.length > 0 && open.length === 0) return "all_tasks_completed";
  } catch {
    /* deadlines unavailable */
  }

  return (await hasUnfinishedTasks()) ? "unfinished_tasks" : "morning_default";
}



/** Greeting line + the trigger that produced it + the expression, so the mascot can react in sync. */
export function usePersonalityGreetingState(): { line: string | null; trigger: TriggerKey | null; expression: MascotExpression } {
  const { theme } = useTheme();
  const { slider, sarcasm, chaos } = usePersonalitySettings();
  const [state, setState] = useState<{ line: string | null; trigger: TriggerKey | null; expression: MascotExpression }>({
    line: null,
    trigger: null,
    expression: "idle",
  });

  useEffect(() => {
    let cancelled = false;
    void resolveTrigger().then((trigger) => {
      if (!cancelled) {
        const result = pickLine(trigger, theme, slider, chaos, sarcasm);
        setState({ line: result.line, trigger, expression: result.expression });
      }
    });
    return () => {
      cancelled = true;
    };
  }, [theme, slider, sarcasm, chaos]);

  return state;
}

/** Personality line for the greeting area. Client-only (uses localStorage). */
export function usePersonalityGreeting(): string | null {
  return usePersonalityGreetingState().line;
}

/** Personality line for generic empty states. Client-only. */
export function usePersonalityEmptyState(): string | null {
  const { theme } = useTheme();
  const [line, setLine] = useState<string | null>(null);

  useEffect(() => {
    setLine(pickEmptyState(theme));
  }, [theme]);

  return line;
}
