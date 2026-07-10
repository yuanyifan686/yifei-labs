export type CurrentStatus =
  | "Student"
  | "New Graduate"
  | "Employed"
  | "Career Switcher"
  | "Freelancer";

export type ExperienceLevel =
  | "Student"
  | "Entry Level"
  | "Junior"
  | "Intermediate"
  | "Senior";

export type PreferredLanguage = "English" | "Chinese" | "Bilingual";

export interface JobMatchInput {
  fullName: string;
  currentStatus: CurrentStatus;
  experienceLevel: ExperienceLevel;
  preferredLanguage: PreferredLanguage;
  preferredLocation?: string;
  resumeContent: string;
  jobListContent: string;
}

/** Phase 1: recommend target role directions from resume only (before live JD list). */
export interface RoleDirectionInput {
  fullName?: string;
  currentStatus: CurrentStatus;
  experienceLevel: ExperienceLevel;
  preferredLanguage: PreferredLanguage;
  preferredLocation?: string;
  resumeContent: string;
}

export interface RoleDirection {
  title: string;
  matchScore: number;
  reason: string;
  levelHint: string;
  searchKeywords: string[];
  bossQuery: string;
  zhilianQuery: string;
  typicalRequirements: string[];
}

export interface RoleDirectionResult {
  candidateSummary: string;
  directions: RoleDirection[];
  platformSearchTips: string[];
}

export type JobPlatformId = "boss" | "zhilian" | "paste" | "sample" | "ai_template" | "job_bank";

/** AI-generated market-style job stored in local file database. */
export interface StoredJob {
  id: string;
  title: string;
  company: string;
  location: string;
  salary: string;
  /** Where this synthetic job is styled after */
  platformStyle: "boss" | "zhilian" | "market";
  requirements: string;
  description: string;
  keywords: string[];
  /** Normalized skill tags for retrieval / scoring (optional on legacy rows). */
  skillTags?: string[];
  relatedDirections: string[];
  source: "minimax" | "grok" | "fallback";
  /** All seed/generated bank jobs are synthetic market samples. */
  isSynthetic?: boolean;
  seniority?: "intern" | "junior" | "mid" | "senior" | "lead";
  batchId: string;
  createdAt: string;
}

/** Rule/LLM-extracted resume profile used by matching pipeline. */
export interface ResumeSkill {
  name: string;
  level?: "basic" | "proficient" | "expert";
  evidence?: string;
}

export interface ResumeProject {
  name: string;
  impact?: string;
  tech: string[];
}

export interface ResumeProfile {
  skills: ResumeSkill[];
  skillNames: string[];
  yearsTotal?: number;
  domains: string[];
  projects: ResumeProject[];
  education: string[];
  preferredLocations: string[];
  rawTextHash: string;
  summaryLine: string;
}

/** Explainable match dimensions (0–100 each). */
export interface MatchScoreDimensions {
  skillCoverage: number;
  experienceFit: number;
  directionFit: number;
  locationFit: number;
  overall: number;
}

export interface MatchPipelineMeta {
  jobBankTotal: number;
  candidateCount: number;
  rankedCount: number;
  profileSkillCount: number;
  retrievalMode: "topk" | "full_slice";
  /** Whether direction prefilter was applied (explicit or weak domains). */
  directionFilterEnabled?: boolean;
  /** Titles / domains used for retrieval filter. */
  directionTitles?: string[];
  /** explicit = user/AI directions; weak = profile domains; none = full bank rank */
  directionFilterMode?: "explicit" | "weak" | "none";
}

export interface JobDatabaseFile {
  version: 1;
  updatedAt: string;
  jobs: StoredJob[];
}

export interface GenerateJobBankInput {
  fullName?: string;
  currentStatus: CurrentStatus;
  experienceLevel: ExperienceLevel;
  preferredLanguage: PreferredLanguage;
  preferredLocation?: string;
  resumeContent: string;
  /** Selected AI role directions to seed job generation */
  directions: RoleDirection[];
  /** How many jobs to generate this batch */
  count?: number;
  /** Replace entire DB vs append/merge */
  mode?: "append" | "replace";
}

export interface JobBankStats {
  total: number;
  updatedAt: string | null;
  titles: string[];
  batches: number;
}

export interface JobMatch {
  title: string;
  company?: string;
  location?: string;
  sourceText?: string;
  matchScore: number;
  /** Multi-dimensional scores; overall aligns with matchScore when present. */
  scoreDimensions?: MatchScoreDimensions;
  recommendedLevel: string;
  reason: string;
  strengths: string[];
  gaps: string[];
  suggestedResumeKeywords: string[];
  matchedKeywords: string[];
  resumeTips: string[];
  /** Local job-bank id when matched from StoredJob. */
  jobId?: string;
  isSynthetic?: boolean;
  skillTags?: string[];
  retrievalScore?: number;
}

export interface JobMatchResult {
  candidateSummary: string;
  recommendedRoles: JobMatch[];
  /** Structured profile snapshot used for this run. */
  profile?: ResumeProfile;
  /** Cross-role top skill gaps for decision HUD. */
  aggregateGaps?: string[];
  /** Pipeline telemetry for UI / report. */
  pipeline?: MatchPipelineMeta;
}

