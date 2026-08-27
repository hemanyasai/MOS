import { useLiveQuery } from "dexie-react-hooks";
import { db } from "@/lib/db";
import { activeDeadlines, dueLabel, isOverdue, todaysClasses } from "@/lib/schedule";

/** One-line summary of today's classes and the nearest deadline, for Nest/Dock. */
export function ScheduleNote() {
  const classes = useLiveQuery(() => db.classes.toArray(), [], []);
  const deadlines = useLiveQuery(() => db.deadlines.toArray(), [], []);
  const today = todaysClasses(classes ?? []);
  const next = activeDeadlines(deadlines ?? [])[0];

  if (today.length === 0 && !next) return null;

  return (
    <p className="text-xs text-muted-foreground">
      {today.length} class{today.length === 1 ? "" : "es"} today
      {next && (
        <>
          {" · next: "}
          <span style={next && isOverdue(next) ? { color: "var(--destructive)" } : undefined}>
            {next.title} ({dueLabel(next)})
          </span>
        </>
      )}
    </p>
  );
}
