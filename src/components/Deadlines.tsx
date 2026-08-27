import { useLiveQuery } from "dexie-react-hooks";
import { useState } from "react";
import { Check, Plus, Undo2 } from "lucide-react";
import { db, type Deadline, type DeadlineImportance } from "@/lib/db";
import {
  DEADLINE_IMPORTANCE,
  accentColor,
  activeDeadlines,
  addDeadline,
  addPendingEvent,
  confirmPendingDate,
  dueLabel,
  isOverdue,
  markDeadlineDone,
  sortDeadlines,
} from "@/lib/schedule";
import { toISODate } from "@/lib/period";
import { useTheme } from "@/lib/theme";
import { cn } from "@/lib/utils";

const fieldStyle = { borderColor: "var(--glass-border)", background: "var(--glass)" };

function pill(isPastel: boolean) {
  return cn("border px-3 py-1.5 text-xs transition-colors", isPastel ? "rounded-full" : "rounded-sm");
}

function input(isPastel: boolean) {
  return cn("border px-3 py-2 text-sm", isPastel ? "rounded-2xl" : "rounded-sm");
}

function AddDeadlineForm({ onDone }: { onDone: () => void }) {
  const { isPastel } = useTheme();
  const [title, setTitle] = useState("");
  const [dueDate, setDueDate] = useState(toISODate());
  const [dueTime, setDueTime] = useState("");
  const [category, setCategory] = useState("");
  const [importance, setImportance] = useState<DeadlineImportance>("normal");

  return (
    <div className="glass-panel flex flex-col gap-4 p-5">
      <h3 className="text-display text-base">New deadline</h3>
      <input
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="Title"
        className={input(isPastel)}
        style={fieldStyle}
      />
      <div className="flex flex-wrap gap-2">
        <input
          type="date"
          value={dueDate}
          onChange={(e) => setDueDate(e.target.value)}
          className={input(isPastel)}
          style={fieldStyle}
        />
        <input
          type="time"
          value={dueTime}
          onChange={(e) => setDueTime(e.target.value)}
          className={input(isPastel)}
          style={fieldStyle}
        />
      </div>
      <input
        value={category}
        onChange={(e) => setCategory(e.target.value)}
        placeholder="Subject / category (optional)"
        className={input(isPastel)}
        style={fieldStyle}
      />
      <div className="flex flex-wrap gap-2">
        {DEADLINE_IMPORTANCE.map((imp) => (
          <button
            key={imp}
            type="button"
            onClick={() => setImportance(imp)}
            className={pill(isPastel)}
            style={{
              borderColor: importance === imp ? accentColor(imp) : "var(--glass-border)",
              background: "var(--glass)",
            }}
          >
            {imp}
          </button>
        ))}
      </div>
      <div className="flex gap-2">
        <button
          type="button"
          className={pill(isPastel)}
          style={{ borderColor: "var(--primary)", background: "var(--glass)", color: "var(--primary)" }}
          onClick={async () => {
            if (!title.trim() || !dueDate) return;
            await addDeadline({
              title: title.trim(),
              dueDate,
              dueTime: dueTime || null,
              category: category.trim() || null,
              importance,
            });
            onDone();
          }}
        >
          Add deadline
        </button>
        <button type="button" className={pill(isPastel)} style={fieldStyle} onClick={onDone}>
          Cancel
        </button>
      </div>
    </div>
  );
}

function DeadlineRow({ d }: { d: Deadline }) {
  const { isPastel } = useTheme();
  const overdue = isOverdue(d);
  const accent = overdue ? accentColor("overdue") : accentColor(d.importance);

  return (
    <li
      className={cn("flex items-center gap-3 border p-3", isPastel ? "rounded-2xl" : "rounded-sm")}
      style={{
        ...fieldStyle,
        ...(overdue ? { borderColor: accentColor("overdue"), background: "rgba(239, 68, 68, 0.05)" } : {})
      }}
    >
      <span
        className={cn("h-8 w-1 shrink-0", isPastel ? "rounded-full" : "rounded-none")}
        style={{ background: accent }}
        aria-hidden
      />
      <div className="min-w-0 flex-1">
        <p className={cn("truncate text-sm", d.doneAt && "line-through opacity-60")}>
          {d.title}
          {overdue && (
            <span
              className="ml-2 text-[10px] uppercase tracking-[0.18em]"
              style={{ color: accentColor("overdue") }}
            >
              overdue
            </span>
          )}
          {!overdue && d.importance === "important" && (
            <span
              className="ml-2 text-[10px] uppercase tracking-[0.18em]"
              style={{ color: accentColor("important") }}
            >
              important
            </span>
          )}
        </p>
        <p className="text-xs text-muted-foreground">
          {dueLabel(d)}
          {d.category ? ` · ${d.category}` : ""}
        </p>
      </div>
      <button
        type="button"
        aria-label={d.doneAt ? `Restore ${d.title}` : `Mark ${d.title} done`}
        onClick={() => markDeadlineDone(d.id, d.doneAt === null)}
        className="shrink-0 opacity-40 transition-opacity hover:opacity-90"
      >
        {d.doneAt ? <Undo2 className="h-4 w-4" /> : <Check className="h-4 w-4" />}
      </button>
    </li>
  );
}

