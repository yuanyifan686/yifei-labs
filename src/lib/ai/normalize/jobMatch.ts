import {
  asStringArray,
  clampScore,
  normalizeScoreDimensions,
} from "@/lib/ai/normalize/common";
import type { JobMatch, JobMatchResult, MatchScoreDimensions } from "@/types/jobMatch";

export function normalizeJobMatch(raw: JobMatchResult): JobMatchResult {
  const roles = Array.isArray(raw?.recommendedRoles) ? raw.recommendedRoles : [];
  const recommendedRoles = roles
    .map((role) => {
      const matchScore = clampScore(role?.matchScore, 50);
      const dims = normalizeScoreDimensions(
        role?.scoreDimensions as MatchScoreDimensions | undefined,
        matchScore,
      );
      return {
        title: String(role?.title || "未命名岗位").trim(),
        company: role?.company ? String(role.company).trim() : undefined,
        location: role?.location ? String(role.location).trim() : undefined,
        sourceText: role?.sourceText ? String(role.sourceText).trim() : undefined,
        matchScore: dims?.overall ?? matchScore,
        scoreDimensions: dims,
        recommendedLevel: String(role?.recommendedLevel || "可尝试").trim(),
        reason: String(role?.reason || "暂无匹配说明").trim(),
        strengths: asStringArray(role?.strengths),
        gaps: asStringArray(role?.gaps),
        suggestedResumeKeywords: asStringArray(role?.suggestedResumeKeywords),
        matchedKeywords: asStringArray(role?.matchedKeywords),
        resumeTips: asStringArray(role?.resumeTips),
        jobId: role?.jobId ? String(role.jobId).trim() : undefined,
        isSynthetic: role?.isSynthetic !== false,
        skillTags: asStringArray(role?.skillTags),
        retrievalScore:
          role?.retrievalScore != null
            ? clampScore(role.retrievalScore, matchScore)
            : undefined,
      } satisfies JobMatch;
    })
    .filter((role) => role.title)
    .sort((a, b) => b.matchScore - a.matchScore);

  if (recommendedRoles.length === 0) {
    throw new Error("AI 未返回有效岗位匹配结果。");
  }

  return {
    candidateSummary: String(
      raw?.candidateSummary || "已完成岗位匹配分析。",
    ).trim(),
    recommendedRoles,
    aggregateGaps: asStringArray(raw?.aggregateGaps).slice(0, 8),
  };
}
