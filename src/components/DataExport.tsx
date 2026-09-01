import { useState } from "react";
import { Download, Archive, FileText, Calendar, BarChart2, Heart, Loader2 } from "lucide-react";
import {
  exportDiary,
  exportEverything,
  exportNotes,
  exportSchedule,
  exportMetrics,
  exportPeriod,
} from "@/lib/export";
import { useTheme } from "@/lib/theme";
import { cn } from "@/lib/utils";

type ExportKey = "all" | "jb" | "notes" | "schedule" | "metrics" | "period";

const EXPORTS: {
  key: ExportKey;
  label: string;
  description: string;
  icon: React.ElementType;
  fn: () => Promise<void>;
}[] = [
  {
    key: "all",
    label: "Everything",
    description: "Full backup — all modules, all media, all data",
    icon: Archive,
    fn: exportEverything,
  },
  {
    key: "jb",
    label: "JB / Diary",
    description: "All entries with text, images, voice notes & attachments",
    icon: FileText,
    fn: exportDiary,
  },
  {
    key: "notes",
    label: "Brain Dump",
    description: "All brain dump notes as a .txt file",
    icon: FileText,
    fn: exportNotes,
  },
  {
    key: "schedule",
    label: "Schedule",
    description: "Classes, deadlines, pending events & holidays",
    icon: Calendar,
    fn: exportSchedule,
  },
  {
    key: "metrics",
    label: "Metrics",
    description: "All tracked metrics categories and logged entries",
    icon: BarChart2,
    fn: exportMetrics,
  },
  {
    key: "period",
    label: "Period Tracker",
    description: "Cycles and daily logs",
    icon: Heart,
    fn: exportPeriod,
  },
];

export function DataExport() {
  const { isPastel } = useTheme();
  const [loading, setLoading] = useState<ExportKey | null>(null);
  const [lastError, setLastError] = useState<string | null>(null);
  const [lastSuccess, setLastSuccess] = useState<ExportKey | null>(null);

  async function run(item: (typeof EXPORTS)[number]) {
    setLastError(null);
    setLastSuccess(null);
    setLoading(item.key);
    try {
      await item.fn();
      setLastSuccess(item.key);
      setTimeout(() => setLastSuccess(null), 3000);
    } catch (e) {
      setLastError(e instanceof Error ? e.message : "Export failed.");
    } finally {
      setLoading(null);
    }
  }

  return (
    <section className="glass-panel flex flex-col gap-5 p-6">
      <div>
        <h2 className="text-display text-lg">Data Export</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Download your data any time. Everything stays on your device — exports go straight to your downloads folder.
        </p>
      </div>

      {lastError && (
        <p className="rounded border border-red-300 bg-red-50 px-3 py-2 text-xs text-red-700 dark:border-red-800 dark:bg-red-950 dark:text-red-300">
          {lastError}
        </p>
      )}

      <div className="grid gap-3 sm:grid-cols-2">
        {EXPORTS.map((item) => {
          const Icon = item.icon;
          const isLoading = loading === item.key;
          const isSuccess = lastSuccess === item.key;
          const isAll = item.key === "all";

          return (
            <button
              key={item.key}
              onClick={() => run(item)}
              disabled={loading !== null}
              className={cn(
                "flex items-start gap-3 border p-4 text-left transition-all duration-200",
                isPastel ? "rounded-xl" : "rounded-sm",
                isAll
                  ? "col-span-full border-[var(--primary)] bg-[var(--primary)]/5 hover:bg-[var(--primary)]/10"
                  : "border-[var(--glass-border)] hover:border-[var(--primary)]/50",
                loading !== null && !isLoading ? "opacity-50" : "opacity-100",
                isSuccess ? "border-green-400 bg-green-50 dark:border-green-700 dark:bg-green-950/30" : "",
              )}
            >
              <span
                className={cn(
                  "mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg",
                  isAll ? "bg-[var(--primary)]/15" : "bg-[var(--glass)]",
                )}
              >
                {isLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin text-[var(--primary)]" />
                ) : isSuccess ? (
                  <Download className="h-4 w-4 text-green-500" />
                ) : (
                  <Icon className={cn("h-4 w-4", isAll ? "text-[var(--primary)]" : "text-muted-foreground")} />
                )}
              </span>
              <span className="flex flex-col gap-0.5">
                <span
                  className={cn("text-sm font-medium", isAll ? "text-[var(--primary)]" : "text-foreground")}
                >
                  {isLoading
                    ? "Packing…"
                    : isSuccess
                      ? "Downloaded ✓"
                      : item.label}
                </span>
                <span className="text-xs text-muted-foreground">{item.description}</span>
              </span>
            </button>
          );
        })}
      </div>

      <p className="text-xs text-muted-foreground">
        Exports are ZIP files containing your raw data — text files, images, voice recordings, and JSON. They can be opened on any device.
      </p>
    </section>
  );
}
