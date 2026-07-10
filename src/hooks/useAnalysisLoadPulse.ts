"use client";

import { useEffect, useState } from "react";
import { getAnalysisLoadAction } from "@/app/apps/job-match/actions";
import type { AnalysisLoadSnapshot } from "@/lib/load/analysisLoadTracker";

const IDLE_POLL_MS = 8000;
const BUSY_POLL_MS = 1500;

/**
 * Poll server for concurrent analysis load while waiting.
 * When busy, also sends heartbeat so "testing now" includes this client.
 */
export function useAnalysisLoadPulse(
  busy: boolean,
  clientToken?: string | null,
) {
  const [load, setLoad] = useState<AnalysisLoadSnapshot | null>(null);

  useEffect(() => {
    let cancelled = false;
    let timer: number | undefined;

    async function tick() {
      try {
        const res = await getAnalysisLoadAction({
          clientToken: clientToken || undefined,
          isBusyUi: busy,
        });
        if (!cancelled && res.ok) setLoad(res.data);
      } catch {
        /* ignore poll errors */
      }
      if (!cancelled) {
        timer = window.setTimeout(tick, busy ? BUSY_POLL_MS : IDLE_POLL_MS);
      }
    }

    void tick();
    return () => {
      cancelled = true;
      if (timer) window.clearTimeout(timer);
    };
  }, [busy, clientToken]);

  return load;
}
