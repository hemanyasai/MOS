import { useEffect, useState } from "react";
import { getPinHash, isValidPin, setPin, verifyPin } from "@/lib/diary";
import { useTheme } from "@/lib/theme";
import { cn } from "@/lib/utils";

const fieldStyle = { borderColor: "var(--glass-border)", background: "var(--glass)" };

/** PIN gate for JB. Renders nothing but the lock until the session is unlocked. */
export function DiaryLock({ onUnlock }: { onUnlock: () => void }) {
  const { isPastel } = useTheme();
  const [hasPin, setHasPin] = useState<boolean | null>(null);
  const [pin, setPinValue] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void getPinHash().then((h) => setHasPin(h !== null));
  }, []);

  if (hasPin === null) return null;

  const setup = !hasPin;

  async function submit() {
    setError(null);
    if (!isValidPin(pin)) {
      setError("PIN must be 4–6 digits.");
      return;
    }
    if (setup) {
      if (pin !== confirm) {
        setError("The two PINs don't match.");
        return;
      }
      await setPin(pin);
      onUnlock();
      return;
    }
    if (await verifyPin(pin)) {
      onUnlock();
    } else {
      setError("Wrong PIN.");
      setPinValue("");
    }
  }

  return (
    <section className="glass-panel mx-auto flex w-full max-w-sm flex-col gap-4 p-6">
      <div>
        <h2 className="text-display text-lg">{setup ? "Set a PIN" : "Locked"}</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          {setup
            ? "4–6 digits. Only a hash is stored on this device — there's no recovery, just a reset in Settings."
            : "Enter your PIN to open JB."}
        </p>
      </div>
      <input
        autoFocus
        type="password"
        inputMode="numeric"
        maxLength={6}
        value={pin}
        onChange={(e) => setPinValue(e.target.value.replace(/\D/g, ""))}
        onKeyDown={(e) => {
          if (e.key === "Enter" && !setup) void submit();
        }}
        placeholder="PIN"
        aria-label="PIN"
        className={cn("border px-3 py-2 text-sm tracking-[0.4em] placeholder:tracking-normal", isPastel ? "rounded-2xl" : "rounded-sm")}
        style={fieldStyle}
      />
      {setup && (
        <input
          type="password"
          inputMode="numeric"
          maxLength={6}
          value={confirm}
          onChange={(e) => setConfirm(e.target.value.replace(/\D/g, ""))}
          onKeyDown={(e) => {
            if (e.key === "Enter") void submit();
          }}
          placeholder="Confirm PIN"
          aria-label="Confirm PIN"
          className={cn("border px-3 py-2 text-sm tracking-[0.4em] placeholder:tracking-normal", isPastel ? "rounded-2xl" : "rounded-sm")}
          style={fieldStyle}
        />
      )}
      {error && (
        <p className="text-xs" style={{ color: "var(--destructive)" }}>
          {error}
        </p>
      )}
      <button
        type="button"
        onClick={() => void submit()}
        className={cn("border px-4 py-2 text-sm transition-colors", isPastel ? "rounded-full" : "rounded-sm")}
        style={{ borderColor: "var(--primary)", background: "var(--glass)", color: "var(--primary)" }}
      >
        {setup ? "Save PIN" : "Unlock"}
      </button>
    </section>
  );
}
