import { getOpenAIClient } from "@/lib/ai/client";
import { createStructuredCompletion, formatAiError } from "@/lib/ai/completion";
import { fallbackRoleDirections } from "@/lib/ai/fallback/roleDirections";
import { normalizeRoleDirections } from "@/lib/ai/normalize/roleDirections";
import type { AnalysisOutcome } from "@/lib/ai/types";
import { buildRoleDirectionPrompt } from "@/lib/prompts/roleDirectionPrompt";
import type {
  RoleDirectionInput,
  RoleDirectionResult,
} from "@/types/jobMatch";

export async function recommendRoleDirections(
  input: RoleDirectionInput,
): Promise<AnalysisOutcome<RoleDirectionResult>> {
  if (!getOpenAIClient()) {
    return {
      data: fallbackRoleDirections(input),
      source: "fallback",
      warning: "未配置 MiniMax/OpenAI API Key，已使用本地规则生成岗位方向。",
    };
  }

  try {
    const raw = await createStructuredCompletion<RoleDirectionResult>(
      "role direction",
      buildRoleDirectionPrompt(input),
      { maxTokens: 2200, timeoutMs: 40_000, retries: 1, temperature: 0.2 },
    );
    return {
      data: normalizeRoleDirections(raw),
      source: "ai",
    };
  } catch (error) {
    const detail = formatAiError(error);
    console.error("AI role direction failed, using local fallback:", error);
    return {
      data: fallbackRoleDirections(input),
      source: "fallback",
      warning: `大模型调用失败，已回退本地岗位方向推荐。原因：${detail}`,
    };
  }
}
