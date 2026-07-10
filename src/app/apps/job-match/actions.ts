"use server";

import {
  findRelatedMarketJobs,
  getJobBankStats,
  getJobBankStorageKind,
  getJobListContentFromDatabase,
  hydrateStoredJob,
  jobsToMarketContext,
  listStoredJobs,
  upsertJobs,
} from "@/lib/jobDatabase";
import {
  buildMatchResultFromCandidates,
  enrichJobMatchResult,
} from "@/lib/matching/enrichMatchResult";
import {
  candidatesToJobListContent,
  retrieveCandidates,
} from "@/lib/matching/retrieveCandidates";
import {
  analyzeJobMatch,
  analyzeSkillGap,
  generateJobBank,
  generateLearningPlan,
  optimizeResumeForRole,
  recommendRoleDirections,
} from "@/lib/ai";
import { parseStructuredResume } from "@/lib/resume/parseStructuredResume";
import { toResumeProfile } from "@/lib/resume/toResumeProfile";
import { extractResumeTextFromFile } from "@/lib/parseResume";
import {
  attachGapToSession,
  attachLearningPlanToSession,
  attachMatchToSession,
  attachOptimizationToSession,
  deleteSessionForClient,
  getAnalysisSessionForClient,
  hashResumeText,
  isSessionPersistenceEnabled,
  mergeJobPools,
  listSessionsForClient,
} from "@/lib/session/analysisSession";
import { isSupabaseConfigured, saveResumeOptimization } from "@/lib/supabase";
import { actionError, ActionState } from "@/lib/actionState";
import {
  getAnalysisLoadSnapshot,
  withAnalysisSlot,
  type AnalysisLoadSnapshot,
} from "@/lib/load/analysisLoadTracker";
import {
  AnalysisSession,
  GenerateJobBankInput,
  JobBankStats,
  JobMatchInput,
  JobMatchResult,
  LearningPlanInput,
  LearningPlanResult,
  MatchPipelineMeta,
  ResumeOptimizationInput,
  ResumeOptimizationResult,
  RoleDirectionInput,
  RoleDirectionResult,
  SkillGapAnalysisInput,
  SkillGapAnalysisResult,
  StoredJob,
} from "@/types/jobMatch";

export type { ActionState, ActionErrorCode } from "@/lib/actionState";

/** Optional client context for session continuity + privacy isolation. */
export type ClientContext = {
  sessionId?: string;
  clientToken?: string;
  /** When false, still returns sessionId for in-run continuity but prefers memory-only semantics. */
  persistHistory?: boolean;
};

function persistenceWarning(persistHistory?: boolean): string | undefined {
  if (persistHistory === false) {
    return "已关闭历史归档：本次会话仅进程内临时保存，不会写入云端历史。";
  }
  if (!isSessionPersistenceEnabled()) {
    return "当前未配置 Supabase，分析会话仅保存在本机进程内存中（重启后丢失，未开启云端归档）。";
  }
  return undefined;
}

function writePersist(persistHistory?: boolean) {
  return persistHistory === false ? false : true;
}

function validateResumeOnlyInput(
  input: Pick<RoleDirectionInput, "resumeContent" | "preferredLanguage">,
) {
  if (input.resumeContent.trim().length < 100) {
    return "请粘贴更完整的简历内容，至少需要 100 个字符。";
  }
  if (!input.preferredLanguage) {
    return "请选择输出语言。";
  }
  return null;
}

function validateJobMatchInput(input: JobMatchInput) {
  const baseError = validateResumeOnlyInput(input);
  if (baseError) return baseError;
  if (input.jobListContent.trim().length < 20) {
    return "请粘贴或上传岗位列表，至少包含一个岗位。";
  }
  return null;
}

export async function runRoleDirectionAction(
  input: RoleDirectionInput,
): Promise<ActionState<RoleDirectionResult>> {
  const validationError = validateResumeOnlyInput(input);
  if (validationError) {
    return actionError(validationError, "VALIDATION_ERROR");
  }

  try {
    const outcome = await recommendRoleDirections({
      ...input,
      fullName: input.fullName?.trim() || "匿名用户",
    });
    return {
      ok: true,
      data: outcome.data,
      source: outcome.source,
      warning: outcome.warning,
    };
  } catch (error) {
    console.error("Role direction action failed:", error);
    return actionError("岗位方向推荐失败，请稍后重试。", "AI_UNAVAILABLE");
  }
}

