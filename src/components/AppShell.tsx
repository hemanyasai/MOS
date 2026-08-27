import { Link, useNavigate } from "@tanstack/react-router";
import { Moon, Sun, X } from "lucide-react";
import { Mascot } from "@/components/Mascot";
import { useMultiClick, useLongPress } from "@/hooks/use-secret-gestures";
import { usePersonalityGreetingState } from "@/hooks/use-personality";
import { NAV_MODULES } from "@/lib/modules";
import { useTheme } from "@/lib/theme";
import { cn } from "@/lib/utils";
import { useState, type ReactNode } from "react";
import { SplashScreen } from "@/components/SplashScreen";

function Logo({ onLongPress }: { onLongPress?: () => void }) {
  const { theme, isPastel } = useTheme();
  const navigate = useNavigate();
  const { expression } = usePersonalityGreetingState();
  // Hidden feature: triple-click the MOS logo -> Settings.
  const onClick = useMultiClick(() => navigate({ to: "/settings" }));
  const longPressProps = useLongPress(() => {
    if (onLongPress) onLongPress();
  });

  return (
    <button
      onClick={onClick}
      {...longPressProps}
      title="MOS"
      className="flex min-w-0 items-center gap-3 rounded-lg px-1 py-1 text-left transition-opacity hover:opacity-80"
    >
      <span
        className={cn(
          "grid h-9 w-9 shrink-0 place-items-center border",
          isPastel ? "rounded-2xl" : "rounded-sm",
        )}
        style={{
          borderColor: "var(--glass-border)",
          background: "var(--glass)",
        }}
      >
        <Mascot size={26} expression={expression} />
      </span>
      <span className="min-w-0">
        <span className="block truncate text-display text-base font-semibold">MOS</span>
        <span className="block truncate text-[11px] tracking-wide text-muted-foreground">
          {theme === "pastel" ? "my little operating system" : "MY OPERATING SYSTEM"}
        </span>
      </span>
    </button>
  );
}

function ThemeToggle() {
  const { theme, toggleTheme, isPastel } = useTheme();
  return (
    <button
      onClick={toggleTheme}
      aria-label="Switch theme"
      className={cn(
        "group fixed bottom-24 left-5 z-50 grid h-9 place-items-center border px-3 transition-opacity hover:opacity-80 md:bottom-6 md:left-6",
        isPastel ? "rounded-full" : "rounded-sm",
      )}
      style={{ borderColor: "var(--glass-border)", background: "var(--glass)" }}
    >
      <div className="flex items-center gap-2 text-xs text-muted-foreground transition-colors group-hover:text-foreground">
        {!isPastel ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
        <span className="hidden sm:inline">{theme === "pastel" ? "Scifi" : "Pastel"}</span>
      </div>
    </button>
  );
}

function NavItems({ orientation }: { orientation: "sidebar" | "bar" }) {
  const { theme, isPastel } = useTheme();

  return (
    <>
      {NAV_MODULES.map((m) => {
        const Icon = m.icons[theme];
        return (
          <Link
            key={m.key}
            to={m.path}
            activeOptions={{ exact: m.path === "/" }}
            className={cn(
              "group flex items-center gap-3 border border-transparent transition-colors",
              isPastel ? "rounded-2xl" : "rounded-sm",
              orientation === "sidebar"
                ? "px-3 py-2.5 text-sm"
                : "min-w-0 flex-1 flex-col gap-1 px-1 py-2 text-[10px]",
              "text-muted-foreground hover:text-foreground",
            )}
            activeProps={{
              className: "!text-foreground",
              style: {
                background: "var(--glass)",
                borderColor: "var(--glass-border)",
              },
            }}
          >
            <Icon className="h-[18px] w-[18px] shrink-0" style={{ color: "var(--primary)" }} />
            <span className="truncate">{m.names[theme]}</span>
          </Link>
        );
      })}
    </>
  );
}

export function AppShell({ children }: { children: ReactNode }) {
  const { theme } = useTheme();
  const [showEasterEgg, setShowEasterEgg] = useState(false);

  return (
    <div className="min-h-screen">
      <SplashScreen />

      {/* Desktop: fixed sidebar panel */}
      <aside className="fixed bottom-0 left-0 top-0 z-40 hidden w-64 flex-col border-r bg-background/50 p-4 pb-8 backdrop-blur-xl md:flex">
        <Logo onLongPress={() => setShowEasterEgg(true)} />
        <div className="mt-8 flex flex-col gap-1">
          <NavItems orientation="sidebar" />
        </div>
      </aside>

      {/* Mobile: top bar */}
      <header className="flex items-center justify-between gap-4 px-4 pt-4 md:hidden">
        <Logo onLongPress={() => setShowEasterEgg(true)} />
      </header>

      <ThemeToggle />

      <main className="px-4 pb-28 pt-6 md:ml-64 md:px-10 md:pb-12 md:pt-10">{children}</main>

      {/* Mobile: bottom tab bar */}
      <nav
        className="fixed inset-x-3 bottom-3 flex items-stretch gap-1 p-1.5 md:hidden glass-panel"
        style={{ borderRadius: "var(--radius-2xl)" }}
      >
        <NavItems orientation="bar" />
      </nav>

      {/* Mo Duo Easter Egg Modal */}
      {showEasterEgg && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-background/80 p-4 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="glass-panel relative flex max-w-sm flex-col items-center gap-6 p-8 text-center animate-in zoom-in-95 duration-300">
            <button
              onClick={() => setShowEasterEgg(false)}
              className="absolute right-3 top-3 rounded-full p-1.5 opacity-50 transition-opacity hover:bg-black/5 hover:opacity-100"
            >
              <X className="h-4 w-4" />
            </button>
            <img 
              src="/mo_duo.svg" 
              alt="Mo Duo" 
              className="h-40 w-auto object-contain"
              onError={(e) => {
                e.currentTarget.style.display = 'none';
              }}
            />
            <div>
              <h2 className="text-display text-xl font-bold tracking-tight">MOS</h2>
              <p className="mt-1 text-xs text-muted-foreground uppercase tracking-[0.15em]">
                {theme === "pastel" ? "my little operating system" : "MY OPERATING SYSTEM"}
              </p>
            </div>
            <p className="mt-2 text-sm text-muted-foreground">
              A private, offline companion. 
              <br />Two moods, one Mo.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
