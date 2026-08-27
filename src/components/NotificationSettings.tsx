import { useLiveQuery } from "dexie-react-hooks";
import { useEffect, useState } from "react";
import { db } from "@/lib/db";
import {
  DEFAULT_DIGEST_TIME,
  DIGEST_TIME,
  NOTIF_ENABLED,
  permissionState,
  requestPermission,
  runNotificationChecks,
  setDigestTime,
  setNotifEnabled,
  DEFAULT_QUIET_START,
  DEFAULT_QUIET_END,
  QUIET_START,
  QUIET_END,
  setQuietStart,
  setQuietEnd,
} from "@/lib/notifications";
import { useTheme } from "@/lib/theme";
import { cn } from "@/lib/utils";

const fieldStyle = { borderColor: "var(--glass-border)", background: "var(--glass)" };

export function NotificationSettings() {
  const { isPastel } = useTheme();
  const [permission, setPermission] = useState<NotificationPermission | "unsupported">(() =>
    permissionState(),
  );
  const stored = useLiveQuery(
    async () => (await db.settings.get(NOTIF_ENABLED))?.value !== false,
    [],
    true,
  );

  // Always trust the browser's live permission value, not a stale stored flag.
  useEffect(() => {
    const sync = () => setPermission(permissionState());
    sync();
    document.addEventListener("visibilitychange", sync);
    window.addEventListener("focus", sync);
    return () => {
      document.removeEventListener("visibilitychange", sync);
      window.removeEventListener("focus", sync);
    };
  }, []);

  const granted = permission === "granted";
  const enabled = granted && stored;

  // Keep the persisted flag in step with a granted permission.
  useEffect(() => {
    if (granted && stored) void setNotifEnabled(true);
  }, [granted, stored]);
  const time = useLiveQuery(
    async () => ((await db.settings.get(DIGEST_TIME))?.value as string) ?? DEFAULT_DIGEST_TIME,
    [],
    DEFAULT_DIGEST_TIME,
  );
  const quietStart = useLiveQuery(
    async () => ((await db.settings.get(QUIET_START))?.value as string) ?? DEFAULT_QUIET_START,
    [],
    DEFAULT_QUIET_START,
  );
  const quietEnd = useLiveQuery(
    async () => ((await db.settings.get(QUIET_END))?.value as string) ?? DEFAULT_QUIET_END,
    [],
    DEFAULT_QUIET_END,
  );

  const unsupported = permission === "unsupported";

  return (
    <section className="glass-panel flex flex-col gap-5 p-6">
      <div>
        <h2 className="text-display text-lg">Notifications</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          A single morning digest of today's classes, plus deadline nudges.
        </p>
      </div>

      <label className="flex flex-wrap items-center gap-3 text-sm">
        <span className="w-44 text-muted-foreground">Morning digest time</span>
        <input
          type="time"
          value={time}
          onChange={(e) => void setDigestTime(e.target.value)}
          className={cn("border px-3 py-2 text-sm", isPastel ? "rounded-2xl" : "rounded-sm")}
          style={fieldStyle}
        />
      </label>

      <div className="flex flex-wrap items-center gap-3 text-sm">
        <span className="w-44 text-muted-foreground">Quiet hours</span>
        <input
          type="time"
          aria-label="Quiet hours start"
          value={quietStart}
          onChange={(e) => void setQuietStart(e.target.value)}
          className={cn("border px-3 py-2 text-sm", isPastel ? "rounded-2xl" : "rounded-sm")}
          style={fieldStyle}
        />
        <span className="text-muted-foreground">to</span>
        <input
          type="time"
          aria-label="Quiet hours end"
          value={quietEnd}
          onChange={(e) => void setQuietEnd(e.target.value)}
          className={cn("border px-3 py-2 text-sm", isPastel ? "rounded-2xl" : "rounded-sm")}
          style={fieldStyle}
        />
      </div>
      <p className="-mt-3 text-xs text-muted-foreground">
        Nothing fires inside this window — skipped reminders arrive the next time you open MOS after
        quiet hours end.
      </p>

      <div className="flex flex-wrap items-center gap-3">
        <span className="w-44 text-sm text-muted-foreground">Enable notifications</span>
        <button
          type="button"
          role="switch"
          aria-checked={enabled}
          disabled={unsupported}
          onClick={async () => {
            if (enabled) {
              await setNotifEnabled(false);
              return;
            }
            const ok = permissionState() === "granted" ? true : await requestPermission();
            setPermission(permissionState());
            if (ok) {
              await setNotifEnabled(true);
              void runNotificationChecks();
            }
          }}
          className={cn(
            "border px-4 py-2 text-xs transition-colors disabled:opacity-50",
            isPastel ? "rounded-full" : "rounded-sm",
          )}
          style={{
            borderColor: enabled ? "var(--primary)" : "var(--glass-border)",
            background: "var(--glass)",
            color: enabled ? "var(--primary)" : undefined,
          }}
        >
          {enabled ? "On" : "Off"}
        </button>
      </div>

      {permission === "denied" && (
        <p className="text-xs text-muted-foreground">
          Your browser declined the permission — allow notifications for this site, then try again.
        </p>
      )}
      {unsupported && (
        <p className="text-xs text-muted-foreground">
          This browser doesn't support notifications.
        </p>
      )}

      <p className="text-xs text-muted-foreground">
        Works best while MOS is open on your phone. Always-on background reminders arrive with the
        full app version.
      </p>
    </section>
  );
}
