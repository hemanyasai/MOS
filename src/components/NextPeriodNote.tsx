import { useLiveQuery } from "dexie-react-hooks";
import { db } from "@/lib/db";
import { formatFriendly, predictNextStart } from "@/lib/period";

/** Small, non-alarming prediction line for Nest/Dock. */
export function NextPeriodNote() {
  const cycles = useLiveQuery(() => db.cycles.toArray(), [], []);
  const next = predictNextStart(cycles ?? []);
  if (!next) return null;
  return (
    <p className="text-xs text-muted-foreground">
      Next period expected around {formatFriendly(next)}
    </p>
  );
}
