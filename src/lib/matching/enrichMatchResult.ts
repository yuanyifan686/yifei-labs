import {
  aggregateTopGaps,
  blendMatchScore,
  scoreJobDimensions,
} from "@/lib/matching/scoreDimensions";
import { ScoredCandidate } from "@/lib/matching/retrieveCandidates";
import {
  ExperienceLevel,
  JobMatch,
  JobMatchResult,
  MatchPipelineMeta,
  ResumeProfile,
} from "@/types/jobMatch";

function recommendedLevelFromScore(score: number): string {
  if (score >= 85) return "强匹配";
  if (score >= 70) return "良好匹配";
  if (score >= 60) return "可尝试";
  return "需补齐";
}

/**
 * Merge LLM narrative results with deterministic dimension scores from TopK candidates.
 */
export function enrichJobMatchResult(
  raw: JobMatchResult,
  profile: ResumeProfile,
  candidates: ScoredCandidate[],
  pipeline: MatchPipelineMeta,
  options?: {
    experienceLevel?: ExperienceLevel;
    preferredLocation?: string;
    language?: "Chinese" | "English" | "Bilingual";
  },
): JobMatchResult {
  const byTitle = new Map(
    candidates.map((c) => [c.job.title.trim().toLowerCase(), c]),
  );
  const byId = new Map(candidates.map((c) => [c.job.id, c]));

  const roles: JobMatch[] = (raw.recommendedRoles || []).map((role) => {
    const key = role.title.trim().toLowerCase();
    const candidate =
      (role.jobId ? byId.get(role.jobId) : undefined) || byTitle.get(key);

    if (candidate) {
      const dims = blendMatchScore(candidate.dimensions, role.matchScore);
      const matched =
        role.matchedKeywords?.length > 0
          ? role.matchedKeywords
          : candidate.dimensions.matchedSkills;
      const gaps =
        role.gaps?.length > 0
          ? role.gaps
          : candidate.dimensions.missingSkills.map(
              (s) => `岗位要求 ${s}，简历证据不足`,
            );

      return {
        ...role,
        matchScore: dims.overall,
        scoreDimensions: dims,
        recommendedLevel:
          role.recommendedLevel || recommendedLevelFromScore(dims.overall),
        matchedKeywords: matched.slice(0, 10),
        gaps,
        jobId: candidate.job.id,
        isSynthetic: candidate.job.isSynthetic !== false,
        skillTags: candidate.job.skillTags || candidate.job.keywords,
        retrievalScore: candidate.retrievalScore,
        company: role.company || candidate.job.company,
        location: role.location || candidate.job.location,
        sourceText:
          role.sourceText ||
          `${candidate.job.requirements || candidate.job.description}`.slice(
            0,
            280,
          ),
      };
    }

    // Role not in TopK map — still attach rule dims from free text if possible
    const dims = role.scoreDimensions || {
      skillCoverage: role.matchScore,
      experienceFit: role.matchScore,
      directionFit: role.matchScore,
      locationFit: 70,
      overall: role.matchScore,
    };
    return {
      ...role,
      scoreDimensions: dims,
      isSynthetic: role.isSynthetic !== false,
    };
  });

  // If LLM returned too few roles, fill from candidates
  if (roles.length < Math.min(6, candidates.length)) {
    const existing = new Set(roles.map((r) => r.title.toLowerCase()));
    for (const c of candidates) {
      if (existing.has(c.job.title.toLowerCase())) continue;
      const dims = c.dimensions;
      roles.push({
        title: c.job.title,
        company: c.job.company,
        location: c.job.location,
        sourceText: (c.job.requirements || c.job.description).slice(0, 280),
        matchScore: dims.overall,
        scoreDimensions: {
          skillCoverage: dims.skillCoverage,
          experienceFit: dims.experienceFit,
          directionFit: dims.directionFit,
          locationFit: dims.locationFit,
          overall: dims.overall,
        },
        recommendedLevel: recommendedLevelFromScore(dims.overall),
        reason:
          options?.language === "English"
            ? `Retrieved by profile scoring (skill ${dims.skillCoverage}, direction ${dims.directionFit}).`
            : `基于简历画像预筛：技能覆盖 ${dims.skillCoverage}，方向契合 ${dims.directionFit}。`,
        strengths: dims.matchedSkills
          .slice(0, 6)
          .map((s) => (options?.language === "English" ? `Has ${s}` : `简历已体现 ${s}`)),
        gaps: dims.missingSkills
          .slice(0, 6)
          .map((s) =>
            options?.language === "English"
              ? `May need ${s}`
              : `岗位要求 ${s}，简历证据不足`,
          ),
        suggestedResumeKeywords: dims.missingSkills.slice(0, 8),
        matchedKeywords: dims.matchedSkills.slice(0, 10),
        resumeTips: [
          options?.language === "English"
            ? "Move the most relevant projects higher on the resume."
            : "将最相关项目放到简历靠前位置。",
          options?.language === "English"
            ? "Add truthful keywords aligned with this role."
            : "围绕岗位补充真实技术栈与结果表达。",
        ],
        jobId: c.job.id,
        isSynthetic: c.job.isSynthetic !== false,
        skillTags: c.job.skillTags || c.job.keywords,
        retrievalScore: c.retrievalScore,
      });
      existing.add(c.job.title.toLowerCase());
      if (roles.length >= 12) break;
    }
  }

  roles.sort((a, b) => b.matchScore - a.matchScore);

  const summary =
    raw.candidateSummary?.trim() ||
    profile.summaryLine ||
    "已完成岗位匹配分析。";

  return {
    candidateSummary: summary,
    recommendedRoles: roles.slice(0, 12),
    profile,
    aggregateGaps: aggregateTopGaps(roles, 5),
    pipeline,
  };
}

