import { asStringArray, clampScore } from "@/lib/ai/normalize/common";
import { ensureEvidenceScores } from "@/lib/evidence/blendScores";
import {
  collectNextActions,
  collectRiskFlags,
  readinessFromEvidenceScores,
} from "@/lib/evidence/ruleEvidenceScores";
import { EVIDENCE_CATEGORY_LABELS } from "@/lib/evidence/scoreCategories";
import { buildSkillMatrix } from "@/lib/matching/buildSkillMatrix";
import { extractResumeProfile } from "@/lib/profile/extractResumeProfile";
import type {
  SkillGapAnalysisInput,
  SkillGapAnalysisResult,
} from "@/types/jobMatch";
import type { CandidateEvidenceScore } from "@/types/resume";

function normalizeEvidenceList(
  raw: SkillGapAnalysisResult["evidenceScores"],
): CandidateEvidenceScore[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .filter((item) => item && item.category)
    .map((item) => ({
      category: item.category,
      label:
        item.label ||
        EVIDENCE_CATEGORY_LABELS[item.category] ||
        item.category,
      score: clampScore(item.score, 50),
      max: clampScore(item.max ?? 100, 100) || 100,
      evidence: asStringArray(item.evidence).slice(0, 6),
      risks: asStringArray(item.risks).slice(0, 4),
      nextActions: asStringArray(item.nextActions).slice(0, 4),
    }));
}

export function normalizeSkillGap(
  raw: SkillGapAnalysisResult,
  targetRole: string,
  input?: SkillGapAnalysisInput,
  options?: {
    ruleEvidenceScores?: CandidateEvidenceScore[];
    proofSummary?: string;
    structuredResumeHash?: string;
  },
): SkillGapAnalysisResult {
  const readinessScore = Number(raw?.readinessScore);
  const marketFitScore = Number(raw?.marketFitScore);
  const llmEvidence = normalizeEvidenceList(raw?.evidenceScores);
  const hasEvidenceSignal =
    (options?.ruleEvidenceScores?.length ?? 0) > 0 || llmEvidence.length > 0;
  const evidenceScores = ensureEvidenceScores(
    options?.ruleEvidenceScores || [],
    llmEvidence,
  );

  const readinessFromEvidence = readinessFromEvidenceScores(
    evidenceScores,
    targetRole,
  );
  // Only blend with evidence when we have real rule/LLM scores; neutral
  // placeholders (all 50) should not drag down a valid model readinessScore.
  const blendedReadiness = hasEvidenceSignal
    ? Number.isFinite(readinessScore)
      ? Math.round(
          clampScore(readinessScore, readinessFromEvidence) * 0.45 +
            readinessFromEvidence * 0.55,
        )
      : readinessFromEvidence
    : Number.isFinite(readinessScore)
      ? clampScore(readinessScore, 50)
      : readinessFromEvidence;

  const riskFlags = [
    ...new Set([
      ...asStringArray(raw?.riskFlags),
      ...collectRiskFlags(evidenceScores),
    ]),
  ].slice(0, 8);

  const nextActions = [
    ...new Set([
      ...asStringArray(raw?.nextActions),
      ...collectNextActions(evidenceScores),
    ]),
  ].slice(0, 8);

  const base: SkillGapAnalysisResult = {
    targetRole: String(raw?.targetRole || targetRole).trim(),
    readinessScore: blendedReadiness,
    marketFitScore: Number.isFinite(marketFitScore)
      ? clampScore(marketFitScore, blendedReadiness)
      : clampScore(
          evidenceScores.find((e) => e.category === "role_fit")?.score ??
            blendedReadiness - 4,
          blendedReadiness,
        ),
    summary: String(raw?.summary || "已完成能力差距分析。").trim(),
    marketDemandSummary: raw?.marketDemandSummary
      ? String(raw.marketDemandSummary).trim()
      : undefined,
    matchedStrengths: asStringArray(raw?.matchedStrengths),
    missingSkills: asStringArray(raw?.missingSkills),
    commonMarketRequirements: asStringArray(raw?.commonMarketRequirements),
    learningPriorities:
      asStringArray(raw?.learningPriorities).length > 0
        ? asStringArray(raw?.learningPriorities)
        : nextActions.slice(0, 5),
    resumeImprovements: asStringArray(raw?.resumeImprovements),
    interviewPrepTips: asStringArray(raw?.interviewPrepTips),
    suggestedKeywords: asStringArray(raw?.suggestedKeywords),
    evidenceScores,
    riskFlags,
    nextActions,
    proofSummary: options?.proofSummary,
    structuredResumeHash: options?.structuredResumeHash,
  };

  if (input?.resumeContent) {
    const profile = extractResumeProfile(input.resumeContent);
    base.skillMatrix = buildSkillMatrix({
      profile,
      targetRole: base.targetRole,
      targetJobDescription: input.targetJobDescription,
      marketJobContext: input.marketJobContext,
    });
  }

  return base;
}
