import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useMemo, useState } from "react";
import { Archive, Minus, Pause, Play, Plus, RotateCcw } from "lucide-react";
import { type MetricCategory, type MetricEntry, type MetricType } from "@/lib/db";
import {
  METRIC_ICONS,
  METRIC_TYPES,
  addCategory,
  dayTotal,
  ensureDefaultCategories,
  formatValue,
  logEntry,
  metricIcon,
  setArchived,
} from "@/lib/metrics";
import { toISODate } from "@/lib/period";
import { useTheme } from "@/lib/theme";
import { cn } from "@/lib/utils";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/lib/auth";

function pill(isPastel: boolean) {
  return cn("border px-3 py-1.5 text-xs transition-colors", isPastel ? "rounded-full" : "rounded-sm");
}

const fieldStyle = { borderColor: "var(--glass-border)", background: "var(--glass)" };

function CategoryCard({ cat, date }: { cat: MetricCategory; date: string }) {
  const { isPastel } = useTheme();
  const Icon = metricIcon(cat.icon);
  const queryClient = useQueryClient();
  const { user } = useAuth();
  
  const { data: entriesList } = useQuery({
    queryKey: ["metricEntries", String(cat.id), date],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("metric_entries")
        .select("*")
        .eq("category_id", cat.id)
        .eq("date", date);
      if (error) throw error;
      return (data || []).map(row => ({
        id: row.id,
        categoryId: row.category_id,
        date: row.date,
        value: row.value,
        text: row.text,
        createdAt: row.created_at,
      })) as MetricEntry[];
    },
    enabled: !!user,
  });

  const entries = entriesList ?? [];
  const total = dayTotal(entries);
  const [manual, setManual] = useState("");
  const [text, setText] = useState("");
  const [runningSince, setRunningSince] = useState<number | null>(null);
  const [, tick] = useState(0);

  useEffect(() => {
    if (runningSince === null) return;
    const t = setInterval(() => tick((n) => n + 1), 1000);
    return () => clearInterval(t);
  }, [runningSince]);

  const elapsedMin = runningSince === null ? 0 : (Date.now() - runningSince) / 60000;
  const goalPct = cat.dailyGoal ? Math.min(100, Math.round((total / cat.dailyGoal) * 100)) : null;

  return (
    <div className="glass-panel flex flex-col gap-3 p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <Icon className="h-4 w-4 shrink-0" style={{ color: "var(--primary)" }} />
            <span className="truncate text-display text-base">{cat.name}</span>
          </div>
          <p className="mt-1 text-sm text-muted-foreground">
            {formatValue(cat.type, total, cat.unit)}
            {cat.dailyGoal
              ? ` · ${goalPct}% of goal (${formatValue(cat.type, cat.dailyGoal, cat.unit)})`
              : ""}
          </p>
        </div>
        <button
          type="button"
          aria-label={`Archive ${cat.name}`}
          onClick={async () => {
            await setArchived(String(cat.id), true);
            queryClient.invalidateQueries({ queryKey: ["metricCategories"] });
          }}
          className="shrink-0 opacity-40 transition-opacity hover:opacity-90"
        >
          <Archive className="h-4 w-4" />
        </button>
      </div>

      {cat.type === "counter" && (
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            className={pill(isPastel)}
            style={fieldStyle}
            onClick={async () => {
              await logEntry(String(cat.id), 1);
              queryClient.invalidateQueries({ queryKey: ["metricEntries", String(cat.id), date] });
            }}
          >
            <span className="flex items-center gap-1">
              <Plus className="h-3 w-3" /> 1
            </span>
          </button>
          <button
            type="button"
            className={pill(isPastel)}
            style={fieldStyle}
            onClick={async () => {
              await logEntry(String(cat.id), -1);
              queryClient.invalidateQueries({ queryKey: ["metricEntries", String(cat.id), date] });
            }}
          >
            <span className="flex items-center gap-1">
              <Minus className="h-3 w-3" /> 1
            </span>
          </button>
          <input
            value={manual}
            onChange={(e) => setManual(e.target.value)}
            inputMode="numeric"
            placeholder={`add ${cat.unit}`}
            className={cn("w-28 border px-3 py-1.5 text-xs", isPastel ? "rounded-full" : "rounded-sm")}
            style={fieldStyle}
          />
          <button
            type="button"
            className={pill(isPastel)}
            style={fieldStyle}
            onClick={() => {
              const n = Number(manual);
              if (Number.isFinite(n) && n !== 0) logEntry(String(cat.id), n);
              setManual("");
            }}
          >
            log
          </button>
        </div>
      )}

      {cat.type === "duration" && (
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            className={pill(isPastel)}
            style={fieldStyle}
            onClick={async () => {
              if (runningSince === null) {
                setRunningSince(Date.now());
              } else {
                const mins = (Date.now() - runningSince) / 60000;
                setRunningSince(null);
                if (mins > 0.1) {
                  await logEntry(String(cat.id), Math.round(mins));
                  queryClient.invalidateQueries({ queryKey: ["metricEntries", String(cat.id), date] });
                }
              }
            }}
          >
            <span className="flex items-center gap-1">
              {runningSince === null ? <Play className="h-3 w-3" /> : <Pause className="h-3 w-3" />}
              {runningSince === null ? "start" : `stop (${Math.floor(elapsedMin)}m)`}
            </span>
          </button>
          {runningSince !== null && (
            <button
              type="button"
              className={pill(isPastel)}
              style={fieldStyle}
              onClick={() => setRunningSince(null)}
              aria-label="Discard timer"
            >
              <RotateCcw className="h-3 w-3" />
            </button>
          )}
          <input
            value={manual}
            onChange={(e) => setManual(e.target.value)}
            inputMode="numeric"
            placeholder="minutes"
            className={cn("w-28 border px-3 py-1.5 text-xs", isPastel ? "rounded-full" : "rounded-sm")}
            style={fieldStyle}
          />
          <button
            type="button"
            className={pill(isPastel)}
            style={fieldStyle}
            onClick={() => {
              const n = Number(manual);
              if (Number.isFinite(n) && n !== 0) logEntry(String(cat.id), n);
              setManual("");
            }}
          >
            log
          </button>
        </div>
      )}

      {cat.type === "text_log" && (
        <div className="flex flex-col gap-2">
          <div className="flex gap-2">
            <input
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="today's entry"
              className={cn(
                "min-w-0 flex-1 border px-3 py-1.5 text-xs",
                isPastel ? "rounded-full" : "rounded-sm",
              )}
              style={fieldStyle}
            />
            <button
              type="button"
              className={pill(isPastel)}
              style={fieldStyle}
              onClick={async () => {
                if (text.trim()) {
                  await logEntry(String(cat.id), 0, text.trim());
                  queryClient.invalidateQueries({ queryKey: ["metricEntries", String(cat.id), date] });
                }
                setText("");
              }}
            >
              log
            </button>
          </div>
          <ul className="flex flex-col gap-1 text-xs text-muted-foreground">
            {(entries ?? [])
              .filter((e) => e.text)
              .map((e) => (
                <li key={e.id}>· {e.text}</li>
              ))}
          </ul>
        </div>
      )}
    </div>
  );
}

