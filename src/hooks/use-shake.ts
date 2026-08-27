import { useEffect, useRef } from "react";

type MotionCtor = typeof DeviceMotionEvent & {
  requestPermission?: () => Promise<"granted" | "denied">;
};

/**
 * Fires `onShake` when the device is shaken. iOS 13+ requires an explicit
 * permission request from inside a user gesture, so we lazily ask on the
 * first tap/click and then attach the listener.
 */
export function useShake(onShake: () => void, threshold = 22, cooldownMs = 1200) {
  const cb = useRef(onShake);
  cb.current = onShake;

  useEffect(() => {
    if (typeof window === "undefined" || typeof DeviceMotionEvent === "undefined") return;

    let attached = false;
    let last = 0;

    const onMotion = (e: DeviceMotionEvent) => {
      const a = e.accelerationIncludingGravity;
      if (!a) return;
      const magnitude = Math.hypot(a.x ?? 0, a.y ?? 0, a.z ?? 0);
      // gravity is ~9.8, so the delta above it is what counts as a shake
      if (magnitude - 9.8 < threshold) return;
      const now = Date.now();
      if (now - last < cooldownMs) return; // debounce: one shake, one trigger
      last = now;
      cb.current();
    };

    const attach = () => {
      if (attached) return;
      attached = true;
      window.addEventListener("devicemotion", onMotion);
    };

    const ctor = DeviceMotionEvent as MotionCtor;
    if (typeof ctor.requestPermission === "function") {
      const ask = () => {
        ctor
          .requestPermission?.()
          .then((res) => {
            if (res === "granted") attach();
          })
          .catch(() => undefined);
        window.removeEventListener("pointerdown", ask);
      };
      window.addEventListener("pointerdown", ask, { once: true });
      return () => {
        window.removeEventListener("pointerdown", ask);
        window.removeEventListener("devicemotion", onMotion);
      };
    }

    attach();
    return () => window.removeEventListener("devicemotion", onMotion);
  }, [threshold, cooldownMs]);
}
