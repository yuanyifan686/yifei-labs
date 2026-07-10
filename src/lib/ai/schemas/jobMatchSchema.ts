import { z } from "zod";
import { looseNumber, looseStringArray } from "@/lib/ai/schemas/coerce";

export const matchScoreDimensionsSchema = z.object({
  skillCoverage: looseNumber,
  experienceFit: looseNumber,
  directionFit: looseNumber,
  locationFit: looseNumber,
  overall: looseNumber,
});

export const jobMatchRoleSchema = z.object({
  title: z.string().min(1),
  company: z.string().optional(),
  location: z.string().optional(),
  sourceText: z.string().optional(),
  matchScore: looseNumber,
  scoreDimensions: matchScoreDimensionsSchema.optional(),
  recommendedLevel: z.string().optional(),
  reason: z.string().optional(),
  strengths: looseStringArray.optional(),
  gaps: looseStringArray.optional(),
  suggestedResumeKeywords: looseStringArray.optional(),
  matchedKeywords: looseStringArray.optional(),
  resumeTips: looseStringArray.optional(),
  jobId: z.string().optional(),
  isSynthetic: z.boolean().optional(),
  skillTags: looseStringArray.optional(),
  retrievalScore: looseNumber.optional(),
});

export const jobMatchResultSchema = z.object({
  candidateSummary: z.string().optional(),
  recommendedRoles: z.array(jobMatchRoleSchema).min(1),
  aggregateGaps: looseStringArray.optional(),
});

export type JobMatchResultSchema = z.infer<typeof jobMatchResultSchema>;