function validateSkillGapInput(input: SkillGapAnalysisInput) {
  if (input.resumeContent.trim().length < 100) {
    return "请粘贴更完整的简历内容，至少需要 100 个字符。";
  }
  if (!input.targetRole.trim()) {
    return "请输入目标岗位。";
  }
  return null;
}

function validateResumeOptimizationInput(input: ResumeOptimizationInput) {
  if (input.originalResume.trim().length < 100) {
    return "请粘贴更完整的简历内容，至少需要 100 个字符。";
  }
  if (!input.selectedRole?.title) {
    return "请先选择一个目标岗位。";
  }
  return null;
}

export async function runJobMatchAction(
  input: JobMatchInput & ClientContext,
): Promise<ActionState<JobMatchResult>> {
  const validationError = validateJobMatchInput(input);
  if (validationError) {
    return actionError(validationError, "VALIDATION_ERROR");
  }

  try {
    return await withAnalysisSlot(
      "job-match",
      async () => {
        const normalizedInput = {
          ...input,
          fullName: input.fullName.trim() || "匿名用户",
        };
        const outcome = await analyzeJobMatch(normalizedInput);
        const warnings = [outcome.warning, persistenceWarning()].filter(Boolean);
        return {
          ok: true as const,
          data: outcome.data,
          source: outcome.source,
          warning: warnings.length ? warnings.join(" ") : undefined,
        };
      },
      { clientId: input.clientToken },
    );
  } catch (error) {
    console.error("Job match action failed:", error);
    return actionError("分析失败，请稍后重试。", "AI_UNAVAILABLE");
  }
}

export async function getJobBankStatsAction(): Promise<ActionState<JobBankStats>> {
  try {
    const stats = await getJobBankStats();
    return { ok: true, data: stats };
  } catch (error) {
    console.error("Get job bank stats failed:", error);
    return actionError("读取岗位库失败。", "JOB_BANK_EMPTY");
  }
}

export async function runGenerateJobBankAction(
  input: GenerateJobBankInput,
): Promise<
  ActionState<{
    jobs: StoredJob[];
    stats: JobBankStats;
    jobListContent: string;
  }>
> {
  const validationError = validateResumeOnlyInput(input);
  if (validationError) {
    return actionError(validationError, "VALIDATION_ERROR");
  }

  try {
    // Multi-user safety: default append. replace is allowed but warned —
    // prefer soft-append so concurrent testers don't wipe each other.
    const requestedMode = input.mode || "append";
    const mode: "append" | "replace" =
      requestedMode === "replace" ? "replace" : "append";

    const outcome = await generateJobBank({
      ...input,
      fullName: input.fullName?.trim() || "匿名用户",
      count: input.count || 12,
      mode,
    });

    const db = await upsertJobs(outcome.data, mode);
    const jobListContent = (
      await getJobListContentFromDatabase({
        limit: 40,
        directionTitles: input.directions.map((d) => d.title),
      })
    ).content;

    const modeWarning =
      mode === "replace"
        ? "注意：replace 会覆盖共享岗位库，多人测试时请改用 append。"
        : "已以 append 写入共享岗位库（不删除他人样本）。";

    return {
      ok: true,
      data: {
        jobs: outcome.data,
        stats: {
          total: db.jobs.length,
          updatedAt: db.updatedAt,
          titles: [...new Set(db.jobs.map((j) => j.title))].slice(0, 12),
          batches: new Set(db.jobs.map((j) => j.batchId)).size,
        },
        jobListContent,
      },
      source: outcome.source,
      warning: [
        outcome.warning,
        modeWarning,
        "岗位库为合成市场岗位（非 Boss/智联实时在招），仅供匹配演练。",
      ]
        .filter(Boolean)
        .join(" "),
    };
  } catch (error) {
    console.error("Generate job bank failed:", error);
    return actionError("生成岗位库失败，请稍后重试。", "AI_UNAVAILABLE");
  }
}

