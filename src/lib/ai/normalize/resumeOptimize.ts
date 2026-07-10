import { asStringArray } from "@/lib/ai/normalize/common";
import type {
  ResumeDiffItem,
  ResumeOptimizationResult,
} from "@/types/jobMatch";

export function normalizeResumeOptimization(
  raw: ResumeOptimizationResult,
): ResumeOptimizationResult {
  const score = raw?.score || ({} as ResumeOptimizationResult["score"]);
  const clamp = (value: unknown, fallback: number) => {
    const num = Number(value);
    return Number.isFinite(num)
      ? Math.min(100, Math.max(0, Math.round(num)))
      : fallback;
  };

  const optimizedResume = String(raw?.optimizedResume || "").trim();
  if (!optimizedResume) {
    throw new Error("AI 未返回优化后的简历文本。");
  }

  const diffs: ResumeDiffItem[] = Array.isArray(raw?.diffs)
    ? raw.diffs
        .map((item) => ({
          original: String(item?.original || "").trim(),
          revised: String(item?.revised || "").trim(),
          reason: String(item?.reason || "").trim(),
        }))
        .filter((item) => item.original || item.revised)
        .slice(0, 12)
    : [];

  if (diffs.length === 0 && asStringArray(raw?.keyImprovements).length > 0) {
    for (const improvement of asStringArray(raw?.keyImprovements).slice(0, 4)) {
      diffs.push({
        original: "（原文对应段落未单独拆分）",
        revised: improvement,
        reason: "整体优化建议",
      });
    }
  }

  return {
    score: {
      overall: clamp(score.overall, 70),
      roleMatch: clamp(score.roleMatch, 70),
      keywordMatch: clamp(score.keywordMatch, 70),
      clarity: clamp(score.clarity, 70),
      atsFriendliness: clamp(score.atsFriendliness, 70),
    },
    keyImprovements: asStringArray(raw?.keyImprovements),
    missingKeywords: asStringArray(raw?.missingKeywords),
    optimizedResume,
    diffs,
  };
}