function AddCategoryForm({ onDone }: { onDone: () => void }) {
  const { isPastel } = useTheme();
  const queryClient = useQueryClient();
  const [name, setName] = useState("");
  const [icon, setIcon] = useState("star");
  const [type, setType] = useState<MetricType>("counter");
  const [unit, setUnit] = useState("");
  const [goal, setGoal] = useState("");

  return (
    <div className="glass-panel flex flex-col gap-4 p-5">
      <h3 className="text-display text-base">New category</h3>
      <input
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="Name"
        className={cn("border px-3 py-2 text-sm", isPastel ? "rounded-2xl" : "rounded-sm")}
        style={fieldStyle}
      />
      <div>
        <p className="text-xs text-muted-foreground">Icon</p>
        <div className="mt-2 flex flex-wrap gap-2">
          {Object.entries(METRIC_ICONS).map(([key, Icon]) => (
            <button
              key={key}
              type="button"
              aria-label={key}
              onClick={() => setIcon(key)}
              className={cn(
                "grid h-8 w-8 place-items-center border",
                isPastel ? "rounded-full" : "rounded-sm",
              )}
              style={{
                borderColor: icon === key ? "var(--primary)" : "var(--glass-border)",
                background: "var(--glass)",
              }}
            >
              <Icon className="h-4 w-4" />
            </button>
          ))}
        </div>
      </div>
      <div>
        <p className="text-xs text-muted-foreground">Type</p>
        <div className="mt-2 flex flex-wrap gap-2">
          {METRIC_TYPES.map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setType(t)}
              className={pill(isPastel)}
              style={{
                borderColor: type === t ? "var(--primary)" : "var(--glass-border)",
                background: "var(--glass)",
              }}
            >
              {t}
            </button>
          ))}
        </div>
      </div>
      <div className="flex flex-wrap gap-2">
        <input
          value={unit}
          onChange={(e) => setUnit(e.target.value)}
          placeholder={type === "duration" ? "minutes" : "unit (e.g. glasses)"}
          className={cn(
            "min-w-0 flex-1 border px-3 py-2 text-sm",
            isPastel ? "rounded-2xl" : "rounded-sm",
          )}
          style={fieldStyle}
        />
        <input
          value={goal}
          onChange={(e) => setGoal(e.target.value)}
          inputMode="numeric"
          placeholder={type === "duration" ? "goal (min)" : "daily goal"}
          className={cn("w-36 border px-3 py-2 text-sm", isPastel ? "rounded-2xl" : "rounded-sm")}
          style={fieldStyle}
        />
      </div>
      <div className="flex gap-2">
        <button
          type="button"
          className={pill(isPastel)}
          style={{
            borderColor: "var(--primary)",
            background: "var(--glass)",
            color: "var(--primary)",
          }}
          onClick={async () => {
            if (!name.trim()) return;
            const n = Number(goal);
            await addCategory({
              name: name.trim(),
              icon,
              type,
              unit: unit.trim() || (type === "duration" ? "minutes" : "times"),
              dailyGoal: Number.isFinite(n) && n > 0 ? n : null,
            });
            await queryClient.invalidateQueries({ queryKey: ["metricCategories"] });
            onDone();
          }}
        >
          Add category
        </button>
        <button type="button" className={pill(isPastel)} style={fieldStyle} onClick={onDone}>
          Cancel
        </button>
      </div>
    </div>
  );
}

