import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import { useTheme } from "@/lib/theme";

/**
 * Shows the Mo Duo illustration on the very first app load per tab session.
 */
export function SplashScreen() {
  const { theme } = useTheme();
  const [show, setShow] = useState(false);
  const [fade, setFade] = useState(false);

  useEffect(() => {
    // Only show once per session
    if (!sessionStorage.getItem("mos_splash_seen")) {
      setShow(true);
      sessionStorage.setItem("mos_splash_seen", "true");
      
      // Start fading out after 1.2s
      const t1 = setTimeout(() => setFade(true), 1200);
      // Remove from DOM after transition completes
      const t2 = setTimeout(() => setShow(false), 2000);
      
      return () => {
        clearTimeout(t1);
        clearTimeout(t2);
      };
    }
  }, []);

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
