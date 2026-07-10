"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import {
  DEFAULT_FX,
  FxPreferences,
  readFxPreferences,
  readTheme,
  ThemeMode,
  writeFxPreferences,
  writeTheme,
} from "@/lib/fx/preferences";

type ThemeContextValue = {
  theme: ThemeMode;
  setTheme: (theme: ThemeMode) => void;
  toggleTheme: () => void;
  fx: FxPreferences;
  setFx: (patch: Partial<FxPreferences>) => void;
  ready: boolean;
};

const ThemeContext = createContext<ThemeContextValue | null>(null);

function applyTheme(theme: ThemeMode) {
  document.documentElement.dataset.theme = theme;
  document.documentElement.style.colorScheme = theme;
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<ThemeMode>("dark");
  const [fx, setFxState] = useState<FxPreferences>(DEFAULT_FX);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const nextTheme = readTheme();
    const nextFx = readFxPreferences();
    applyTheme(nextTheme);
    queueMicrotask(() => {
      setThemeState(nextTheme);
      setFxState(nextFx);
      setReady(true);
    });
  }, []);

  const setTheme = useCallback((next: ThemeMode) => {
    setThemeState(next);
    writeTheme(next);
    applyTheme(next);
  }, []);

  const toggleTheme = useCallback(() => {
    setThemeState((prev) => {
      const next = prev === "dark" ? "light" : "dark";
      writeTheme(next);
      applyTheme(next);
      return next;
    });
  }, []);

  const setFx = useCallback((patch: Partial<FxPreferences>) => {
    setFxState((prev) => {
      const next = { ...prev, ...patch };
      writeFxPreferences(next);
      return next;
    });
  }, []);

  const value = useMemo(
    () => ({ theme, setTheme, toggleTheme, fx, setFx, ready }),
    [theme, setTheme, toggleTheme, fx, setFx, ready],
  );

  return (
    <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
  );
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) {
    return {
      theme: "dark" as ThemeMode,
      setTheme: () => undefined,
      toggleTheme: () => undefined,
      fx: DEFAULT_FX,
      setFx: () => undefined,
      ready: false,
    };
  }
  return ctx;
}
