import { Mascot, type MascotExpression } from "@/components/Mascot";
import {
  usePersonalityEmptyState,
  usePersonalityGreetingState,
} from "@/hooks/use-personality";
import { getModule, type ModuleKey } from "@/lib/modules";
import { useTheme } from "@/lib/theme";
import type { ReactNode } from "react";

export function ModuleScreen({
  moduleKey,
  children,
  corner,
  subtitle,
  mascotExpression,
}: {
  moduleKey: ModuleKey;
  children?: ReactNode;
  corner?: ReactNode;
  subtitle?: ReactNode;
  mascotExpression?: MascotExpression;
}) {
  const { theme } = useTheme();
  const mod = getModule(moduleKey);
  const emptyLine = usePersonalityEmptyState();
  const { expression: greetingExpression } = usePersonalityGreetingState();
  const expression = mascotExpression ?? greetingExpression;

  return (
    <div className="relative mx-auto flex w-full max-w-5xl flex-col gap-8">
      <header className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-6">
        <div className="min-w-0">
          <p className="text-[11px] uppercase tracking-[0.22em] text-muted-foreground">
            {theme === "pastel" ? "module" : "sector"}
          </p>
          <h1 className="mt-1 truncate text-display text-3xl font-semibold md:text-4xl">
            {mod.names[theme]}
          </h1>
          <p className="mt-2 max-w-md text-sm text-muted-foreground">
            {subtitle ?? mod.taglines[theme]}
          </p>
        </div>
        <Mascot size={88} className="shrink-0" expression={expression} />
      </header>

      {children ?? (
        <section className="glass-panel grid min-h-[42vh] place-items-center p-10 text-center">
          <div className="max-w-sm">
            <p className="text-display text-lg">
              {emptyLine ?? (theme === "pastel" ? "Nothing here yet" : "No signal here yet")}
            </p>
          </div>
        </section>
      )}

      {corner}
    </div>
  );
}
