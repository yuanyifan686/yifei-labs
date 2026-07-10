import { asStringArray } from "@/lib/ai/normalize/common";
import type {
  RoleDirection,
  RoleDirectionResult,
} from "@/types/jobMatch";

export function normalizeRoleDirections(
  raw: RoleDirectionResult,
): RoleDirectionResult {
  const directions = (Array.isArray(raw?.directions) ? raw.directions : [])
    .map((item) => {
      const matchScore = Number(item?.matchScore);
      return {
        title: String(item?.title || "").trim(),
        matchScore: Number.isFinite(matchScore)
          ? Math.min(100, Math.max(0, Math.round(matchScore)))
          : 70,
        reason: String(item?.reason || "与简历方向相关").trim(),
        levelHint: String(item?.levelHint || "").trim() || "不限",
        searchKeywords: asStringArray(item?.searchKeywords).slice(0, 8),
        bossQuery: String(item?.bossQuery || item?.title || "").trim(),
        zhilianQuery: String(item?.zhilianQuery || item?.title || "").trim(),
        typicalRequirements: asStringArray(item?.typicalRequirements).slice(
          0,
          8,
        ),
      } satisfies RoleDirection;
    })
    .filter((item) => item.title)
    .sort((a, b) => b.matchScore - a.matchScore)
    .slice(0, 6);

  if (directions.length === 0) {
    throw new Error("AI 未返回有效岗位方向。");
  }

  return {
    candidateSummary: String(
      raw?.candidateSummary || "已根据简历生成岗位方向推荐。",
    ).trim(),
    directions,
    platformSearchTips: asStringArray(raw?.platformSearchTips).slice(0, 6),
  };
}
