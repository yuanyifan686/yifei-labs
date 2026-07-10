import { z } from "zod";
import { looseNumber, looseStringArray } from "@/lib/ai/schemas/coerce";

export const evidenceScoreSchema = z.object({
  category: z.enum([
    "skill_coverage",
    "project_depth",
    "production_experience",
    "proof_assets",
    "role_fit",
  ]),
  label: z.string().optional(),
  score: looseNumber,
  max: looseNumber.optional(),
  evidence: looseStringArray.optional(),
  risks: looseStringArray.optional(),
  nextActions: looseStringArray.optional(),
});

export const skillGapResultSchema = z.object({
  targetRole: z.string().min(1),
  readinessScore: looseNumber,
  marketFitScore: looseNumber.optional(),
  summary: z.string().optional(),
  marketDemandSummary: z.string().optional(),
  matchedStrengths: looseStringArray.optional(),
  missingSkills: looseStringArray.optional(),
  commonMarketRequirements: looseStringArray.optional(),
  learningPriorities: looseStringArray.optional(),
  resumeImprovements: looseStringArray.optional(),
  interviewPrepTips: looseStringArray.optional(),
  suggestedKeywords: looseStringArray.optional(),
  // Optional at schema level — normalize fills missing categories from rules
  evidenceScores: z.array(evidenceScoreSchema).optional(),
  riskFlags: looseStringArray.optional(),
  nextActions: looseStringArray.optional(),
});

export type SkillGapResultSchema = z.infer<typeof skillGapResultSchema>;
