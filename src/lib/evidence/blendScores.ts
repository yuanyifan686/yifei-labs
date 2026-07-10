import {
  ALL_EVIDENCE_CATEGORIES,
  EVIDENCE_CATEGORY_LABELS,
} from "@/lib/evidence/scoreCategories";
import type { CandidateEvidenceScore, EvidenceCategory } from "@/types/resume";

function clamp(n: number) {
  return Math.min(100, Math.max(0, Math.round(n)));
}

/**
 * Ensure 5 categories exist; prefer rule structure, blend LLM narrative when present.
 */
export function ensureEvidenceScores(
  ruleScores: CandidateEvidenceScore[],
  llmScores?: CandidateEvidenceScore[] | null,
): CandidateEvidenceScore[] {
  const ruleMap = new Map(ruleScores.map((s) => [s.category, s]));
  const llmMap = new Map(
    (llmScores || [])
      .filter((s) => s && s.category)
      .map((s) => [s.category as EvidenceCategory, s]),
  );

  return ALL_EVIDENCE_CATEGORIES.map((category) => {
    const rule = ruleMap.get(category);
    const llm = llmMap.get(category);
    if (!rule && !llm) {
      return {
        category,
        label: EVIDENCE_CATEGORY_LABELS[category],
        score: 50,
        max: 100,
        evidence: ["暂无足够证据，已给中性分"],
        risks: ["该维度证据不足，建议补充简历细节"],
        nextActions: ["补充与目标岗位相关的项目与结果"],
      };
    }
    if (!llm) return rule!;
    if (!rule) {
      return {
        category,
        label: llm.label || EVIDENCE_CATEGORY_LABELS[category],
        score: clamp(llm.score),
        max: llm.max || 100,
        evidence: (llm.evidence || []).slice(0, 6),
        risks: (llm.risks || []).slice(0, 4),
        nextActions: (llm.nextActions || []).slice(0, 4),
      };
    }
    // Blend: structure from rules, pull score slightly toward LLM; merge evidence
    const score = clamp(rule.score * 0.55 + Number(llm.score || rule.score) * 0.45);
    return {
      category,
      label: EVIDENCE_CATEGORY_LABELS[category],
      score,
      max: 100,
      evidence: [
        ...new Set([...(llm.evidence || []), ...rule.evidence]),
      ].slice(0, 6),
      risks: [...new Set([...(llm.risks || []), ...rule.risks])].slice(0, 4),
      nextActions: [
        ...new Set([...(llm.nextActions || []), ...rule.nextActions]),
      ].slice(0, 4),
    };
  });
}