export interface ResumeOptimizationInput {
  originalResume: string;
  selectedRole: JobMatch;
  preferredLanguage: PreferredLanguage;
  optionalJobDescription?: string;
  jobMatchProjectId?: string;
}

export interface SkillGapAnalysisInput {
  resumeContent: string;
  targetRole: string;
  targetJobDescription?: string;
  preferredLanguage: PreferredLanguage;
  /** Optional market job snippets from local job bank for realistic gap analysis */
  marketJobContext?: string;
  /** Optional proof links for evidence scoring (GitHub / demo / portfolio). */
  proofLinks?: import("@/types/resume").ProofLinkInput;
}

export interface SkillCoverageCell {
  skill: string;
  inResume: boolean;
  inTargetJd: boolean;
  inMarket: boolean;
  status: "covered" | "weak" | "missing";
}

export interface SkillGapAnalysisResult {
  targetRole: string;
  readinessScore: number;
  summary: string;
  matchedStrengths: string[];
  missingSkills: string[];
  learningPriorities: string[];
  resumeImprovements: string[];
  interviewPrepTips: string[];
  suggestedKeywords: string[];
  /** 0-100 market demand / fit narrative helpers */
  marketFitScore?: number;
  marketDemandSummary?: string;
  commonMarketRequirements?: string[];
  /** Heat-matrix style coverage for UI. */
  skillMatrix?: SkillCoverageCell[];
  marketJobsUsed?: number;
  /** Evidence-chain scores (hiring-agent inspired, candidate-friendly). */
  evidenceScores?: import("@/types/resume").CandidateEvidenceScore[];
  /** Aggregated risks that may hurt match confidence */
  riskFlags?: string[];
  /** Aggregated next actions from evidence scores */
  nextActions?: string[];
  proofChecks?: import("@/types/resume").ProofCheckResult[];
  proofSummary?: string;
  structuredResumeHash?: string;
}

export interface LearningPlanInput {
  resumeContent: string;
  targetRole: string;
  preferredLanguage: PreferredLanguage;
  readinessScore: number;
  marketFitScore?: number;
  matchedStrengths: string[];
  missingSkills: string[];
  learningPriorities: string[];
  /** Weekly study hours; defaults to 10 in prompts when omitted. */
  hoursPerWeek?: number;
}

export interface LearningWeekPlan {
  week: number;
  theme: string;
  goals: string[];
  dailyFocus: string[];
  deliverables: string[];
}

export interface LearningProjectIdea {
  title: string;
  difficulty: string;
  durationDays: number;
  skillsCovered: string[];
  description: string;
  resumeBullet: string;
}

export interface LearningPlanResult {
  targetRole: string;
  horizonDays: number;
  summary: string;
  weeklyPlan: LearningWeekPlan[];
  projectIdeas: LearningProjectIdea[];
  milestones: string[];
  resources: string[];
}

export interface ResumeScore {
  overall: number;
  roleMatch: number;
  keywordMatch: number;
  clarity: number;
  atsFriendliness: number;
}

export interface ResumeDiffItem {
  original: string;
  revised: string;
  reason: string;
}

export interface ResumeOptimizationResult {
  score: ResumeScore;
  keyImprovements: string[];
  missingKeywords: string[];
  optimizedResume: string;
  /** Optional sentence-level diffs for transparent rewrite. */
  diffs?: ResumeDiffItem[];
}

/** Client/server analysis session for multi-step career flow. */
export interface AnalysisSession {
  id: string;
  createdAt: string;
  updatedAt: string;
  /** Weak identity for history isolation without full auth. */
  clientToken?: string;
  /** SHA-256 prefix of resume text; avoids storing full resume by default. */
  resumeTextHash?: string;
  resumeProfile?: ResumeProfile;
  /** Full structured resume for evidence pipelines (JSON-Resume style). */
  structuredResume?: import("@/types/resume").StructuredResume;
  jobBankVersion?: string;
  matchResult?: JobMatchResult;
  gapResults?: SkillGapAnalysisResult[];
  learningPlans?: LearningPlanResult[];
  optimizations?: ResumeOptimizationResult[];
  source?: "ai" | "fallback" | "mixed";
  /** Where the session is stored (for UI degradation messaging). */
  persistence?: "memory" | "supabase";
}

export type SessionPatch = Partial<
  Pick<
    AnalysisSession,
    | "clientToken"
    | "resumeTextHash"
    | "resumeProfile"
    | "structuredResume"
    | "jobBankVersion"
    | "matchResult"
    | "gapResults"
    | "learningPlans"
    | "optimizations"
    | "source"
  >
>;

export interface JobMatchProject {
  id: string;
  created_at: string;
  full_name: string;
  current_status: CurrentStatus;
  experience_level: ExperienceLevel;
  preferred_language: PreferredLanguage;
  preferred_location: string | null;
  resume_content: string;
  job_match_result: JobMatchResult;
}

export interface ResumeOptimizationRecord {
  id: string;
  created_at: string;
  job_match_project_id: string | null;
  selected_role: JobMatch;
  optional_job_description: string | null;
  optimization_result: ResumeOptimizationResult;
}
