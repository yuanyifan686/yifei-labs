/**
 * Browser-side weak identity + session continuity (no full auth).
 * Used for history isolation and multi-step analysis resume.
 */

const CLIENT_TOKEN_KEY = "yl-client-token";
const SESSION_ID_KEY = "yl-analysis-session-id";
const PERSIST_HISTORY_KEY = "yl-persist-history";

function randomToken(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `ct_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 12)}`;
}

export function getOrCreateClientToken(): string {
  if (typeof window === "undefined") return "";
  try {
    const existing = window.localStorage.getItem(CLIENT_TOKEN_KEY);
    if (existing && existing.length >= 8) return existing;
    const token = randomToken();
    window.localStorage.setItem(CLIENT_TOKEN_KEY, token);
    return token;
  } catch {
    return randomToken();
  }
}

export function getStoredSessionId(): string | null {
  if (typeof window === "undefined") return null;
  try {
    return window.localStorage.getItem(SESSION_ID_KEY);
  } catch {
    return null;
  }
}

export function setStoredSessionId(sessionId: string | null) {
  if (typeof window === "undefined") return;
  try {
    if (sessionId) window.localStorage.setItem(SESSION_ID_KEY, sessionId);
    else window.localStorage.removeItem(SESSION_ID_KEY);
  } catch {
    /* ignore quota */
  }
}

/** When false, server should skip durable archive (still may keep in-memory for the run). */
export function getPersistHistoryPreference(): boolean {
  if (typeof window === "undefined") return true;
  try {
    const raw = window.localStorage.getItem(PERSIST_HISTORY_KEY);
    if (raw === null) return true;
    return raw !== "0" && raw !== "false";
  } catch {
    return true;
  }
}

export function setPersistHistoryPreference(enabled: boolean) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(PERSIST_HISTORY_KEY, enabled ? "1" : "0");
  } catch {
    /* ignore */
  }
}
