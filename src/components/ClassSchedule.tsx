import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { type ClassImportance, type ClassItem } from "@/lib/db";
import {
  CLASS_IMPORTANCE,
  DAY_NAMES,
  DAY_SHORT,
  accentColor,
  addClass,
  byTime,
  formatTime,
  removeClass,
  todaysClasses,
} from "@/lib/schedule";
import { useTheme } from "@/lib/theme";
import { cn } from "@/lib/utils";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/lib/auth";

const fieldStyle = { borderColor: "var(--glass-border)", background: "var(--glass)" };

function pill(isPastel: boolean) {
  return cn("border px-3 py-1.5 text-xs transition-colors", isPastel ? "rounded-full" : "rounded-sm");
}

function input(isPastel: boolean) {
  return cn("border px-3 py-2 text-sm", isPastel ? "rounded-2xl" : "rounded-sm");
}

function AddClassForm({ onDone }: { onDone: () => void }) {
  const { isPastel } = useTheme();
  const queryClient = useQueryClient();
  const [subject, setSubject] = useState("");
  const [dayOfWeek, setDayOfWeek] = useState(new Date().getDay());
  const [startTime, setStartTime] = useState("09:00");
  const [endTime, setEndTime] = useState("10:00");
  const [location, setLocation] = useState("");
  const [importance, setImportance] = useState<ClassImportance>("normal");

  return (
    <div className="glass-panel flex flex-col gap-4 p-5">
      <h3 className="text-display text-base">New class</h3>
      <input
        value={subject}
        onChange={(e) => setSubject(e.target.value)}
        placeholder="Subject"
        className={input(isPastel)}
        style={fieldStyle}
      />
      <div>
        <p className="text-xs text-muted-foreground">Day</p>
        <div className="mt-2 flex flex-wrap gap-2">
          {DAY_SHORT.map((d, i) => (
            <button
              key={d}
              type="button"
              onClick={() => setDayOfWeek(i)}
              className={pill(isPastel)}
              style={{
                borderColor: dayOfWeek === i ? "var(--primary)" : "var(--glass-border)",
                background: "var(--glass)",
              }}
            >
              {d}
            </button>
          ))}
        </div>
      </div>
      <div className="flex flex-wrap gap-2">
        <label className="flex items-center gap-2 text-xs text-muted-foreground">
          from
          <input
            type="time"
            value={startTime}
            onChange={(e) => setStartTime(e.target.value)}
            className={input(isPastel)}
            style={fieldStyle}
          />
        </label>
        <label className="flex items-center gap-2 text-xs text-muted-foreground">
          to
          <input
            type="time"
            value={endTime}
            onChange={(e) => setEndTime(e.target.value)}
            className={input(isPastel)}
            style={fieldStyle}
          />
        </label>
      </div>
      <input
        value={location}
        onChange={(e) => setLocation(e.target.value)}
        placeholder="Location (optional)"
        className={input(isPastel)}
        style={fieldStyle}
      />
      <div>
        <p className="text-xs text-muted-foreground">Importance</p>
        <div className="mt-2 flex flex-wrap gap-2">
          {CLASS_IMPORTANCE.map((imp) => (
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
      </div>
      <div className="flex gap-2">
        <button
          type="button"
          className={pill(isPastel)}
          style={{ borderColor: "var(--primary)", background: "var(--glass)", color: "var(--primary)" }}
          onClick={async () => {
            if (!subject.trim()) return;
            try {
              await addClass({
                subject: subject.trim(),
                dayOfWeek,
                startTime,
                endTime,
                location: location.trim() || null,
                importance,
              });
              await queryClient.invalidateQueries({ queryKey: ["classes"] });
              onDone();
            } catch (err: any) {
              alert(err.message || "Failed to add class.");
            }
          }}
        >
          Add class
        </button>
        <button type="button" className={pill(isPastel)} style={fieldStyle} onClick={onDone}>
          Cancel
        </button>
      </div>
    </div>
  );
}

function ClassRow({
  id,
  subject,
  startTime,
  endTime,
  location,
  importance,
  showDay,
}: {
  id: string;
  subject: string;
  startTime: string;
  endTime: string;
  location: string | null;
  importance: ClassImportance;
  showDay?: string;
}) {
  const { isPastel } = useTheme();
  const queryClient = useQueryClient();
  return (
    <li
      className={cn("flex items-center gap-3 border p-3", isPastel ? "rounded-2xl" : "rounded-sm")}
      style={fieldStyle}
    >
      <span
        className={cn("h-8 w-1 shrink-0", isPastel ? "rounded-full" : "rounded-none")}
        style={{ background: accentColor(importance) }}
        aria-hidden
      />
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm">
          {subject}
          {importance !== "normal" && (
            <span className="ml-2 text-[10px] uppercase tracking-[0.18em]" style={{ color: accentColor(importance) }}>
              {importance}
            </span>
          )}
        </p>
        <p className="text-xs text-muted-foreground">
          {showDay ? `${showDay} · ` : ""}
          {formatTime(startTime)}–{formatTime(endTime)}
          {location ? ` · ${location}` : ""}
        </p>
      </div>
      <button
        type="button"
        aria-label={`Remove ${subject}`}
        onClick={async () => {
          try {
            await removeClass(id);
            await queryClient.invalidateQueries({ queryKey: ["classes"] });
          } catch (err: any) {
            alert(err.message || "Failed to remove class.");
          }
        }}
        className="shrink-0 opacity-40 transition-opacity hover:opacity-90"
      >
        <Trash2 className="h-4 w-4" />
      </button>
    </li>
  );
}

export function ClassSchedule() {
  const { theme, isPastel } = useTheme();
  const { user } = useAuth();
  const [adding, setAdding] = useState(false);

  const { data: classesList } = useQuery({
    queryKey: ["classes"],
    queryFn: async () => {
      const { data, error } = await supabase.from("classes").select("*");
      if (error) throw error;
      return (data || []).map((row) => ({
        id: row.id,
        subject: row.subject,
        dayOfWeek: row.day_of_week,
        startTime: row.start_time,
        endTime: row.end_time,
        location: row.location,
        importance: row.importance as ClassImportance,
        createdAt: row.created_at,
      })) as ClassItem[];
    },
    enabled: !!user,
  });

  const all = classesList ?? [];
  const today = todaysClasses(all);

  return (
    <section className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-display text-lg">
            {theme === "pastel" ? "Today's classes" : "Today's runs"}
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            {DAY_NAMES[new Date().getDay()]} · {today.length} scheduled
          </p>
        </div>
        <button
          type="button"
          className={pill(isPastel)}
          style={fieldStyle}
          onClick={() => setAdding((v) => !v)}
        >
          <span className="flex items-center gap-1">
            <Plus className="h-3 w-3" /> class
          </span>
        </button>
      </div>

      {adding && <AddClassForm onDone={() => setAdding(false)} />}

      <div className="glass-panel flex flex-col gap-3 p-5">
        {today.length === 0 ? (
          <p className="text-sm text-muted-foreground">Nothing on the schedule today.</p>
        ) : (
          <ul className="flex flex-col gap-2">
            {today.map((c) => (
              <ClassRow key={c.id} {...c} id={String(c.id)} />
            ))}
          </ul>
        )}
      </div>

      <div className="glass-panel flex flex-col gap-4 p-5">
        <h3 className="text-display text-base">Week</h3>
        {all.length === 0 ? (
          <p className="text-sm text-muted-foreground">No recurring classes yet.</p>
        ) : (
          <div className="flex flex-col gap-4">
            {DAY_NAMES.map((day, i) => {
              const list = all.filter((c) => c.dayOfWeek === i).sort(byTime);
              if (list.length === 0) return null;
              return (
                <div key={day} className="flex flex-col gap-2">
                  <p className="text-[11px] uppercase tracking-[0.22em] text-muted-foreground">{day}</p>
                  <ul className="flex flex-col gap-2">
                    {list.map((c) => (
                      <ClassRow key={c.id} {...c} id={String(c.id)} />
                    ))}
                  </ul>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
}
