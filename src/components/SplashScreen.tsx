import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import { useTheme } from "@/lib/theme";

/**
 * Splash screen — shown once per tab session.
 * Uses the generated MOS Duo character image (bear + robot).
 */
export function SplashScreen() {
  const { theme } = useTheme();
  const [show, setShow] = useState(() => !sessionStorage.getItem("mos_splash_seen"));
  const [fade, setFade] = useState(false);

  useEffect(() => {
    if (show) {
      sessionStorage.setItem("mos_splash_seen", "true");
      const t1 = setTimeout(() => setFade(true), 2200);
      const t2 = setTimeout(() => setShow(false), 3000);
      return () => {
        clearTimeout(t1);
        clearTimeout(t2);
      };
    }
  }, [show]);

  if (!show) return null;

  const isPastel = theme === "pastel";

  return (
    <div
      className={cn(
        "fixed inset-0 z-[9999] flex flex-col items-center justify-center transition-opacity duration-700 ease-in-out",
        fade ? "opacity-0 pointer-events-none" : "opacity-100",
      )}
      style={{ background: "var(--background)" }}
    >
      <div className="flex flex-col items-center gap-5 px-6 animate-in slide-in-from-bottom-4 fade-in duration-700 w-full">

        {/* ── Character image ── */}
        <img
          src="/mos_duo.jpg"
          alt="MOS Duo — bear and robot"
          className="w-52 h-52 sm:w-64 sm:h-64 md:w-72 md:h-72 object-contain drop-shadow-md"
          style={{ borderRadius: "1rem" }}
        />

        {/* ── App title ── */}
        <div className="flex flex-col items-center gap-1 text-center">
          <h1
            className="text-display text-4xl font-bold sm:text-5xl"
            style={{ color: "var(--foreground)", letterSpacing: "-0.02em" }}
          >
            MOS
          </h1>
          <p
            className="text-[11px] font-medium uppercase tracking-[0.25em]"
            style={{ color: "var(--muted-foreground)" }}
          >
            {isPastel ? "my little operating system" : "MY OPERATING SYSTEM"}
          </p>
        </div>

        {/* ── Loading dots ── */}
        <div className="flex items-center gap-2" aria-label="Loading">
          {[0, 1, 2].map((i) => (
            <span
              key={i}
              className="inline-block h-1.5 w-1.5 rounded-full animate-bounce"
              style={{
                background: "var(--primary)",
                opacity: 0.6,
                animationDelay: `${i * 0.18}s`,
                animationDuration: "0.85s",
              }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
