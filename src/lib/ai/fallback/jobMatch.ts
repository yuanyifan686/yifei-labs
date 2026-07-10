import {
  extractSkillText,
  inferCompany,
  inferJobTitle,
  inferLocation,
  splitJobList,
  tokenize,
} from "@/lib/ai/fallback/textUtils";
import type { JobMatch, JobMatchInput, JobMatchResult } from "@/types/jobMatch";

function scoreJob(
  job: string,
  resumeKeywords: Set<string>,
  index: number,
): JobMatch {
  const jobKeywords = Array.from(new Set(tokenize(extractSkillText(job))));
  const matchedKeywords = jobKeywords.filter((keyword) =>
    resumeKeywords.has(keyword),
  );
  const rawScore = Math.round(
    (matchedKeywords.length / Math.max(jobKeywords.length, 1)) * 100,
  );
  const matchScore = Math.min(96, Math.max(42, rawScore + Math.max(0, 18 - index)));
  const missing = jobKeywords
    .filter((keyword) => !resumeKeywords.has(keyword))
    .slice(0, 6);
  const title = inferJobTitle(job, index);

  return {
    title,
    company: inferCompany(job),
    location: inferLocation(job),
    sourceText: job.slice(0, 280),
    matchScore,
    scoreDimensions: {
      skillCoverage: matchScore,
      experienceFit: Math.min(96, Math.max(40, matchScore - 4)),
      directionFit: Math.min(96, Math.max(40, matchScore - 2)),
      locationFit: 70,
      overall: matchScore,
    },
    recommendedLevel:
      matchScore >= 85 ? "强匹配" : matchScore >= 70 ? "良好匹配" : "可尝试",
    reason: `该岗位与简历有 ${matchedKeywords.length} 个关键词重合，适合作为初步投递优先级参考。`,
    strengths:
      matchedKeywords.length > 0
        ? matchedKeywords.slice(0, 6).map((item) => `简历中已体现 ${item}`)
        : ["简历与该岗位存在少量通用能力重合。"],
    gaps:
      missing.length > 0
        ? missing.map((item) => `岗位可能要求 ${item}，简历中体现不足`)
        : ["当前关键词层面未发现明显缺口。"],
    suggestedResumeKeywords: missing.slice(0, 8),
    matchedKeywords: matchedKeywords.slice(0, 10),
    resumeTips: [
      "将最相关项目放到简历靠前位置。",
      "围绕岗位要求补充真实技术栈、业务场景和结果。",
      "避免新增不存在的经历，只优化已有经历的表达。",
    ],
    isSynthetic: true,
  };
}

export function fallbackJobMatch(
  input: JobMatchInput,
  reason: "missing_key" | "api_error",
): JobMatchResult {
  const resumeKeywords = tokenize(input.resumeContent);
  const jobs = splitJobList(input.jobListContent);
  const recommendedRoles = jobs
    .map((job, index) => scoreJob(job, resumeKeywords, index))
    .sort((a, b) => b.matchScore - a.matchScore)
    .slice(0, 12);

  return {
    candidateSummary:
      reason === "missing_key"
        ? "当前未配置 API Key，系统使用本地关键词规则完成初步匹配。配置 MINIMAX_API_KEY 或 OPENAI_API_KEY 后可获得更准确的语义分析。"
        : "大模型暂时不可用，系统已使用本地关键词规则完成初步匹配。结果仅供参考，建议稍后重试 AI 分析。",
    recommendedRoles,
  };
}