export function MetricsTracker() {
  const { theme, isPastel } = useTheme();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [adding, setAdding] = useState(false);
  const [showArchived, setShowArchived] = useState(false);
  const date = useMemo(() => toISODate(), []);

  useEffect(() => {
    if (user) {
      ensureDefaultCategories().then(() => {
        queryClient.invalidateQueries({ queryKey: ["metricCategories"] });
      });
    }
  }, [user, queryClient]);

  const { data: categoriesList } = useQuery({
    queryKey: ["metricCategories"],
    queryFn: async () => {
      const { data, error } = await supabase.from("metric_categories").select("*");
      if (error) throw error;
      return (data || []).map(row => ({
        id: row.id,
        name: row.name,
        icon: row.icon,
        type: row.type as MetricType,
        unit: row.unit,
        dailyGoal: row.daily_goal,
        archived: row.archived,
        createdAt: row.created_at,
      })) as MetricCategory[];
    },
    enabled: !!user,
  });

  const categories = categoriesList ?? [];
  const activeCats = categories.filter((c) => !c.archived);
  const archivedCats = categories.filter((c) => c.archived);

  return (
    <section className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-display text-lg">
            {theme === "pastel" ? "Little Metrics" : "Telemetry"}
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            {theme === "pastel" ? "Today's counts and hours." : "Today's tracked readings."}
          </p>
        </div>
        <button
          type="button"
          className={pill(isPastel)}
          style={fieldStyle}
          onClick={() => setAdding((v) => !v)}
        >
          <span className="flex items-center gap-1">
            <Plus className="h-3 w-3" /> category
          </span>
        </button>
      </div>

      {adding && <AddCategoryForm onDone={() => setAdding(false)} />}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {activeCats.map((c) => (
          <CategoryCard key={c.id} cat={c} date={date} />
        ))}
      </div>

      {archivedCats.length > 0 && (
        <div>
          <button
            type="button"
            className="text-xs text-muted-foreground underline-offset-4 hover:underline"
            onClick={() => setShowArchived((v) => !v)}
          >
            {showArchived ? "Hide" : "Show"} archived ({archivedCats.length})
          </button>
          {showArchived && (
            <ul className="mt-2 flex flex-col gap-1.5">
              {archivedCats.map((c) => (
                <li
                  key={c.id}
                  className="flex items-center justify-between text-sm text-muted-foreground"
                >
                  <span>{c.name}</span>
                  <button
                    type="button"
                    className={pill(isPastel)}
                    style={fieldStyle}
                    onClick={async () => {
                      await setArchived(String(c.id), false);
                      queryClient.invalidateQueries({ queryKey: ["metricCategories"] });
                    }}
                  >
                    restore
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </section>
  );
}

