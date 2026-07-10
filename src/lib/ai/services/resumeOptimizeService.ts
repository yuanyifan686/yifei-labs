import { getOpenAIClient } from "@/lib/ai/client";
import { createStructuredCompletion, formatAiError } from "@/lib/ai/completion";
import { fallbackResumeOptimization } from "@/lib/ai/fallback/resumeOptimize";
import { normalizeResumeOptimization } from "@/lib/ai/normalize/resumeOptimize";
import type { AnalysisOutcome } from "@/lib/ai/types";
import { buildResumeOptimizePrompt } from "@/lib/prompts/resumeOptimizePrompt";
import type {
  ResumeOptimizationInput,
  ResumeOptimizationResult,
} from "@/types/jobMatch";

export async function optimizeResumeForRole(
  input: ResumeOptimizationInput,
): Promise<AnalysisOutcome<ResumeOptimizationResult>> {
  if (!getOpenAIClient()) {
    return {
      data: fallbackResumeOptimization(input),
      source: "fallback",
      warning:
        "未配置 MiniMax/OpenAI API Key，已使用本地规则生成简历优化建议。",
    };
  }

  try {
    const raw = await createStructuredCompletion<ResumeOptimizationResult>(
      "resume optimization",
      buildResumeOptimizePrompt(input),
      { maxTokens: 3500, timeoutMs: 50_000, retries: 1, temperature: 0.2 },
    );
    return {
      data: normalizeResumeOptimization(raw),
      source: "ai",
    };
  } catch (error) {
    const detail = formatAiError(error);
    console.error("AI resume optimization failed, using local fallback:", error);
    return {
      data: fallbackResumeOptimization(input),
      source: "fallback",
      warning: `大模型调用失败，已回退本地简历优化建议。原因：${detail}`,
    };
  }
}
