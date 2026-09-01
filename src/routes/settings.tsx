import { createFileRoute } from "@tanstack/react-router";
import { ModuleScreen } from "@/components/ModuleScreen";
import { DiaryReset } from "@/components/DiaryReset";
import { NotificationSettings } from "@/components/NotificationSettings";
import { DataExport } from "@/components/DataExport";
import { Slider } from "@/components/ui/slider";
import { defaultSlider, usePersonalitySettings } from "@/lib/personality-settings";
import { useTheme } from "@/lib/theme";
import { cn } from "@/lib/utils";


export const Route = createFileRoute("/settings")({
  head: () => ({
    meta: [
      { title: "The Potting Shed / Control Core — MOS" },
      { name: "description", content: "Hidden settings module for MOS: themes and preferences." },
      { property: "og:title", content: "The Potting Shed / Control Core — MOS" },
      { property: "og:description", content: "Hidden settings module for MOS." },
    ],
  }),
  component: SettingsScreen,
});

function Choice<T extends string>({
  label,
  options,
  value,
  onChange,
}: {
  label: string;
  options: readonly T[];
  value: T;
  onChange: (v: T) => void;
}) {
  const { isPastel } = useTheme();
  return (
    <div>
      <h3 className="text-display text-base">{label}</h3>
      <div className="mt-2 flex flex-wrap gap-2">
        {options.map((o) => (
          <button
            key={o}
            onClick={() => onChange(o)}
            className={cn(
              "border px-3 py-1.5 text-xs capitalize transition-colors",
              isPastel ? "rounded-full" : "rounded-sm",
              value === o ? "text-foreground" : "text-muted-foreground",
            )}
            style={{
              borderColor: value === o ? "var(--primary)" : "var(--glass-border)",
              background: "var(--glass)",
            }}
          >
            {o}
          </button>
        ))}
      </div>
    </div>
  );
}

function SettingsScreen() {
  const { theme, setTheme, isPastel } = useTheme();
  const { slider, setSlider, sarcasm, setSarcasm, chaos, setChaos } = usePersonalitySettings();

  return (
    <ModuleScreen moduleKey="settings">
      <section className="glass-panel flex flex-col gap-5 p-6">
        <div>
          <h2 className="text-display text-lg">Appearance</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Two worlds. Switching re-skins everything, including module names.
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          {(["pastel", "scifi"] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTheme(t)}
              className={cn(
                "border px-4 py-2 text-sm capitalize transition-colors",
                isPastel ? "rounded-full" : "rounded-sm",
                theme === t ? "text-foreground" : "text-muted-foreground",
              )}
              style={{
                borderColor: theme === t ? "var(--primary)" : "var(--glass-border)",
                background: "var(--glass)",
              }}
            >
              {t}
            </button>
          ))}
        </div>
        <p className="text-xs text-muted-foreground">
          Tip: triple-click the MOS logo anywhere to get back here.
        </p>
      </section>

      <section className="glass-panel flex flex-col gap-6 p-6">
        <div>
          <h2 className="text-display text-lg">Personality</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            {isPastel
              ? "Warm at the low end, playfully mischievous at the high end. Saved separately for each theme."
              : "Clipped and stoic at the low end, openly sarcastic at the high end. Saved separately for each theme."}
          </p>
        </div>

        <div>
          <div className="flex items-baseline justify-between">
            <h3 className="text-display text-base">
              {isPastel ? "Warmth → Mischief" : "Stoic → Sarcastic"}
            </h3>
            <span className="text-sm text-muted-foreground tabular-nums">{slider}</span>
          </div>
          <Slider
            className="mt-3"
            min={0}
            max={100}
            step={1}
            value={[slider]}
            onValueChange={(v) => setSlider(v[0] ?? slider)}
          />
          <p className="mt-2 text-xs text-muted-foreground">
            Current pool: {slider < 50 ? "low" : "high"} · default for this theme:{" "}
            {defaultSlider(theme)}
          </p>
        </div>

        <Choice
          label="Sarcasm"
          options={["none", "mild", "maximum"] as const}
          value={sarcasm}
          onChange={setSarcasm}
        />
        <p className="-mt-3 text-xs text-muted-foreground">
          “None” keeps overdue and unfinished-task lines in the low pool, whatever the slider says.
        </p>

        <Choice
          label="Chaos"
          options={["minimal", "normal", "goblin"] as const}
          value={chaos}
          onChange={setChaos}
        />
        <p className="-mt-3 text-xs text-muted-foreground">
          “Goblin” mixes bonus lines into the high pool.
        </p>
      </section>

      <NotificationSettings />

      <DataExport />

      <DiaryReset />
    </ModuleScreen>
  );
}

