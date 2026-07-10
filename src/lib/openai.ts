/**
 * Compatibility facade for AI analysis entry points.
 * Implementation lives under src/lib/ai/** — import from @/lib/ai/* in new code.
 */

export type { AnalysisOutcome, AnalysisSource } from "@/lib/ai/types";

export { analyzeJobMatch } from "@/lib/ai/services/matchService";
export { analyzeSkillGap } from "@/lib/ai/services/gapService";
export { generateLearningPlan } from "@/lib/ai/services/learningPlanService";
export { optimizeResumeForRole } from "@/lib/ai/services/resumeOptimizeService";
export { recommendRoleDirections } from "@/lib/ai/services/roleDirectionService";
export { generateJobBank } from "@/lib/ai/services/jobBankService";
