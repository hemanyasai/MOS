import { useEffect } from "react";
import { runNotificationChecks } from "@/lib/notifications";

/** Fires the digest/deadline checks on load and whenever MOS comes back to the foreground. */
export function NotificationRunner() {
  useEffect(() => {
    const run = () => {
      void runNotificationChecks();
    };
    run();
    const onVisible = () => {
      if (document.visibilityState === "visible") run();
    };
    document.addEventListener("visibilitychange", onVisible);
    window.addEventListener("focus", run);
    
    // Background polling for precise time-based notifications (every 60s)
    const interval = setInterval(run, 60000);
    
    return () => {
      document.removeEventListener("visibilitychange", onVisible);
      window.removeEventListener("focus", run);
      clearInterval(interval);
    };
  }, []);

  return null;
}