/** Load jobs from local file DB into job-list text for matching. */
export async function loadJobBankForMatchAction(options?: {
  directionTitles?: string[];
  limit?: number;
}): Promise<ActionState<{ jobListContent: string; stats: JobBankStats; count: number }>> {
  try {
    const loaded = await getJobListContentFromDatabase({
      limit: options?.limit ?? 30,
      directionTitles: options?.directionTitles,
    });
    if (loaded.count === 0) {
      return actionError("岗位库为空，请先用 MiniMax 生成岗位数据。", "JOB_BANK_EMPTY");
    }
    const stats = await getJobBankStats();
    return {
      ok: true,
      data: {
        jobListContent: loaded.content,
        stats,
        count: loaded.count,
      },
    };
  } catch (error) {
    console.error("Load job bank failed:", error);
    return actionError("读取岗位库失败。", "JOB_BANK_EMPTY");
  }
}

/** One-shot: ensure job bank has data (generate if empty), then match resume via profile + TopK + LLM/rules. */
export async function runMatchAgainstJobBankAction(
  input: Omit<JobMatchInput, "jobListContent"> & {
    directions?: GenerateJobBankInput["directions"];
    regenerate?: boolean;
    topK?: number;
  } & ClientContext,
): Promise<
  ActionState<
    JobMatchResult & {
      jobListContent: string;
      stats: JobBankStats;
      sessionId: string;
      pipeline: MatchPipelineMeta;
      persistence: "memory" | "supabase";
    }
  >
> {
  const validationError = validateResumeOnlyInput(input);
  if (validationError) {
    return actionError(validationError, "VALIDATION_ERROR");
  }

  try {
    return await withAnalysisSlot(
      "match-job-bank",
      async () => runMatchAgainstJobBankCore(input),
      { clientId: input.clientToken },
    );
  } catch (error) {
    console.error("Match against job bank failed:", error);
    return actionError("岗位库匹配失败，请稍后重试。", "AI_UNAVAILABLE");
  }
}

async function runMatchAgainstJobBankCore(
  input: Omit<JobMatchInput, "jobListContent"> & {
    directions?: GenerateJobBankInput["directions"];
    regenerate?: boolean;
    topK?: number;
  } & ClientContext,
): Promise<
  ActionState<
    JobMatchResult & {
      jobListContent: string;
      stats: JobBankStats;
      sessionId: string;
      pipeline: MatchPipelineMeta;
      persistence: "memory" | "supabase";
    }
  >
