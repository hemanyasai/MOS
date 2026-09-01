import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import { useTheme } from "@/lib/theme";

/**
 * Shows the Mo Duo illustration on the very first app load per tab session.
 */
export function SplashScreen() {
  const { theme } = useTheme();
  const [show, setShow] = useState(() => !sessionStorage.getItem("mos_splash_seen"));
  const [fade, setFade] = useState(false);

  useEffect(() => {
    if (show) {
      sessionStorage.setItem("mos_splash_seen", "true");
      
      const t1 = setTimeout(() => setFade(true), 1200);
      const t2 = setTimeout(() => setShow(false), 2000);
      
      return () => {
        clearTimeout(t1);
        clearTimeout(t2);
      };
    }
  }, [show]);

  if (!show) return null;

  return (
    <div
      className={cn(
        "fixed inset-0 z-[100] flex flex-col items-center justify-center transition-opacity duration-700 ease-in-out",
        fade ? "opacity-0 pointer-events-none" : "opacity-100",
      )}
      style={{ background: "var(--background)" }}
    >
      <div className="flex flex-col items-center gap-6 animate-in slide-in-from-bottom-4 fade-in duration-700">
        <img 
          src="/mo_duo.svg" 
          alt="Mo Duo" 
          className="h-32 w-auto object-contain"
          onError={(e) => {
            // Fallback if SVG is missing
            e.currentTarget.style.display = 'none';
          }}
        />
        <div className="flex flex-col items-center text-center">
          <h1 className="text-display text-2xl font-bold tracking-tight">MOS</h1>
          <p className="text-xs text-muted-foreground uppercase tracking-[0.15em] mt-1">
            {theme === "pastel" ? "my little operating system" : "MY OPERATING SYSTEM"}
          </p>
        </div>
      </div>
    </div>
  );
}
