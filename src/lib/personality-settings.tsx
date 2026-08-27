import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import content from "./personality-content.json";
import { useTheme, type ThemeName } from "./theme";

export type SarcasmLevel = "none" | "mild" | "maximum";
export type ChaosLevel = "minimal" | "normal" | "goblin";

const SLIDER_KEY = (theme: ThemeName) => `mos.personality.slider.${theme}`;
const SARCASM_KEY = "mos.personality.sarcasm";
const CHAOS_KEY = "mos.personality.chaos";

/** Per-theme defaults come straight from the content file's _meta.theme_defaults. */
export function defaultSlider(theme: ThemeName): number {
  const d = content._meta.theme_defaults;
  return theme === "pastel" ? d.light_pastel : d.dark_scifi;
}

type Value = {
  slider: number;
  setSlider: (v: number) => void;
  sarcasm: SarcasmLevel;
  setSarcasm: (v: SarcasmLevel) => void;
  chaos: ChaosLevel;
  setChaos: (v: ChaosLevel) => void;
};

const Ctx = createContext<Value | null>(null);

function readNumber(key: string): number | null {
  try {
    const raw = localStorage.getItem(key);
    if (raw === null) return null;
    const n = Number(raw);
    return Number.isFinite(n) ? n : null;
  } catch {
    return null;
  }
}

export function PersonalitySettingsProvider({ children }: { children: ReactNode }) {
  const { theme } = useTheme();
  const [slider, setSliderState] = useState<number>(() => defaultSlider(theme));
  const [sarcasm, setSarcasmState] = useState<SarcasmLevel>("mild");
  const [chaos, setChaosState] = useState<ChaosLevel>("normal");

  // Load per-theme slider (and global selectors) on mount + whenever the theme flips.
  useEffect(() => {
    setSliderState(readNumber(SLIDER_KEY(theme)) ?? defaultSlider(theme));
  }, [theme]);

  useEffect(() => {
    try {
      const s = localStorage.getItem(SARCASM_KEY) as SarcasmLevel | null;
      if (s === "none" || s === "mild" || s === "maximum") setSarcasmState(s);
      const c = localStorage.getItem(CHAOS_KEY) as ChaosLevel | null;
      if (c === "minimal" || c === "normal" || c === "goblin") setChaosState(c);
    } catch {
      /* storage unavailable */
    }
  }, []);

  const persist = (key: string, value: string) => {
    try {
      localStorage.setItem(key, value);
    } catch {
      /* storage unavailable */
    }
  };

  return (
    <Ctx.Provider
      value={{
        slider,
        setSlider: (v) => {
          setSliderState(v);
          persist(SLIDER_KEY(theme), String(v));
        },
        sarcasm,
        setSarcasm: (v) => {
          setSarcasmState(v);
          persist(SARCASM_KEY, v);
        },
        chaos,
        setChaos: (v) => {
          setChaosState(v);
          persist(CHAOS_KEY, v);
        },
      }}
    >
      {children}
    </Ctx.Provider>
  );
}

export function usePersonalitySettings(): Value {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("usePersonalitySettings must be used inside PersonalitySettingsProvider");
  return ctx;
}