> {
  try {
    let stats = await getJobBankStats();
    const warnings: string[] = [];
    /** Session-only synthetic jobs — never replace the shared bank. */
    let personalJobs: Awaited<ReturnType<typeof listStoredJobs>> = [];

    // Seed shared bank only when empty (append). regenerate = personal overlay.
    if (stats.total === 0) {
      const generated = await generateJobBank({
        fullName: input.fullName,
        currentStatus: input.currentStatus,
        experienceLevel: input.experienceLevel,
        preferredLanguage: input.preferredLanguage,
        preferredLocation: input.preferredLocation,
        resumeContent: input.resumeContent,
        directions: input.directions || [],
        count: 12,
        mode: "append",
      });
      await upsertJobs(generated.data, "append");
      stats = await getJobBankStats();
      if (generated.warning) warnings.push(generated.warning);
      warnings.push(
        "已初始化共享合成岗位库（append）。非实时在招，供多人对照演练。",
      );
    } else if (input.regenerate) {
      const generated = await generateJobBank({
        fullName: input.fullName,
        currentStatus: input.currentStatus,
        experienceLevel: input.experienceLevel,
        preferredLanguage: input.preferredLanguage,
        preferredLocation: input.preferredLocation,
        resumeContent: input.resumeContent,
        directions: input.directions || [],
        count: 12,
        mode: "append",
      });
      personalJobs = generated.data;
      if (generated.warning) warnings.push(generated.warning);
      warnings.push(
        "本次刷新为会话级候选岗位，未覆盖全局岗位库，避免多人互相踩库。",
      );
    }

    // Stage 1: structured resume → ResumeProfile for retrieval
    const structured = await parseStructuredResume(input.resumeContent, {
      preferredLanguage: input.preferredLanguage,
      preferredLocation: input.preferredLocation,
    });
    const profile = toResumeProfile(structured);

    // Explicit directions from UI, else weak filter via profile domains
    const explicitDirections = (input.directions || [])
      .map((d) => d.title.trim())
      .filter(Boolean);
    const weakDirections = profile.domains.slice(0, 4);
    const directionFilterMode: NonNullable<MatchPipelineMeta["directionFilterMode"]> =
      explicitDirections.length > 0
        ? "explicit"
        : weakDirections.length > 0
          ? "weak"
          : "none";
    const filterTitles =
      directionFilterMode === "explicit"
        ? explicitDirections
        : directionFilterMode === "weak"
          ? weakDirections
          : [];

    // Stage 2: shared bank + optional personal overlay, then TopK
    const sharedJobs = (await listStoredJobs()).map(hydrateStoredJob);
    const allJobs = mergeJobPools(
      personalJobs.map(hydrateStoredJob),
      sharedJobs,
    );
    if (allJobs.length === 0) {
      return actionError("岗位库为空，无法匹配。", "JOB_BANK_EMPTY");
    }

    const topK = input.topK ?? 12;
    const candidates = retrieveCandidates(profile, allJobs, {
      limit: topK,
      experienceLevel: input.experienceLevel,
      preferredLocation: input.preferredLocation,
      directionTitles: filterTitles,
    });

    if (candidates.length === 0) {
      return actionError("岗位库预筛未命中候选，请扩充岗位库后重试。", "JOB_BANK_EMPTY");
    }

    const jobListContent = candidatesToJobListContent(candidates);
    const pipeline: MatchPipelineMeta = {
      jobBankTotal: allJobs.length,
      candidateCount: candidates.length,
      rankedCount: 0,
      profileSkillCount: profile.skillNames.length,
      retrievalMode: "topk",
      directionFilterEnabled: filterTitles.length > 0,
      directionTitles: filterTitles,
      directionFilterMode,
    };

    const matchInput: JobMatchInput = {
      fullName: input.fullName.trim() || "匿名用户",
      currentStatus: input.currentStatus,
      experienceLevel: input.experienceLevel,
      preferredLanguage: input.preferredLanguage,
      preferredLocation: input.preferredLocation,
      resumeContent: input.resumeContent,
      jobListContent,
    };

    // Stage 3: LLM re-rank / explain (or rules fallback)
    const outcome = await analyzeJobMatch(matchInput);
    let matchResult: JobMatchResult;

    if (outcome.source === "fallback") {
      matchResult = buildMatchResultFromCandidates(
        profile,
        candidates,
        { ...pipeline, rankedCount: candidates.length },
        outcome.warning?.includes("未配置") ? "missing_key" : "api_error",
        {
          experienceLevel: input.experienceLevel,
          preferredLocation: input.preferredLocation,
        },
      );
    } else {
      matchResult = enrichJobMatchResult(
        outcome.data,
        profile,
        candidates,
        { ...pipeline, rankedCount: outcome.data.recommendedRoles?.length || 0 },
        {
          experienceLevel: input.experienceLevel,
          preferredLocation: input.preferredLocation,
          language: input.preferredLanguage,
        },
      );
    }

    pipeline.rankedCount = matchResult.recommendedRoles.length;
    matchResult.pipeline = pipeline;
    matchResult.profile = profile;

    const session = await attachMatchToSession(
      input.sessionId,
      profile,
      matchResult,
      stats.updatedAt || new Date().toISOString(),
      outcome.source === "ai" ? "ai" : "fallback",
      {
        clientToken: input.clientToken,
        resumeTextHash: hashResumeText(input.resumeContent),
        persist: writePersist(input.persistHistory),
        structuredResume: structured,
      },
    );

    if (outcome.warning) warnings.push(outcome.warning);
    warnings.push(
      `已用简历画像（${profile.skillNames.length} 项技能）从 ${allJobs.length} 条岗位中预筛 Top ${candidates.length} 再排序。` +
        (directionFilterMode === "explicit"
          ? `方向过滤（自选）：${explicitDirections.join("、")}。`
          : directionFilterMode === "weak"
            ? `弱方向过滤（画像）：${weakDirections.join("、")}。`
            : "未启用方向过滤（全库 TopK）。") +
        " 岗位库为合成市场样本，非实时在招。",
    );
    const persistNote = persistenceWarning(input.persistHistory);
    if (persistNote) warnings.push(persistNote);

    return {
      ok: true,
      data: {
        ...matchResult,
        jobListContent,
        stats,
        sessionId: session.id,
        pipeline,
        persistence: session.persistence || "memory",
      },
      source: outcome.source,
      warning: warnings.filter(Boolean).join(" "),
    };
  } catch (error) {
    console.error("Match against job bank failed:", error);
    return actionError("岗位库匹配失败，请稍后重试。", "AI_UNAVAILABLE");
  }
}

