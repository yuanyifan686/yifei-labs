import type { StructuredResume } from "@/types/resume";

type Entry = { at: number; value: StructuredResume };

const TTL_MS = 15 * 60 * 1000;
const MAX = 40;
const cache = new Map<string, Entry>();

function prune(now: number) {
  for (const [k, v] of cache) {
    if (now - v.at > TTL_MS) cache.delete(k);
  }
  if (cache.size <= MAX) return;
  const ordered = [...cache.entries()].sort((a, b) => a[1].at - b[1].at);
  for (const [k] of ordered.slice(0, cache.size - MAX)) {
    cache.delete(k);
  }
}

export function getCachedStructuredResume(
  hash: string,
): StructuredResume | null {
  const hit = cache.get(hash);
  if (!hit) return null;
  if (Date.now() - hit.at > TTL_MS) {
    cache.delete(hash);
    return null;
  }
  return hit.value;
}

export function setCachedStructuredResume(
  hash: string,
  value: StructuredResume,
): void {
  const now = Date.now();
  cache.set(hash, { at: now, value });
  prune(now);
}

export function clearStructuredResumeCache(): void {
  cache.clear();
}
