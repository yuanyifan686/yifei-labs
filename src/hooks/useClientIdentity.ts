"use client";

import { useCallback, useSyncExternalStore } from "react";
import {
  getOrCreateClientToken,
  getPersistHistoryPreference,
  getStoredSessionId,
  setPersistHistoryPreference,
  setStoredSessionId,
} from "@/lib/session/clientIdentity";

/** Tiny browser store so session id updates re-render without setState-in-effect. */
const listeners = new Set<() => void>();

function emit() {
  for (const l of listeners) l();
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function getSessionSnapshot() {
  return getStoredSessionId();
}

function getPersistSnapshot() {
  return getPersistHistoryPreference() ? "1" : "0";
}

function getTokenSnapshot() {
  return getOrCreateClientToken();
}

function getServerSnapshot() {
  return "";
}

function getServerSessionSnapshot(): string | null {
  return null;
}

function getServerPersistSnapshot() {
  return "1";
}

export function useClientIdentity() {
  const clientToken = useSyncExternalStore(
    subscribe,
    getTokenSnapshot,
    getServerSnapshot,
  );
  const sessionId = useSyncExternalStore(
    subscribe,
    getSessionSnapshot,
    getServerSessionSnapshot,
  );
  const persistRaw = useSyncExternalStore(
    subscribe,
    getPersistSnapshot,
    getServerPersistSnapshot,
  );

  const setSessionId = useCallback((id: string | null) => {
    setStoredSessionId(id);
    emit();
  }, []);

  const setPersistHistory = useCallback((enabled: boolean) => {
    setPersistHistoryPreference(enabled);
    emit();
  }, []);

  return {
    ready: Boolean(clientToken) || typeof window !== "undefined",
    clientToken,
    sessionId,
    setSessionId,
    persistHistory: persistRaw !== "0",
    setPersistHistory,
  };
}