export async function runSkillGapAnalysisAction(
  input: SkillGapAnalysisInput & ClientContext,
): Promise<
  ActionState<
    SkillGapAnalysisResult & {
      marketJobsUsed: number;
      sessionId?: string;
      persistence?: "memory" | "supabase";
    }
  >
> {
  const validationError = validateSkillGapInput(input);
  if (validationError) {
    return actionError(validationError, "VALIDATION_ERROR");
  }

  try {
    return await withAnalysisSlot(
      "skill-gap",
      async () => {
        const relatedJobs = (
          await findRelatedMarketJobs(input.targetRole, 6)
        ).map(hydrateStoredJob);
        const marketJobContext =
          input.marketJobContext ||
          jobsToMarketContext(relatedJobs) ||
          undefined;

        const outcome = await analyzeSkillGap({
          ...input,
          marketJobContext,
        });

        const data: SkillGapAnalysisResult & { marketJobsUsed: number } = {
          ...outcome.data,
          marketJobsUsed: relatedJobs.length,
        };

        const session = await attachGapToSession(input.sessionId, data, {
          clientToken: input.clientToken,
          persist: writePersist(input.persistHistory),
        });

        const warnings = [
          outcome.warning ||
            (relatedJobs.length > 0
              ? `已结合岗位库中 ${relatedJobs.length} 条相关市场需求岗位进行分析（合成市场样本，非实时在招）。`
              : "岗位库中相关样本较少，已按目标岗位名称做通用市场分析。"),
          persistenceWarning(input.persistHistory),
        ].filter(Boolean);

        return {
          ok: true as const,
          data: {
            ...data,
            sessionId: session.id,
            persistence: session.persistence,
          },
          source: outcome.source,
          warning: warnings.join(" "),
        };
      },
      { clientId: input.clientToken },
    );
  } catch (error) {
    console.error("Skill gap analysis action failed:", error);
    return actionError("能力差距分析失败，请稍后重试。", "AI_UNAVAILABLE");
  }
}

export async function runResumeOptimizationAction(
  input: ResumeOptimizationInput & ClientContext,
): Promise<ActionState<ResumeOptimizationResult & { sessionId?: string }>> {
  const validationError = validateResumeOptimizationInput(input);
  if (validationError) {
    return actionError(validationError, "VALIDATION_ERROR");
  }

  try {
    const outcome = await optimizeResumeForRole(input);
    // Optional legacy table write (does not store full resume in session)
    const optimizationId = await saveResumeOptimization(input, outcome.data);
    const session = await attachOptimizationToSession(
      input.sessionId,
      outcome.data,
      {
        clientToken: input.clientToken,
        persist: writePersist(input.persistHistory),
      },
    );

    return {
      ok: true,
      data: { ...outcome.data, sessionId: session.id },
      projectId: optimizationId,
      source: outcome.source,
      warning:
        [outcome.warning, persistenceWarning(input.persistHistory)]
          .filter(Boolean)
          .join(" ") || undefined,
    };
  } catch (error) {
    console.error("Resume optimization action failed:", error);
    return actionError("简历优化失败，请稍后重试。", "AI_UNAVAILABLE");
  }
}

export async function parseResumeFileAction(
  formData: FormData,
): Promise<ActionState<{ text: string; format: string }>> {
  try {
    const file = formData.get("file");
    if (!file || !(file instanceof File)) {
      return actionError("请选择要上传的简历文件。", "VALIDATION_ERROR");
    }

    const extracted = await extractResumeTextFromFile(file);
    return {
      ok: true,
      data: extracted,
    };
  } catch (error) {
    console.error("Parse resume file failed:", error);
    const message =
      error instanceof Error ? error.message : "简历解析失败，请稍后重试。";
    return actionError(message, "PARSE_FAILED");
  }
}

