import type { MatchScoreDimensions } from "@/types/jobMatch";

export function asStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value
    .map((item) =>
      typeof item === "string" ? item.trim() : String(item ?? "").trim(),
    )
    .filter(Boolean);
}

export function clampScore(value: unknown, fallback: number) {
  const num = Number(value);
  return Number.isFinite(num)
    ? Math.min(100, Math.max(0, Math.round(num)))
    : fallback;
}

export function normalizeScoreDimensions(
  raw: Partial<MatchScoreDimensions> | undefined,
  matchScore: number,
): MatchScoreDimensions {
  if (!raw || typeof raw !== "object") {
    return {
      skillCoverage: matchScore,
      experienceFit: matchScore,
      directionFit: matchScore,
      locationFit: Math.min(100, Math.max(0, matchScore - 5)),
      overall: matchScore,
    };
  }
  const skillCoverage = clampScore(raw.skillCoverage, matchScore);
  const experienceFit = clampScore(raw.experienceFit, matchScore);
  const directionFit = clampScore(raw.directionFit, matchScore);
  const locationFit = clampScore(raw.locationFit, Math.min(100, matchScore));
  const overall = clampScore(raw.overall, matchScore);
  return { skillCoverage, experienceFit, directionFit, locationFit, overall };
}