function PendingSection() {
  const { isPastel } = useTheme();
  const [title, setTitle] = useState("");
  const [note, setNote] = useState("");
  const events = useLiveQuery(() => db.pendingEvents.toArray(), [], []);
  const undated = (events ?? []).filter((e) => e.status === "date unknown");

  return (
    <div className="glass-panel flex flex-col gap-4 p-5">
      <div>
        <h3 className="text-display text-base">Not yet dated</h3>
        <p className="mt-1 text-sm text-muted-foreground">
          Things that are coming, whenever they decide to happen.
        </p>
      </div>

      <div className="flex flex-wrap gap-2">
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Title"
          className={cn("min-w-0 flex-1", input(isPastel))}
          style={fieldStyle}
        />
        <input
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="Note (optional)"
          className={cn("min-w-0 flex-1", input(isPastel))}
          style={fieldStyle}
        />
        <button
          type="button"
          className={pill(isPastel)}
          style={fieldStyle}
          onClick={async () => {
            if (!title.trim()) return;
            await addPendingEvent({ title: title.trim(), note: note.trim() || null });
            setTitle("");
            setNote("");
          }}
        >
          <span className="flex items-center gap-1">
            <Plus className="h-3 w-3" /> add
          </span>
        </button>
      </div>

      {undated.length === 0 ? (
        <p className="text-sm text-muted-foreground">Nothing waiting on a date.</p>
      ) : (
        <ul className="flex flex-col gap-2">
          {undated.map((e) => (
            <li
              key={e.id}
              className={cn(
                "flex flex-wrap items-center gap-3 border p-3",
                isPastel ? "rounded-2xl" : "rounded-sm",
              )}
              style={fieldStyle}
            >
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm">{e.title}</p>
                {e.note && <p className="truncate text-xs text-muted-foreground">{e.note}</p>}
              </div>
              <input
                type="date"
                aria-label={`Set date for ${e.title}`}
                onChange={(ev) => {
                  if (ev.target.value) void confirmPendingDate(e.id, ev.target.value);
                }}
                className={cn("border px-3 py-1.5 text-xs", isPastel ? "rounded-full" : "rounded-sm")}
                style={fieldStyle}
              />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function ConfirmedEvents() {
  const { isPastel } = useTheme();
  const events = useLiveQuery(() => db.pendingEvents.toArray(), [], []);
  const dated = (events ?? [])
    .filter((e) => e.status === "date confirmed" && e.date)
    .sort((a, b) => (a.date ?? "").localeCompare(b.date ?? ""));
  if (dated.length === 0) return null;

  return (
    <ul className="flex flex-col gap-2">
      {dated.map((e) => (
        <li
          key={e.id}
          className={cn("flex items-center gap-3 border p-3", isPastel ? "rounded-2xl" : "rounded-sm")}
          style={fieldStyle}
        >
          <span
            className={cn("h-8 w-1 shrink-0", isPastel ? "rounded-full" : "rounded-none")}
            style={{ background: accentColor("normal") }}
            aria-hidden
          />
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm">{e.title}</p>
            <p className="text-xs text-muted-foreground">
              {new Date(`${e.date}T00:00:00`).toLocaleDateString(undefined, {
                month: "short",
                day: "numeric",
              })}
              {e.note ? ` · ${e.note}` : ""}
            </p>
          </div>
        </li>
      ))}
    </ul>
  );
}

export function Deadlines() {
  const { theme, isPastel } = useTheme();
  const [adding, setAdding] = useState(false);
  const [showDone, setShowDone] = useState(false);
  const deadlines = useLiveQuery(() => db.deadlines.toArray(), [], []);
  const all = deadlines ?? [];
  const active = activeDeadlines(all);
  const done = sortDeadlines(all.filter((d) => d.doneAt !== null));

  return (
    <section className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-display text-lg">
            {theme === "pastel" ? "Deadlines" : "Countdowns"}
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">Nearest first.</p>
        </div>
        <button
          type="button"
          className={pill(isPastel)}
          style={fieldStyle}
          onClick={() => setAdding((v) => !v)}
        >
          <span className="flex items-center gap-1">
            <Plus className="h-3 w-3" /> deadline
          </span>
        </button>
      </div>

      {adding && <AddDeadlineForm onDone={() => setAdding(false)} />}

      <div className="glass-panel flex flex-col gap-3 p-5">
        {active.length === 0 ? (
          <p className="text-sm text-muted-foreground">Nothing due right now.</p>
        ) : (
          <ul className="flex flex-col gap-2">
            {active.map((d) => (
              <DeadlineRow key={d.id} d={d} />
            ))}
          </ul>
        )}
        <ConfirmedEvents />
        {done.length > 0 && (
          <div>
            <button
              type="button"
              className="text-xs text-muted-foreground underline-offset-4 hover:underline"
              onClick={() => setShowDone((v) => !v)}
            >
              {showDone ? "Hide" : "Show"} done ({done.length})
            </button>
            {showDone && (
              <ul className="mt-2 flex flex-col gap-2">
                {done.map((d) => (
                  <DeadlineRow key={d.id} d={d} />
                ))}
              </ul>
            )}
          </div>
        )}
      </div>

      <PendingSection />
    </section>
  );
}