export async function runLearningPlanAction(
  input: LearningPlanInput & ClientContext,
): Promise<ActionState<LearningPlanResult & { sessionId?: string }>> {
  if (input.resumeContent.trim().length < 100) {
    return actionError(
      "请粘贴更完整的简历内容，至少需要 100 个字符。",
      "VALIDATION_ERROR",
    );
  }
  if (!input.targetRole.trim()) {
    return actionError("请先完成目标岗位分析。", "VALIDATION_ERROR");
  }

  try {
    const outcome = await generateLearningPlan(input);
    const session = await attachLearningPlanToSession(
      input.sessionId,
      outcome.data,
      {
        clientToken: input.clientToken,
        persist: writePersist(input.persistHistory),
      },
    );
    return {
      ok: true,
      data: { ...outcome.data, sessionId: session.id },
      source: outcome.source,
      warning:
        [outcome.warning, persistenceWarning(input.persistHistory)]
          .filter(Boolean)
          .join(" ") || undefined,
    };
  } catch (error) {
    console.error("Learning plan action failed:", error);
    return actionError("学习计划生成失败，请稍后重试。", "AI_UNAVAILABLE");
  }
}

/** List analysis sessions owned by this client token only. */
export async function listMyAnalysisSessionsAction(
  clientToken: string,
): Promise<ActionState<{ sessions: AnalysisSession[]; persistenceEnabled: boolean }>> {
  if (!clientToken || clientToken.length < 8) {
    return actionError("缺少客户端身份，无法读取历史。", "VALIDATION_ERROR");
  }

  try {
    const sessions = await listSessionsForClient(clientToken, 50);
    return {
      ok: true,
      data: {
        sessions,
        persistenceEnabled: isSessionPersistenceEnabled() || isSupabaseConfigured(),
      },
    };
  } catch (error) {
    console.error("List sessions failed:", error);
    return actionError("读取历史会话失败。", "PERSIST_FAILED");
  }
}

/** Get one session only when clientToken matches. */
export async function getMyAnalysisSessionAction(
  sessionId: string,
  clientToken: string,
): Promise<ActionState<{ session: AnalysisSession }>> {
  if (!sessionId || !clientToken) {
    return actionError("缺少会话或身份信息。", "VALIDATION_ERROR");
  }

  try {
    const session = await getAnalysisSessionForClient(sessionId, clientToken);
    if (!session) {
      return actionError("未找到该会话，或无权访问。", "VALIDATION_ERROR");
    }
    return { ok: true, data: { session } };
  } catch (error) {
    console.error("Get session failed:", error);
    return actionError("读取会话失败。", "PERSIST_FAILED");
  }
}

export async function deleteMyAnalysisSessionAction(
  sessionId: string,
  clientToken: string,
): Promise<ActionState<{ deleted: boolean }>> {
  if (!sessionId || !clientToken) {
    return actionError("缺少会话或身份信息。", "VALIDATION_ERROR");
  }

  try {
    const deleted = await deleteSessionForClient(sessionId, clientToken);
    if (!deleted) {
      return actionError("删除失败：会话不存在或无权操作。", "PERSIST_FAILED");
    }
    return { ok: true, data: { deleted: true } };
  } catch (error) {
    console.error("Delete session failed:", error);
    return actionError("删除会话失败。", "PERSIST_FAILED");
  }
}

export async function getPersistenceStatusAction(): Promise<
  ActionState<{
    sessionPersistence: boolean;
    supabaseConfigured: boolean;
    jobBankStorage: "file" | "supabase";
    migrationHint: string;
  }>
> {
  return {
    ok: true,
    data: {
      sessionPersistence: isSessionPersistenceEnabled(),
      supabaseConfigured: isSupabaseConfigured(),
      jobBankStorage: getJobBankStorageKind(),
      migrationHint:
        "在 Supabase SQL Editor 执行 supabase/migrations/20260710_analysis_sessions_and_jobs.sql，并配置 NEXT_PUBLIC_SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY。详见 docs/SUPABASE_SETUP.md。",
    },
  };
}

/** Poll while analysis UI is busy — concurrent testers + queue hint. */
export async function getAnalysisLoadAction(input?: {
  clientToken?: string;
  isBusyUi?: boolean;
}): Promise<ActionState<AnalysisLoadSnapshot>> {
  return {
    ok: true,
    data: getAnalysisLoadSnapshot({
      clientId: input?.clientToken,
      isBusyUi: input?.isBusyUi,
    }),
  };
}
