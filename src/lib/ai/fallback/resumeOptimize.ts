import type {
  ResumeOptimizationInput,
  ResumeOptimizationResult,
} from "@/types/jobMatch";

export function fallbackResumeOptimization(
  input: ResumeOptimizationInput,
): ResumeOptimizationResult {
  const matchedKeywords = input.selectedRole.matchedKeywords || [];
  const missingKeywords = input.selectedRole.suggestedResumeKeywords || [];
  const keywordScore = Math.min(
    96,
    Math.max(
      45,
      Math.round(
        (matchedKeywords.length /
          Math.max(matchedKeywords.length + missingKeywords.length, 1)) *
          100,
      ),
    ),
  );
  const roleMatch = Math.min(98, Math.max(45, input.selectedRole.matchScore));
  const clarity = input.originalResume.length > 260 ? 82 : 68;
  const atsFriendliness = Math.min(92, 70 + matchedKeywords.length * 3);
  const overall = Math.round(
    (roleMatch + keywordScore + clarity + atsFriendliness) / 4,
  );

  const keywordLine =
    [...matchedKeywords, ...missingKeywords].slice(0, 10).join("、") ||
    input.selectedRole.title;
  const optimizedResume = [
    input.originalResume.trim(),
    "",
    `【面向${input.selectedRole.title}的简历优化方向】`,
    `- 目标岗位关键词：${keywordLine}`,
    "- 项目经历建议按“业务目标、技术方案、个人贡献、结果影响”重写。",
    "- 技能区优先展示与目标岗位直接相关、且能在项目中证明的技术。",
    "- 对缺失关键词只补充真实学习、项目或可验证经验，不新增虚假经历。",
  ].join("\n");

  return {
    score: {
      overall,
      roleMatch,
      keywordMatch: keywordScore,
      clarity,
      atsFriendliness,
    },
    keyImprovements: [
      `把简历标题或个人摘要调整为更贴近“${input.selectedRole.title}”的定位。`,
      "将最相关的 2-3 个项目提前，并补充技术栈、职责边界和结果。",
      "把通用描述改成可被 ATS 和招聘方快速识别的岗位关键词表达。",
    ],
    missingKeywords,
    optimizedResume,
    diffs: [
      {
        original: "个人摘要 / 标题（原文）",
        revised: `面向「${input.selectedRole.title}」调整定位与关键词`,
        reason: "提升岗位相关性与 ATS 命中",
      },
      {
        original: "项目经历顺序与表述",
        revised: "最相关 2-3 个项目前置，补充技术栈、职责与结果",
        reason: "强化可验证证据",
      },
      ...missingKeywords.slice(0, 3).map((kw) => ({
        original: `技能区缺少「${kw}」的明确表达`,
        revised: `在真实项目中补充「${kw}」相关表述（勿虚构）`,
        reason: "对齐目标岗位关键词",
      })),
    ],
  };
}
