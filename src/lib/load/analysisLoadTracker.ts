/**
 * In-process analysis concurrency + busy heartbeats.
 * Good for single-node / local multi-user tests.
 * Multi-instance deploys: each instance has its own counters (shown as approximate).
 */

export type AnalysisLoadSnapshot = {
  /** Running AI/analysis slots right now */
  active: number;
  /** Requests waiting for a free slot */
  waiting: number;
  /** Max parallel analysis slots */
  maxConcurrent: number;
  /** Approximate people currently testing (slots + busy heartbeats) */
  testingNow: number;
  /** True if a new request would join the queue */
  needsQueue: boolean;
  /** Rough wait estimate in seconds for a new/queued request */
  estimatedWaitSec: number;
  /** Human-readable status line */
  statusLine: string;
  /** Honesty about scope */
  scopeNote: string;
};

type Waiter = {
  resolve: () => void;
  enqueuedAt: number;
};

const DEFAULT_MAX = 3;
const BUSY_TTL_MS = 25_000;
const AVG_JOB_SEC = 18;

let active = 0;
const waitQueue: Waiter[] = [];
/** clientToken / anonymous id → last heartbeat while UI busy */
const busyHeartbeats = new Map<string, number>();

function maxConcurrent(): number {
  const raw = Number(process.env.AI_MAX_CONCURRENT || DEFAULT_MAX);
  if (!Number.isFinite(raw) || raw < 1) return DEFAULT_MAX;
  return Math.min(20, Math.floor(raw));
}

function pruneHeartbeats(now = Date.now()) {
  for (const [id, ts] of busyHeartbeats) {
    if (now - ts > BUSY_TTL_MS) busyHeartbeats.delete(id);
  }
}

export function pulseBusyClient(clientId?: string | null) {
  if (!clientId || clientId.length < 4) return;
  busyHeartbeats.set(clientId.slice(0, 80), Date.now());
  pruneHeartbeats();
}

export function clearBusyClient(clientId?: string | null) {
  if (!clientId) return;
  busyHeartbeats.delete(clientId.slice(0, 80));
}

function estimateWaitSec(waitingAhead: number, activeNow: number, max: number): number {
  if (waitingAhead <= 0 && activeNow < max) return 0;
  // Rough: each free slot every ~AVG_JOB_SEC / max throughput
  const throughputPerSec = Math.max(max, 1) / AVG_JOB_SEC;
  const jobsAhead = waitingAhead + Math.max(0, activeNow - max + 1);
  return Math.min(180, Math.max(5, Math.round(jobsAhead / throughputPerSec)));
}

export function getAnalysisLoadSnapshot(
  options?: { clientId?: string; isBusyUi?: boolean },
): AnalysisLoadSnapshot {
  if (options?.isBusyUi) {
    pulseBusyClient(options.clientId || `anon-${Date.now() % 1e6}`);
  }
  pruneHeartbeats();

  const max = maxConcurrent();
  const waiting = waitQueue.length;
  const heartbeatCount = busyHeartbeats.size;
  // Prefer real slots; heartbeats catch people mid-request on this process
  const testingNow = Math.max(active + waiting, heartbeatCount, active);
  const needsQueue = active >= max || waiting > 0;
  const estimatedWaitSec = estimateWaitSec(waiting, active, max);

  let statusLine: string;
  if (testingNow <= 1 && !needsQueue) {
    statusLine = "当前基本空闲，无需排队";
  } else if (!needsQueue) {
    statusLine = `当前约 ${testingNow} 人在测评，通道空闲，无需排队`;
  } else if (waiting === 0) {
    statusLine = `当前 ${active} 路分析已满（上限 ${max}），新请求将排队`;
  } else {
    statusLine = `当前约 ${testingNow} 人在测评，排队 ${waiting} 人，预计等待约 ${estimatedWaitSec} 秒`;
  }

  return {
    active,
    waiting,
    maxConcurrent: max,
    testingNow,
    needsQueue,
    estimatedWaitSec,
    statusLine,
    scopeNote:
      "统计基于当前服务进程；多实例部署时为各节点近似值。",
  };
}

/**
 * Acquire a concurrency slot (queue if full), run work, then release.
 */
export async function withAnalysisSlot<T>(
  _label: string,
  fn: () => Promise<T>,
  options?: { clientId?: string },
): Promise<T> {
  if (options?.clientId) pulseBusyClient(options.clientId);

  await acquireSlot();
  try {
    if (options?.clientId) pulseBusyClient(options.clientId);
    return await fn();
  } finally {
    releaseSlot();
  }
}

function acquireSlot(): Promise<void> {
  const max = maxConcurrent();
  if (active < max) {
    active += 1;
    return Promise.resolve();
  }
  return new Promise<void>((resolve) => {
    waitQueue.push({
      resolve: () => {
        active += 1;
        resolve();
      },
      enqueuedAt: Date.now(),
    });
  });
}

function releaseSlot() {
  const next = waitQueue.shift();
  if (next) {
    // Transfer the slot to the next waiter (active stays the same after their +1/-1 net)
    // Current holder is leaving: decrement first, then next increments.
    active = Math.max(0, active - 1);
    next.resolve();
  } else {
    active = Math.max(0, active - 1);
  }
}

/** Test helpers */
export function __resetAnalysisLoadForTests() {
  active = 0;
  waitQueue.length = 0;
  busyHeartbeats.clear();
}

export function __debugLoadState() {
  return { active, waiting: waitQueue.length, heartbeats: busyHeartbeats.size };
}
