import { createFileRoute } from "@tanstack/react-router";
import { useLiveQuery } from "dexie-react-hooks";
import { useState } from "react";
import { ChevronLeft, ChevronRight, Plus, Trash2 } from "lucide-react";
import { ModuleScreen } from "@/components/ModuleScreen";
import { db } from "@/lib/db";
import { predictNextStart, toISODate } from "@/lib/period";
import {
  accentColor,
  addHoliday,
  markersForDate,
  removeHoliday,
  type DayMarker,
} from "@/lib/schedule";
import { useTheme } from "@/lib/theme";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/almanac")({
  head: () => ({
    meta: [
      { title: "Petal Almanac / Chronos — MOS" },
      {
        name: "description",
        content: "A curated mini calendar of important dates, holidays and colour-tagged events.",
      },
      { property: "og:title", content: "Petal Almanac / Chronos — MOS" },
      { property: "og:description", content: "Your mini calendar module in MOS." },
    ],
  }),
  component: AlmanacScreen,
});

const fieldStyle = { borderColor: "var(--glass-border)", background: "var(--glass)" };

function dotColor(kind: DayMarker["kind"]): string {
  if (kind === "deadline") return accentColor("important");
  if (kind === "event") return accentColor("extra");
  if (kind === "holiday") return "var(--ring)";
  return "var(--muted-foreground)";
}

function AddHolidayForm({ date, onDone }: { date: string; onDone: () => void }) {
  const { isPastel } = useTheme();
  const [title, setTitle] = useState("");
  const [when, setWhen] = useState(date);

  return (
    <div
      className={cn("flex flex-col gap-3 border p-4", isPastel ? "rounded-2xl" : "rounded-sm")}
      style={fieldStyle}
    >
      <input
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="Holiday title"
        className={cn("border px-3 py-2 text-sm", isPastel ? "rounded-2xl" : "rounded-sm")}
        style={fieldStyle}
      />
      <input
        type="date"
        value={when}
        onChange={(e) => setWhen(e.target.value)}
        className={cn("border px-3 py-2 text-sm", isPastel ? "rounded-2xl" : "rounded-sm")}
        style={fieldStyle}
      />
      <div className="flex gap-2">
        <button
          type="button"
          className={cn("border px-3 py-1.5 text-xs", isPastel ? "rounded-full" : "rounded-sm")}
          style={{ borderColor: "var(--ring)", background: "var(--glass)", color: "var(--ring)" }}
          onClick={async () => {
            if (!title.trim() || !when) return;
            await addHoliday({ title: title.trim(), date: when });
            onDone();
          }}
        >
          Add holiday
        </button>
        <button
          type="button"
          className={cn("border px-3 py-1.5 text-xs", isPastel ? "rounded-full" : "rounded-sm")}
          style={fieldStyle}
          onClick={onDone}
        >
          Cancel
        </button>
      </div>
    </div>
  );
}

