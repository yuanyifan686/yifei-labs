import { getOpenAIClient } from "@/lib/ai/client";
import { createStructuredCompletion, formatAiError } from "@/lib/ai/completion";
import { fallbackJobMatch } from "@/lib/ai/fallback/jobMatch";
import { normalizeJobMatch } from "@/lib/ai/normalize/jobMatch";
import { jobMatchResultSchema } from "@/lib/ai/schemas/jobMatchSchema";
import type { AnalysisOutcome } from "@/lib/ai/types";
import { buildJobMatchPrompt } from "@/lib/prompts/jobMatchPrompt";
import type { JobMatchInput, JobMatchResult } from "@/types/jobMatch";

export async function analyzeJobMatch(
  input: JobMatchInput,
): Promise<AnalysisOutcome<JobMatchResult>> {
  if (!getOpenAIClient()) {
    return {
      data: fallbackJobMatch(input, "missing_key"),
      source: "fallback",
      warning:
        "未配置 MiniMax/OpenAI API Key，已使用本地关键词规则完成初步匹配。",
    };
  }

  try {
    const raw = await createStructuredCompletion<JobMatchResult>(
      "job match",
      buildJobMatchPrompt(input),
      {
        maxTokens: 4000,
        timeoutMs: 55_000,
        retries: 1,
        temperature: 0.15,
        validate: (data) => {
          const parsed = jobMatchResultSchema.safeParse(data);
          if (!parsed.success) {
            return {
              ok: false,
              error: parsed.error.issues
                .slice(0, 3)
                .map((i) => `${i.path.join(".")}: ${i.message}`)
                .join("; "),
            };
          }
          return { ok: true, data: parsed.data as JobMatchResult };
        },
      },
    );
    return {
      data: normalizeJobMatch(raw),
      source: "ai",
    };
  } catch (error) {
    const detail = formatAiError(error);
    console.error("AI job match failed, using local fallback:", error);
    return {
      data: fallbackJobMatch(input, "api_error"),
      source: "fallback",
      warning: `大模型调用失败，已回退本地关键词匹配。原因：${detail}`,
    };
  }
}
