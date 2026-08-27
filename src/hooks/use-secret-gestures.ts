import { useCallback, useRef } from "react";

/** Fires after `count` rapid clicks (default 3) within `window` ms. */
export function useMultiClick(onTrigger: () => void, count = 3, windowMs = 600) {
  const clicks = useRef<number[]>([]);
  return useCallback(() => {
    const now = Date.now();
    clicks.current = [...clicks.current, now].filter((t) => now - t < windowMs);
    if (clicks.current.length >= count) {
      clicks.current = [];
      onTrigger();
    }
  }, [onTrigger, count, windowMs]);
}

/** Long-press (default 550ms) handlers for mouse + touch. */
export function useLongPress(onTrigger: () => void, delay = 550) {
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const start = useCallback(() => {
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(onTrigger, delay);
  }, [onTrigger, delay]);

  const cancel = useCallback(() => {
    if (timer.current) clearTimeout(timer.current);
    timer.current = null;
  }, []);

  return {
    onMouseDown: start,
    onMouseUp: cancel,
    onMouseLeave: cancel,
    onTouchStart: start,
    onTouchEnd: cancel,
    onTouchCancel: cancel,
  };
}
