import { getOpenAIClient } from "@/lib/ai/client";
import { createStructuredCompletion, formatAiError } from "@/lib/ai/completion";
import { fallbackLearningPlan } from "@/lib/ai/fallback/learningPlan";
import { normalizeLearningPlan } from "@/lib/ai/normalize/learningPlan";
import type { AnalysisOutcome } from "@/lib/ai/types";
import { buildLearningPlanPrompt } from "@/lib/prompts/learningPlanPrompt";
import type { LearningPlanInput, LearningPlanResult } from "@/types/jobMatch";

export async function generateLearningPlan(
  input: LearningPlanInput,
): Promise<AnalysisOutcome<LearningPlanResult>> {
  if (!getOpenAIClient()) {
    return {
      data: fallbackLearningPlan(input),
      source: "fallback",
      warning: "未配置 API Key，已生成规则版 30 天学习计划。",
    };
  }

  try {
    const raw = await createStructuredCompletion<LearningPlanResult>(
      "learning plan",
      buildLearningPlanPrompt(input),
      { maxTokens: 3500, timeoutMs: 50_000, retries: 1, temperature: 0.25 },
    );
    return {
      data: normalizeLearningPlan(raw, input.targetRole),
      source: "ai",
    };
  } catch (error) {
    const detail = formatAiError(error);
    console.error("AI learning plan failed, using fallback:", error);
    return {
      data: fallbackLearningPlan(input),
      source: "fallback",
      warning: `学习计划生成失败，已回退规则计划。原因：${detail}`,
    };
  }
}
