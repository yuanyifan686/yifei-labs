export type ThemeMode = "dark" | "light";

export type FxPreferences = {
  sound: boolean;
  haptic: boolean;
  ambient: boolean;
  /** 3D skill constellation on results; default on (desktop WebGL). */
  skillStar3d: boolean;
};

export const THEME_STORAGE_KEY = "yl-theme";
export const FX_STORAGE_KEY = "yl-fx";

export const DEFAULT_FX: FxPreferences = {
  sound: false,
  haptic: false,
  ambient: true,
  skillStar3d: true,
};

export function readTheme(): ThemeMode {
  if (typeof window === "undefined") return "dark";
  try {
    const raw = window.localStorage.getItem(THEME_STORAGE_KEY);
    return raw === "light" ? "light" : "dark";
  } catch {
    return "dark";
  }
}

export function writeTheme(theme: ThemeMode) {
  try {
    window.localStorage.setItem(THEME_STORAGE_KEY, theme);
  } catch {
    /* ignore */
  }
}

export function readFxPreferences(): FxPreferences {
  if (typeof window === "undefined") return { ...DEFAULT_FX };
  try {
    const raw = window.localStorage.getItem(FX_STORAGE_KEY);
    if (!raw) return { ...DEFAULT_FX };
    const parsed = JSON.parse(raw) as Partial<FxPreferences>;
    return {
      sound: Boolean(parsed.sound),
      haptic: Boolean(parsed.haptic),
      ambient: parsed.ambient !== false,
      skillStar3d: parsed.skillStar3d !== false,
    };
  } catch {
    return { ...DEFAULT_FX };
  }
}

export function writeFxPreferences(prefs: FxPreferences) {
  try {
    window.localStorage.setItem(FX_STORAGE_KEY, JSON.stringify(prefs));
  } catch {
    /* ignore */
  }
}
