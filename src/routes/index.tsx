import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useRef } from "react";

import { ModuleScreen } from "@/components/ModuleScreen";
import { NextPeriodNote } from "@/components/NextPeriodNote";
import { ScheduleNote } from "@/components/ScheduleNote";
import { useLongPress } from "@/hooks/use-secret-gestures";
import { usePersonalityGreetingState } from "@/hooks/use-personality";
import { useTheme } from "@/lib/theme";
import { cn } from "@/lib/utils";
import { getModule, NAV_MODULES } from "@/lib/modules";
import { Link } from "@tanstack/react-router";
import { Box, PawPrint } from "lucide-react";


export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "MOS — Nest / Dock" },
      {
        name: "description",
        content:
          "MOS (My Operating System): a private, offline personal dashboard for daily tracking, timetables, diary and important dates.",
      },
      { property: "og:title", content: "MOS — My Operating System" },
      {
        property: "og:description",
        content: "A private, offline personal dashboard with two full re-skinnable themes.",
      },
    ],
  }),
  component: HomeScreen,
});

/** Desktop fallback entry to the brain dump (shake is the primary gesture). */
function SecretDumpCorner() {
  const navigate = useNavigate();
  const { isPastel } = useTheme();
  const go = () => navigate({ to: "/dump" });
  const longPress = useLongPress(go);
  const Icon = isPastel ? PawPrint : Box;

  return (
    <button
      {...longPress}
      onClick={go}
      aria-label="?"
      title=""
      className={cn(
        "fixed bottom-24 right-5 grid h-9 w-9 place-items-center border opacity-30 transition-opacity hover:opacity-70 md:bottom-6 md:right-6",
        isPastel ? "rounded-2xl" : "rounded-sm",
      )}
      style={{ borderColor: "var(--glass-border)", background: "var(--glass)" }}
    >
      <Icon className="h-4 w-4" style={{ color: "var(--muted-foreground)" }} />
    </button>
  );

}

/** Double-tapping today's date is an alternate way into the calendar module. */
function TodayDate() {
  const navigate = useNavigate();
  const last = useRef(0);
  const go = () => navigate({ to: "/almanac" });
  return (
    <button
      type="button"
      onDoubleClick={go}
      onClick={() => {
        const now = Date.now();
        if (now - last.current < 400) go();
        last.current = now;
      }}
      title="Double-tap to open the calendar"
      className="w-fit text-left text-sm text-muted-foreground"
    >
      {new Date().toLocaleDateString(undefined, {
        weekday: "long",
        month: "long",
        day: "numeric",
      })}
    </button>
  );
}


function HomeScreen() {

  const { theme } = useTheme();
  const { line: greeting, expression } = usePersonalityGreetingState();
  const others = NAV_MODULES.filter((m) => m.key !== "home");

  return (
    <ModuleScreen
      moduleKey="home"
      corner={<SecretDumpCorner />}
      mascotExpression={expression}
      {...(greeting ? { subtitle: greeting } : {})}
    >
      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {others.map((m) => {
          const Icon = m.icons[theme];
          return (
            <Link
              key={m.key}
              to={m.path}
              className="glass-panel flex flex-col gap-3 p-5 transition-transform hover:-translate-y-0.5"
            >
              <Icon className="h-5 w-5" style={{ color: "var(--primary)" }} />
              <span className="text-display text-lg">{m.names[theme]}</span>
              <span className="text-sm text-muted-foreground">{m.taglines[theme]}</span>
            </Link>
          );
        })}
        <div className="glass-panel flex flex-col justify-center gap-2 p-5">
          <span className="text-display text-lg">{getModule("home").names[theme]}</span>
          <TodayDate />
          <span className="text-sm text-muted-foreground">
            {theme === "pastel"
              ? "Everything lives on this device only. No accounts, no clouds."
              : "Local storage only. No uplink, no telemetry."}
          </span>
          <NextPeriodNote />
          <ScheduleNote />
        </div>

      </section>
    </ModuleScreen>
  );
}
