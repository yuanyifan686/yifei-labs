import { getOpenAIClient } from "@/lib/ai/client";
import { createStructuredCompletion, formatAiError } from "@/lib/ai/completion";
import { fallbackSkillGap } from "@/lib/ai/fallback/skillGap";
import { normalizeSkillGap } from "@/lib/ai/normalize/skillGap";
import { skillGapResultSchema } from "@/lib/ai/schemas/skillGapSchema";
import type { AnalysisOutcome } from "@/lib/ai/types";
import { buildRuleEvidenceScores } from "@/lib/evidence/ruleEvidenceScores";
import { checkProofLinks } from "@/lib/proof/checkProofLinks";
import {
  collectProofUrls,
  collectProofUrlsEarly,
} from "@/lib/proof/extractLinksFromResume";
import { buildSkillGapPrompt } from "@/lib/prompts/skillGapPrompt";
import { parseStructuredResume } from "@/lib/resume/parseStructuredResume";
import type {
  SkillGapAnalysisInput,
  SkillGapAnalysisResult,
} from "@/types/jobMatch";
import type { ProofCheckResult } from "@/types/resume";

function mergeProofChecks(
  primary?: ProofCheckResult[],
  extra?: ProofCheckResult[],
): ProofCheckResult[] | undefined {
  const map = new Map<string, ProofCheckResult>();
  for (const item of [...(primary || []), ...(extra || [])]) {
    map.set(item.url, item);
  }
  const all = [...map.values()];
  return all.length ? all : undefined;
}

export async function analyzeSkillGap(
  input: SkillGapAnalysisInput,
): Promise<AnalysisOutcome<SkillGapAnalysisResult>> {
  // Parallel: structured resume (often cache-hit after match) + early proof checks
  const earlyUrls = collectProofUrlsEarly(
    input.resumeContent,
    input.proofLinks,
  );

  const structuredPromise = parseStructuredResume(input.resumeContent, {
    preferredLanguage: input.preferredLanguage,
  });
  const earlyProofPromise =
    earlyUrls.length > 0
      ? checkProofLinks(earlyUrls, { timeoutMs: 2500 })
      : Promise.resolve<ProofCheckResult[] | undefined>(undefined);

  const [structured, earlyProof] = await Promise.all([
    structuredPromise,
    earlyProofPromise,
  ]);

  const allUrls = collectProofUrls(
    structured,
    input.resumeContent,
    input.proofLinks,
  );
  const missing = allUrls.filter(
    (u) => !(earlyProof || []).some((p) => p.url === u),
  );
  const extraProof =
    missing.length > 0
      ? await checkProofLinks(missing, { timeoutMs: 2000 })
      : undefined;
  const proofChecks = mergeProofChecks(earlyProof, extraProof);

  const proofSummary =
    proofChecks && proofChecks.length > 0
      ? `已检查 ${proofChecks.length} 个链接，可访问 ${proofChecks.filter((c) => c.reachable).length} 个。`
      : allUrls.length === 0
        ? "未提供或未识别到作品链接。"
        : undefined;

  const ruleEvidence = buildRuleEvidenceScores({
    structured,
    targetRole: input.targetRole,
    targetJobDescription: input.targetJobDescription,
    marketJobContext: input.marketJobContext,
    proofChecks,
  });

  if (!getOpenAIClient()) {
    return {
      data: {
        ...fallbackSkillGap(input, "missing_key", {
          structured,
          proofChecks,
        }),
        proofSummary,
      },
      source: "fallback",
      warning:
        "未配置 MiniMax/OpenAI API Key，已使用结构化简历 + 规则证据链生成差距分析。",
    };
  }

  try {
    const raw = await createStructuredCompletion<SkillGapAnalysisResult>(
      "skill gap",
      buildSkillGapPrompt(input, {
        ruleEvidenceScores: ruleEvidence,
        structuredSummary: structured.summaryLine,
        proofSummary,
      }),
      {
        maxTokens: 3200,
        timeoutMs: 50_000,
        retries: 1,
        temperature: 0.15,
        validate: (data) => {
          const parsed = skillGapResultSchema.safeParse(data);
          if (!parsed.success) {
            return {
              ok: false,
              error: parsed.error.issues
                .slice(0, 3)
                .map((i) => `${i.path.join(".")}: ${i.message}`)
                .join("; "),
            };
          }
          return { ok: true, data: parsed.data as SkillGapAnalysisResult };
        },
      },
    );

    const data = normalizeSkillGap(raw, input.targetRole, input, {
      ruleEvidenceScores: ruleEvidence,
      proofSummary,
      structuredResumeHash: structured.rawTextHash,
    });
    return {
      data: {
        ...data,
        proofChecks,
        proofSummary,
      },
      source: "ai",
    };
  } catch (error) {
    const detail = formatAiError(error);
    console.error("AI skill gap analysis failed, using local fallback:", error);
    return {
      data: {
        ...fallbackSkillGap(input, "api_error", {
          structured,
          proofChecks,
        }),
        proofSummary,
      },
      source: "fallback",
      warning: `大模型调用失败，已回退证据型规则分析。原因：${detail}`,
    };
  }
}
