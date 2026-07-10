import {
  buildRuleEvidenceScores,
  collectNextActions,
  collectRiskFlags,
  readinessFromEvidenceScores,
} from "@/lib/evidence/ruleEvidenceScores";
import { extractSkillText, tokenize } from "@/lib/ai/fallback/textUtils";
import { buildSkillMatrix } from "@/lib/matching/buildSkillMatrix";
import { extractResumeProfile } from "@/lib/profile/extractResumeProfile";
import { structuredResumeFromRules } from "@/lib/resume/fromRules";
import { toResumeProfile } from "@/lib/resume/toResumeProfile";
import type {
  SkillGapAnalysisInput,
  SkillGapAnalysisResult,
} from "@/types/jobMatch";
import type { ProofCheckResult, StructuredResume } from "@/types/resume";

export function fallbackSkillGap(
  input: SkillGapAnalysisInput,
  reason: "missing_key" | "api_error",
  options?: {
    structured?: StructuredResume;
    proofChecks?: ProofCheckResult[];
  },
): SkillGapAnalysisResult {
  const structured =
    options?.structured || structuredResumeFromRules(input.resumeContent);
  const profile = options?.structured
    ? toResumeProfile(options.structured)
    : extractResumeProfile(input.resumeContent);

  const resumeKeywords = tokenize(input.resumeContent);
  const targetKeywords = Array.from(
    new Set(
      tokenize(
        `${input.targetRole}\n${extractSkillText(input.targetJobDescription || "")}\n${input.marketJobContext || ""}`,
      ),
    ),
  ).slice(0, 30);
  const matchedStrengths = targetKeywords
    .filter((keyword) => resumeKeywords.has(keyword))
    .slice(0, 10);
  const missingSkills = targetKeywords
    .filter((keyword) => !resumeKeywords.has(keyword))
    .slice(0, 10);

  const evidenceFinal = buildRuleEvidenceScores({
    structured,
    targetRole: input.targetRole,
    targetJobDescription: input.targetJobDescription,
    marketJobContext: input.marketJobContext,
    proofChecks: options?.proofChecks,
  });

  const readinessScore = readinessFromEvidenceScores(
    evidenceFinal,
    input.targetRole,
  );
  const roleFit =
    evidenceFinal.find((e) => e.category === "role_fit")?.score ??
    readinessScore;

  const skillMatrix = buildSkillMatrix({
    profile,
    targetRole: input.targetRole,
    targetJobDescription: input.targetJobDescription,
    marketJobContext: input.marketJobContext,
  });

  const riskFlags = collectRiskFlags(evidenceFinal);
  const nextActions = collectNextActions(evidenceFinal);

  return {
    targetRole: input.targetRole,
    readinessScore,
    marketFitScore: Math.max(
      30,
      Math.round(roleFit * 0.7 + readinessScore * 0.3),
    ),
    summary:
      reason === "missing_key"
        ? `当前未配置 API Key，已结合结构化简历（${profile.summaryLine}）生成证据型差距分析。`
        : `大模型暂时不可用，已结合结构化简历（${profile.summaryLine}）生成证据型差距分析。`,
    marketDemandSummary: input.marketJobContext
      ? "已结合本地岗位库中的相关岗位要求，用规则估算市场匹配度。"
      : "未找到足够岗位库样本，仅按目标岗位名称做通用市场估算。",
    matchedStrengths:
      matchedStrengths.length > 0
        ? matchedStrengths.map((item) => `简历中已体现：${item}`)
        : profile.skillNames.length > 0
          ? profile.skillNames.slice(0, 5).map((s) => `简历技能标签：${s}`)
          : [
              "简历与目标岗位的关键词重合较少，需要补充更明确的岗位相关经历。",
            ],
    missingSkills:
      missingSkills.length > 0
        ? missingSkills.map((item) => `建议补充或强化：${item}`)
        : skillMatrix
            .filter((c) => c.status === "missing")
            .map((c) => `建议补充或强化：${c.skill}`)
            .slice(0, 10),
    commonMarketRequirements: missingSkills
      .slice(0, 6)
      .map((item) => `市场常见要求：${item}`),
    learningPriorities:
      nextActions.length > 0
        ? nextActions.slice(0, 5)
        : missingSkills
            .slice(0, 5)
            .map((item) => `优先学习或补充项目证据：${item}`),
    resumeImprovements: [
      "把项目经历改写为“目标、行动、技术栈、结果”的结构。",
      "在技能区和项目区补充与目标岗位一致且真实的关键词。",
      "为重点项目补充可访问链接与可验证指标。",
    ],
    interviewPrepTips: [
      "准备一个最能证明目标岗位能力的项目案例。",
      "梳理每项关键技能的使用场景、难点和结果。",
      "对缺口技能准备学习计划或替代经验说明。",
    ],
    suggestedKeywords: missingSkills.slice(0, 8),
    skillMatrix,
    evidenceScores: evidenceFinal,
    riskFlags,
    nextActions,
    proofChecks: options?.proofChecks,
    structuredResumeHash: structured.rawTextHash,
  };
}
