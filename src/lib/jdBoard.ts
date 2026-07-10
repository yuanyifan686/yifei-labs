/**
 * Multi real-JD board (local). Supports tracking diagnose targets without account.
 */

export type JdBoardItem = {
  id: string;
  title: string;
  jd: string;
  status: "saved" | "diagnosed" | "planning" | "applied";
  readinessScore?: number;
  updatedAt: string;
};

const KEY = "yl-jd-board";

function uid() {
  return `jd_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

export function listJdBoard(): JdBoardItem[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as JdBoardItem[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function saveJdBoard(items: JdBoardItem[]) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(KEY, JSON.stringify(items.slice(0, 30)));
}

export function upsertJdBoardItem(
  partial: Pick<JdBoardItem, "title" | "jd"> &
    Partial<Pick<JdBoardItem, "id" | "status" | "readinessScore">>,
): JdBoardItem[] {
  const items = listJdBoard();
  const now = new Date().toISOString();
  const existingIdx = partial.id
    ? items.findIndex((i) => i.id === partial.id)
    : items.findIndex(
        (i) => i.title === partial.title && i.jd.slice(0, 80) === partial.jd.slice(0, 80),
      );

  if (existingIdx >= 0) {
    items[existingIdx] = {
      ...items[existingIdx],
      ...partial,
      updatedAt: now,
    };
  } else {
    items.unshift({
      id: partial.id || uid(),
      title: partial.title,
      jd: partial.jd,
      status: partial.status || "saved",
      readinessScore: partial.readinessScore,
      updatedAt: now,
    });
  }
  saveJdBoard(items);
  return items;
}

export function removeJdBoardItem(id: string): JdBoardItem[] {
  const next = listJdBoard().filter((i) => i.id !== id);
  saveJdBoard(next);
  return next;
}
