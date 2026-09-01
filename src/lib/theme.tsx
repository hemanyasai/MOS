import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

export type ThemeName = "pastel" | "scifi";

const STORAGE_KEY = "mos.theme";

type ThemeContextValue = {
  theme: ThemeName;
  setTheme: (t: ThemeName) => void;
  toggleTheme: () => void;
  isPastel: boolean;
};

const ThemeContext = createContext<ThemeContextValue | null>(null);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<ThemeName>("pastel");

  // Auto-detect system preference on load, unless the user already chose one.
  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY) as ThemeName | null;
    if (stored === "pastel" || stored === "scifi") {
      setThemeState(stored);
      return;
    }
    const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    setThemeState(prefersDark ? "scifi" : "pastel");
  }, []);

  useEffect(() => {
    const root = document.documentElement;
    root.classList.toggle("dark", theme === "scifi");
    root.dataset["theme"] = theme;
    root.style.colorScheme = theme === "scifi" ? "dark" : "light";

    // Update the PWA title bar color dynamically
    let metaThemeColor = document.querySelector("meta[name=theme-color]");
    if (!metaThemeColor) {
      metaThemeColor = document.createElement("meta");
      metaThemeColor.setAttribute("name", "theme-color");
      document.head.appendChild(metaThemeColor);
    }
    // #0b0f19 approximates the Scifi oklch(0.19 0.055 273) background
    // #f9f6ef approximates the Pastel oklch(0.96 0.028 84) background
    metaThemeColor.setAttribute("content", theme === "scifi" ? "#0b0f19" : "#f9f6ef");
  }, [theme]);

  const setTheme = (t: ThemeName) => {
    localStorage.setItem(STORAGE_KEY, t);
    setThemeState(t);
  };

  return (
    <ThemeContext.Provider
      value={{
        theme,
        setTheme,
        toggleTheme: () => setTheme(theme === "pastel" ? "scifi" : "pastel"),
        isPastel: theme === "pastel",
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme must be used inside ThemeProvider");
  return ctx;
}
