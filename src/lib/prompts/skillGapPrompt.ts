import { PROMPT_LIMITS, clipLines, clipText, untrustedBlock } from "@/lib/ai/promptBudget";
import type { SkillGapAnalysisInput } from "@/types/jobMatch";
import type { CandidateEvidenceScore } from "@/types/resume";

function compactEvidenceSeed(scores?: CandidateEvidenceScore[]): string {
  if (!scores?.length) return "[]";
  const compact = scores.map((s) => ({
    category: s.category,
    score: s.score,
    evidence: (s.evidence || []).slice(0, 2),
    risks: (s.risks || []).slice(0, 2),
    nextActions: (s.nextActions || []).slice(0, 2),
  }));
  return JSON.stringify(compact);
}

export function buildSkillGapPrompt(
  input: SkillGapAnalysisInput,
  options?: {
    ruleEvidenceScores?: CandidateEvidenceScore[];
    structuredSummary?: string;
    proofSummary?: string;
  },
) {
  const resume = clipText(input.resumeContent, PROMPT_LIMITS.resume);
  const jd = clipText(input.targetJobDescription, PROMPT_LIMITS.jd);
  const market = clipLines(
    input.marketJobContext,
    PROMPT_LIMITS.marketContext,
    40,
  );
  const seed = clipText(
    compactEvidenceSeed(options?.ruleEvidenceScores),
    PROMPT_LIMITS.evidenceSeed,
  );
  const lang =
    input.preferredLanguage === "English" ? "English" : "Chinese";

  const proof =
    options?.proofSummary ||
    (input.proofLinks && Object.keys(input.proofLinks).length
      ? JSON.stringify(input.proofLinks)
      : "none");

  return `Career coach for a job seeker (not HR rejector). Evidence-based market-fit diagnosis.

Hard rules:
- JSON object only. No markdown.
- Do NOT score school prestige/GPA/name/gender/age.
- Never invent employers, metrics, or links.
- Evidence must quote or paraphrase resume/JD facts.
- evidenceScores: exactly these 5 categories: skill_coverage, project_depth, production_experience, proof_assets, role_fit.
- Each evidence array ≤3 short strings; risks/nextActions ≤2.
- Arrays for strengths/gaps/etc ≤5 items.
- Language: ${lang}.

Target role: ${input.targetRole}
JD (optional):
${untrustedBlock("JOB_DESCRIPTION", jd)}

Market demand signals (synthetic, optional):
${untrustedBlock("MARKET_CONTEXT", market)}

Structured resume summary:
${options?.structuredSummary || "N/A"}

Proof check summary: ${proof}

Rule evidence seed (refine scores ±15 max; keep grounded evidence; rewrite poorly phrased risks to candidate-friendly Chinese/English):
${seed}

Resume:
${untrustedBlock("RESUME", resume)}

Schema (fill all keys; omit unused optional text fields if empty):
{
  "targetRole": "${input.targetRole.replace(/"/g, "")}",
  "readinessScore": 0,
  "marketFitScore": 0,
  "summary": "",
  "marketDemandSummary": "",
  "matchedStrengths": [],
  "missingSkills": [],
  "commonMarketRequirements": [],
  "learningPriorities": [],
  "resumeImprovements": [],
  "interviewPrepTips": [],
  "suggestedKeywords": [],
  "evidenceScores": [
    {"category":"skill_coverage","label":"技能覆盖","score":0,"max":100,"evidence":[],"risks":[],"nextActions":[]},
    {"category":"project_depth","label":"项目深度","score":0,"max":100,"evidence":[],"risks":[],"nextActions":[]},
    {"category":"production_experience","label":"生产经验","score":0,"max":100,"evidence":[],"risks":[],"nextActions":[]},
    {"category":"proof_assets","label":"证明资产","score":0,"max":100,"evidence":[],"risks":[],"nextActions":[]},
    {"category":"role_fit","label":"岗位贴合","score":0,"max":100,"evidence":[],"risks":[],"nextActions":[]}
  ],
  "riskFlags": [],
  "nextActions": []
}`;
}
