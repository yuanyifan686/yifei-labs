/**
 * Serialize async writers for file-based job bank (lost-update prevention).
 * In-process only — multi-instance still needs Supabase.
 */

let tail: Promise<unknown> = Promise.resolve();

export function enqueueWrite<T>(fn: () => Promise<T>): Promise<T> {
  const run = tail.then(fn, fn);
  // Keep chain alive even if task rejects
  tail = run.then(
    () => undefined,
    () => undefined,
  );
  return run;
}
