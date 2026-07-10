export type { AnalysisOutcome, AnalysisSource } from "@/lib/ai/types";
export {
  formatAiError,
  getChatCreateOptions,
  getModelName,
  getOpenAIClient,
  isAiConfigured,
  isMiniMaxProvider,
} from "@/lib/ai/client";
export { createStructuredCompletion } from "@/lib/ai/completion";
export {
  extractJsonPayload,
  parseJsonResponse,
  repairJsonText,
} from "@/lib/ai/parse";
export { clipText, PROMPT_LIMITS } from "@/lib/ai/promptBudget";
export { normalizeJobMatch } from "@/lib/ai/normalize/jobMatch";
export { normalizeSkillGap } from "@/lib/ai/normalize/skillGap";
export { normalizeLearningPlan } from "@/lib/ai/normalize/learningPlan";
export { normalizeResumeOptimization } from "@/lib/ai/normalize/resumeOptimize";
export { normalizeRoleDirections } from "@/lib/ai/normalize/roleDirections";
export {
  asStringArray,
  clampScore,
  normalizeScoreDimensions,
} from "@/lib/ai/normalize/common";

export { analyzeJobMatch } from "@/lib/ai/services/matchService";
export { analyzeSkillGap } from "@/lib/ai/services/gapService";
export { generateLearningPlan } from "@/lib/ai/services/learningPlanService";
export { optimizeResumeForRole } from "@/lib/ai/services/resumeOptimizeService";
export { recommendRoleDirections } from "@/lib/ai/services/roleDirectionService";
export { generateJobBank } from "@/lib/ai/services/jobBankService";
