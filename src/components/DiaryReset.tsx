import { useState } from "react";
import { clearDiaryData } from "@/lib/diary";
import { useTheme } from "@/lib/theme";
import { cn } from "@/lib/utils";

const fieldStyle = { borderColor: "var(--glass-border)", background: "var(--glass)" };

/** Only recovery path for a forgotten JB PIN: wipe entries and the stored hash. */
export function DiaryReset() {
  const { isPastel } = useTheme();
  const [confirming, setConfirming] = useState(false);
  const [done, setDone] = useState(false);

  return (
    <section className="glass-panel flex flex-col gap-4 p-6">
      <div>
        <h2 className="text-display text-lg">JB</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Forgot the PIN? There's no recovery — clearing JB removes every entry and the stored PIN.
        </p>
      </div>
      <div className="flex flex-wrap gap-2">
        {confirming ? (
          <>
            <button
              type="button"
              className={cn("border px-4 py-2 text-xs", isPastel ? "rounded-full" : "rounded-sm")}
              style={{ borderColor: "var(--destructive)", background: "var(--glass)", color: "var(--destructive)" }}
              onClick={async () => {
                await clearDiaryData();
                setConfirming(false);
                setDone(true);
              }}
            >
              Yes, clear everything
            </button>
            <button
              type="button"
              className={cn("border px-4 py-2 text-xs", isPastel ? "rounded-full" : "rounded-sm")}
              style={fieldStyle}
              onClick={() => setConfirming(false)}
            >
              Cancel
            </button>
          </>
        ) : (
          <button
            type="button"
            className={cn("border px-4 py-2 text-xs", isPastel ? "rounded-full" : "rounded-sm")}
            style={fieldStyle}
            onClick={() => {
              setDone(false);
              setConfirming(true);
            }}
          >
            Clear JB data
          </button>
        )}
      </div>
      {done && <p className="text-xs text-muted-foreground">JB cleared. You'll set a new PIN next visit.</p>}
    </section>
  );
}
