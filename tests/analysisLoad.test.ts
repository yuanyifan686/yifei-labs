import { afterEach, describe, expect, it } from "vitest";
import {
  __debugLoadState,
  __resetAnalysisLoadForTests,
  getAnalysisLoadSnapshot,
  withAnalysisSlot,
} from "@/lib/load/analysisLoadTracker";

afterEach(() => {
  __resetAnalysisLoadForTests();
  delete process.env.AI_MAX_CONCURRENT;
});

describe("analysis load tracker", () => {
  it("reports idle when nothing running", () => {
    const snap = getAnalysisLoadSnapshot();
    expect(snap.active).toBe(0);
    expect(snap.waiting).toBe(0);
    expect(snap.needsQueue).toBe(false);
    expect(snap.statusLine).toMatch(/空闲|无需排队/);
  });

  it("limits concurrency and queues extras", async () => {
    process.env.AI_MAX_CONCURRENT = "2";
    __resetAnalysisLoadForTests();

    let released = 0;
    const gates: Array<() => void> = [];

    const jobs = [0, 1, 2].map((i) =>
      withAnalysisSlot(`job-${i}`, async () => {
        await new Promise<void>((resolve) => {
          gates[i] = () => {
            released += 1;
            resolve();
          };
        });
        return i;
      }),
    );

    // Let microtasks register
    await new Promise((r) => setTimeout(r, 20));
    const mid = getAnalysisLoadSnapshot();
    expect(mid.active).toBe(2);
    expect(mid.waiting).toBe(1);
    expect(mid.needsQueue).toBe(true);
    expect(mid.testingNow).toBeGreaterThanOrEqual(2);

    // Release first two
    gates[0]?.();
    gates[1]?.();
    await new Promise((r) => setTimeout(r, 20));
    // Third should be active now
    const after = __debugLoadState();
    expect(after.active).toBe(1);
    expect(after.waiting).toBe(0);

    gates[2]?.();
    await Promise.all(jobs);
    expect(released).toBe(3);
    expect(__debugLoadState().active).toBe(0);
  });

  it("heartbeat raises testingNow while UI busy", () => {
    const snap = getAnalysisLoadSnapshot({
      clientId: "client-aaa-bbb",
      isBusyUi: true,
    });
    expect(snap.testingNow).toBeGreaterThanOrEqual(1);
  });
});
