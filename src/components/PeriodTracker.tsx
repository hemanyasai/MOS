import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Droplet, HeartPulse } from "lucide-react";
import { SYMPTOMS, type Flow, type Symptom, type Cycle } from "@/lib/db";
import {
  averageCycleLength,
  endPeriodToday,
  formatFriendly,
  predictNextStart,
  setDayLog,
  startPeriodToday,
  toISODate,
} from "@/lib/period";
import { useTheme } from "@/lib/theme";
import { cn } from "@/lib/utils";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/lib/auth";

const FLOWS: Flow[] = ["light", "medium", "heavy"];

function Chip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  const { isPastel } = useTheme();
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "border px-3 py-1.5 text-xs capitalize transition-colors",
        isPastel ? "rounded-full" : "rounded-sm",
        active ? "text-foreground" : "text-muted-foreground",
      )}
      style={{
        borderColor: active ? "var(--primary)" : "var(--glass-border)",
        background: "var(--glass)",
      }}
    >
      {children}
    </button>
  );
}

export function PeriodTracker() {
  const { theme, isPastel } = useTheme();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [busy, setBusy] = useState(false);
  const today = toISODate();

  const { data: cyclesList } = useQuery({
    queryKey: ["cycles"],
    queryFn: async () => {
      const { data, error } = await supabase.from("cycles").select("*");
      if (error) throw error;
      return (data || []).map(row => ({
        id: row.id,
        startDate: row.start_date,
        endDate: row.end_date,
        lengthDays: row.length_days,
        createdAt: row.created_at
      })) as Cycle[];
    },
    enabled: !!user,
  });
  const cycles = cyclesList ?? [];
  const active = cycles.filter((c) => c.endDate === null).sort((a, b) => (a.startDate < b.startDate ? 1 : -1))[0];
  
  const { data: todayLog } = useQuery({
    queryKey: ["cycleDays", active?.id, today],
    queryFn: async () => {
      if (!active) return null;
      const { data, error } = await supabase
        .from("cycle_days")
        .select("*")
        .eq("cycle_id", active.id)
        .eq("date", today)
        .maybeSingle();
      if (error) throw error;
      if (!data) return null;
      return {
        id: data.id,
        cycleId: data.cycle_id,
        date: data.date,
        flow: data.flow as Flow,
        symptoms: data.symptoms as Symptom[],
        createdAt: data.created_at
      };
    },
    enabled: !!active && !!user,
  });

  const completed = cycles.filter((c) => c.endDate !== null);
  const avg = averageCycleLength(cycles);
  const next = predictNextStart(cycles);

  const toggleSymptom = async (s: Symptom) => {
    if (!active) return;
    const current = todayLog?.symptoms ?? [];
    const symptoms = current.includes(s) ? current.filter((x) => x !== s) : [...current, s];
    await setDayLog(active.id as string, today, { symptoms });
    queryClient.invalidateQueries({ queryKey: ["cycleDays", active.id, today] });
  };

  return (
    <section className="glass-panel flex flex-col gap-5 p-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-display text-lg">
            {theme === "pastel" ? "Moon Petals" : "Bio-Cycle Monitor"}
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            {active
              ? `Day ${Math.max(1, Math.round((Date.parse(today) - Date.parse(active.startDate)) / 86400000) + 1)} of the current cycle.`
              : theme === "pastel"
                ? "Log a start whenever it begins."
                : "No active cycle logged."}
          </p>
        </div>
        <HeartPulse className="h-5 w-5 shrink-0" style={{ color: "var(--primary)" }} />
      </div>

      <div className="flex flex-wrap gap-2">
        {!active ? (
          <button
            type="button"
            disabled={busy}
            onClick={async () => {
              setBusy(true);
              await startPeriodToday();
              queryClient.invalidateQueries({ queryKey: ["cycles"] });
              setBusy(false);
            }}
            className={cn(
              "border px-4 py-2 text-sm transition-colors",
              isPastel ? "rounded-full" : "rounded-sm",
            )}
            style={{
              borderColor: "var(--primary)",
              background: "var(--glass)",
              color: "var(--primary)",
            }}
          >
            Period started today
          </button>
        ) : (
          <button
            type="button"
            disabled={busy}
            onClick={async () => {
              setBusy(true);
              await endPeriodToday();
              queryClient.invalidateQueries({ queryKey: ["cycles"] });
              setBusy(false);
            }}
            className={cn(
              "border px-4 py-2 text-sm transition-colors",
              isPastel ? "rounded-full" : "rounded-sm",
            )}
            style={{
              borderColor: "var(--primary)",
              background: "var(--glass)",
              color: "var(--primary)",
            }}
          >
            Period ended today
          </button>
        )}
      </div>

      {active && (
        <div className="flex flex-col gap-4">
          <div>
            <h3 className="text-display text-base">Today's flow</h3>
            <div className="mt-2 flex flex-wrap gap-2">
              {FLOWS.map((f) => (
                <Chip
                  key={f}
                  active={todayLog?.flow === f}
                  onClick={async () => {
                    await setDayLog(active.id as string, today, { flow: todayLog?.flow === f ? null : f });
                    queryClient.invalidateQueries({ queryKey: ["cycleDays", active.id, today] });
                  }}
                >
                  <span className="flex items-center gap-1.5">
                    <Droplet className="h-3 w-3" />
                    {f}
                  </span>
                </Chip>
              ))}
            </div>
          </div>

          <div>
            <h3 className="text-display text-base">Symptoms</h3>
            <div className="mt-2 flex flex-wrap gap-2">
              {SYMPTOMS.map((s) => (
                <Chip
                  key={s}
                  active={(todayLog?.symptoms ?? []).includes(s)}
                  onClick={() => toggleSymptom(s)}
                >
                  {s}
                </Chip>
              ))}
            </div>
          </div>
        </div>
      )}

      <div className="text-xs text-muted-foreground">
        {avg ? (
          <>
            Average cycle length: {avg} days
            {next && ` · next expected around ${formatFriendly(next)}`}
          </>
        ) : (
          "Average cycle length appears once there are two or more logged starts."
        )}
      </div>

      <div>
        <h3 className="text-display text-base">History</h3>
        {completed.length === 0 ? (
          <p className="mt-2 text-sm text-muted-foreground">No completed cycles yet.</p>
        ) : (
          <ul className="mt-2 flex flex-col gap-1.5">
            {completed
              .slice()
              .sort((a, b) => (a.startDate < b.startDate ? 1 : -1))
              .map((c) => (
                <li
                  key={c.id}
                  className="flex items-center justify-between border-b py-1.5 text-sm last:border-b-0"
                  style={{ borderColor: "var(--glass-border)" }}
                >
                  <span>
                    {formatFriendly(c.startDate)} → {formatFriendly(c.endDate!)}
                  </span>
                  <span className="text-muted-foreground tabular-nums">{c.lengthDays} days</span>
                </li>
              ))}
          </ul>
        )}
      </div>
    </section>
  );
}