function AlmanacScreen() {
  const { isPastel } = useTheme();
  const cycles = useLiveQuery(() => db.cycles.toArray(), [], []);
  const classes = useLiveQuery(() => db.classes.toArray(), [], []);
  const deadlines = useLiveQuery(() => db.deadlines.toArray(), [], []);
  const events = useLiveQuery(() => db.pendingEvents.toArray(), [], []);
  const holidays = useLiveQuery(() => db.holidays.toArray(), [], []);
  const predicted = predictNextStart(cycles ?? []);
  const today = new Date();
  const todayIso = toISODate(today);

  const [cursor, setCursor] = useState(() => new Date(today.getFullYear(), today.getMonth(), 1));
  const [selected, setSelected] = useState<string | null>(null);
  const [adding, setAdding] = useState(false);

  const year = cursor.getFullYear();
  const month = cursor.getMonth();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const pad = cursor.getDay();

  const shift = (delta: number) => {
    setCursor(new Date(year, month + delta, 1));
    setSelected(null);
  };

  const selectedMarkers = selected
    ? markersForDate(selected, classes ?? [], deadlines ?? [], events ?? [], holidays ?? [])
    : [];
  const selectedHolidays = selected ? (holidays ?? []).filter((h) => h.date === selected) : [];

  return (
    <ModuleScreen moduleKey="almanac">
      <section className="glass-panel flex flex-col gap-4 p-6">
        <div className="flex items-center justify-between gap-3">
          <button
            type="button"
            aria-label="Previous month"
            onClick={() => shift(-1)}
            className={cn("border p-1.5", isPastel ? "rounded-full" : "rounded-sm")}
            style={fieldStyle}
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <h2 className="text-display text-lg">
            {cursor.toLocaleDateString(undefined, { month: "long", year: "numeric" })}
          </h2>
          <button
            type="button"
            aria-label="Next month"
            onClick={() => shift(1)}
            className={cn("border p-1.5", isPastel ? "rounded-full" : "rounded-sm")}
            style={fieldStyle}
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>

        <div className="grid grid-cols-7 gap-1 text-center text-[11px] text-muted-foreground">
          {["S", "M", "T", "W", "T", "F", "S"].map((d, i) => (
            <span key={i}>{d}</span>
          ))}
        </div>
        <div className="grid grid-cols-7 gap-1">
          {Array.from({ length: pad }).map((_, i) => (
            <span key={`p${i}`} />
          ))}
          {Array.from({ length: daysInMonth }).map((_, i) => {
            const iso = toISODate(new Date(year, month, i + 1));
            const isPredicted = predicted === iso;
            const markers = markersForDate(
              iso,
              classes ?? [],
              deadlines ?? [],
              events ?? [],
              holidays ?? [],
            );
            const kinds = markers.map((m) => m.kind);
            if (isPredicted) kinds.unshift("period" as DayMarker["kind"]);
            const visible = kinds.slice(0, 3);
            const extra = kinds.length - visible.length;
            const isToday = iso === todayIso;
            return (
              <button
                key={iso}
                type="button"
                onClick={() => setSelected((s) => (s === iso ? null : iso))}
                className={cn(
                  "flex aspect-square cursor-pointer flex-col items-center justify-center border text-xs transition-colors",
                  isPastel ? "rounded-xl" : "rounded-sm",
                  isToday ? "font-semibold text-foreground" : "text-muted-foreground",
                )}
                style={{
                  borderColor:
                    selected === iso || isToday ? "var(--primary)" : "var(--glass-border)",
                  background: "var(--glass)",
                  ...(isToday ? { color: "var(--primary)" } : {}),
                }}
                title={markers.map((m) => m.label).join(", ") || undefined}
              >
                {i + 1}
                <span className="mt-0.5 flex h-1.5 items-center gap-[2px]">
                  {visible.map((k, di) => (
                    <span
                      key={`${k}-${di}`}
                      className="h-1 w-1 rounded-full"
                      style={{
                        background:
                          k === ("period" as DayMarker["kind"]) ? "var(--primary)" : dotColor(k),
                      }}
                    />
                  ))}
                  {extra > 0 && <span className="text-[8px] leading-none">+{extra}</span>}
                </span>
              </button>
            );
          })}
        </div>

        {selected && (
          <div
            className={cn("border p-4", isPastel ? "rounded-2xl" : "rounded-sm")}
            style={fieldStyle}
          >
            <div className="flex items-center justify-between gap-3">
              <p className="text-[11px] uppercase tracking-[0.22em] text-muted-foreground">
                {new Date(`${selected}T00:00:00`).toLocaleDateString(undefined, {
                  weekday: "long",
                  month: "short",
                  day: "numeric",
                })}
              </p>
              <button
                type="button"
                className={cn("border px-2.5 py-1 text-[11px]", isPastel ? "rounded-full" : "rounded-sm")}
                style={fieldStyle}
                onClick={() => setAdding((v) => !v)}
              >
                <span className="flex items-center gap-1">
                  <Plus className="h-3 w-3" /> holiday
                </span>
              </button>
            </div>

            {adding && (
              <div className="mt-3">
                <AddHolidayForm date={selected} onDone={() => setAdding(false)} />
              </div>
            )}

            {selectedMarkers.length === 0 && !adding ? (
              <p className="mt-2 text-sm text-muted-foreground">Nothing on this day.</p>
            ) : (
              <ul className="mt-2 flex flex-col gap-1.5">
                {selectedMarkers.map((m, i) => (
                  <li key={i} className="flex items-center gap-2 text-sm">
                    <span
                      className="h-1.5 w-1.5 shrink-0 rounded-full"
                      style={{ background: dotColor(m.kind) }}
                    />
                    <span className="truncate">{m.label}</span>
                  </li>
                ))}
              </ul>
            )}

            {selectedHolidays.length > 0 && (
              <ul className="mt-3 flex flex-col gap-1.5">
                {selectedHolidays.map((h) => (
                  <li key={h.id} className="flex items-center gap-2 text-xs text-muted-foreground">
                    <span className="truncate">{h.title}</span>
                    <button
                      type="button"
                      aria-label={`Remove ${h.title}`}
                      onClick={() => removeHoliday(String(h.id))}
                      className="shrink-0 opacity-40 transition-opacity hover:opacity-90"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}

        <p className="text-xs text-muted-foreground">
          Dots mark classes, deadlines, dated events and holidays
          {predicted ? ", plus the predicted next period start" : ""}. Tap a day to see what's on it.
        </p>
      </section>
    </ModuleScreen>
  );
}