/** Pure rules path when LLM unavailable. */
export function buildMatchResultFromCandidates(
  profile: ResumeProfile,
  candidates: ScoredCandidate[],
  pipeline: MatchPipelineMeta,
  reason: "missing_key" | "api_error",
  options?: {
    experienceLevel?: ExperienceLevel;
    preferredLocation?: string;
  },
): JobMatchResult {
  void options;
  const roles: JobMatch[] = candidates.map((c) => {
    // Recompute to ensure options applied (already on candidate.dimensions)
    const dims = c.dimensions;
    return {
      title: c.job.title,
      company: c.job.company,
      location: c.job.location,
      sourceText: (c.job.requirements || c.job.description).slice(0, 280),
      matchScore: dims.overall,
      scoreDimensions: {
        skillCoverage: dims.skillCoverage,
        experienceFit: dims.experienceFit,
        directionFit: dims.directionFit,
        locationFit: dims.locationFit,
        overall: dims.overall,
      },
      recommendedLevel: recommendedLevelFromScore(dims.overall),
      reason: `该岗位与简历画像在技能维度重合 ${dims.matchedSkills.length} 项，预筛综合分 ${c.retrievalScore}。`,
      strengths:
        dims.matchedSkills.length > 0
          ? dims.matchedSkills.slice(0, 6).map((s) => `简历中已体现 ${s}`)
          : ["简历与该岗位存在少量通用能力重合。"],
      gaps:
        dims.missingSkills.length > 0
          ? dims.missingSkills.slice(0, 6).map((s) => `岗位可能要求 ${s}，简历中体现不足`)
          : ["当前技能标签层面未发现明显缺口。"],
      suggestedResumeKeywords: dims.missingSkills.slice(0, 8),
      matchedKeywords: dims.matchedSkills.slice(0, 10),
      resumeTips: [
        "将最相关项目放到简历靠前位置。",
        "围绕岗位要求补充真实技术栈、业务场景和结果。",
        "避免新增不存在的经历，只优化已有经历的表达。",
      ],
      jobId: c.job.id,
      isSynthetic: c.job.isSynthetic !== false,
      skillTags: c.job.skillTags || c.job.keywords,
      retrievalScore: c.retrievalScore,
    };
  });

  return {
    candidateSummary:
      reason === "missing_key"
        ? `当前未配置 API Key，已用结构化简历画像 + 岗位库 Top${candidates.length} 预筛完成规则匹配。画像：${profile.summaryLine}`
        : `大模型暂时不可用，已回退结构化规则匹配。画像：${profile.summaryLine}`,
    recommendedRoles: roles,
    profile,
    aggregateGaps: aggregateTopGaps(roles, 5),
    pipeline,
  };
}

/** Score a free-text job block when no StoredJob id is available. */
export function scoreFreeTextJobAsDimensions(
  profile: ResumeProfile,
  jobText: string,
  title: string,
  options?: { experienceLevel?: ExperienceLevel; preferredLocation?: string },
) {
  const fakeJob = {
    id: "text",
    title,
    company: "",
    location: options?.preferredLocation || "",
    salary: "",
    platformStyle: "market" as const,
    requirements: jobText,
    description: jobText,
    keywords: [],
    relatedDirections: [],
    source: "fallback" as const,
    isSynthetic: true,
    batchId: "text",
    createdAt: new Date().toISOString(),
  };
  return scoreJobDimensions(profile, fakeJob, options);
}
