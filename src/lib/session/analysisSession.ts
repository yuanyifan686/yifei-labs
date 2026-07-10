import { createHash } from "crypto";
import { memorySessionStore } from "@/lib/session/memorySessionStore";
import { SessionStore } from "@/lib/session/sessionStore";
import { supabaseSessionStore } from "@/lib/session/supabaseSessionStore";
import { getSupabaseAdmin, isSupabaseConfigured } from "@/lib/supabase/admin";
import {
  AnalysisSession,
  JobMatchResult,
  LearningPlanResult,
  ResumeOptimizationResult,
  ResumeProfile,
  SessionPatch,
  SkillGapAnalysisResult,
} from "@/types/jobMatch";
import type { StructuredResume } from "@/types/resume";

let warnedMemoryFallback = false;

export function getSessionStore(): SessionStore {
  if (isSupabaseConfigured() && getSupabaseAdmin()) {
    return supabaseSessionStore;
  }
  if (!warnedMemoryFallback) {
    console.warn(
      "[session] Using in-memory SessionStore — sessions will not survive restarts or multi-instance deploys.",
    );
    warnedMemoryFallback = true;
  }
  return memorySessionStore;
}

export function hashResumeText(resumeContent: string): string {
  return createHash("sha256").update(resumeContent.trim()).digest("hex").slice(0, 24);
}

export type SessionWriteOptions = {
  /** When false, force memory store (do not archive to Supabase). */
  persist?: boolean;
};

function resolveWriteStore(persist?: boolean): SessionStore {
  if (persist === false) return memorySessionStore;
  return getSessionStore();
}

/**
 * Resolve a session for write. Refuses cross-client hijack:
 * - If session has clientToken A and writer sends B → treat as missing (create new).
 * - If session has clientToken and writer sends none → refuse overwrite.
 */
export async function resolveSessionForWrite(
  sessionId: string | undefined,
  clientToken: string | undefined,
): Promise<AnalysisSession | null> {
  if (!sessionId) return null;

  if (clientToken && clientToken.length >= 8) {
    return getAnalysisSessionForClient(sessionId, clientToken);
  }

  const existing = await getAnalysisSession(sessionId);
  if (!existing) return null;
  // Owned sessions cannot be mutated anonymously
  if (existing.clientToken) return null;
  return existing;
}

export async function createAnalysisSession(
  partial?: Partial<AnalysisSession>,
  options?: SessionWriteOptions,
): Promise<AnalysisSession> {
  const store = resolveWriteStore(options?.persist);
  try {
    const session = await store.create(partial);
    if (options?.persist === false) {
      return { ...session, persistence: "memory" };
    }
    return session;
  } catch (error) {
    console.error("[session] create failed, falling back to memory:", error);
    return memorySessionStore.create(partial);
  }
}

export async function getAnalysisSession(id: string): Promise<AnalysisSession | null> {
  const durable = await getSessionStore().get(id);
  if (durable) return durable;
  return memorySessionStore.get(id);
}

export async function getAnalysisSessionForClient(
  id: string,
  clientToken: string,
): Promise<AnalysisSession | null> {
  const durable = await getSessionStore().getForClient(id, clientToken);
  if (durable) return durable;
  return memorySessionStore.getForClient(id, clientToken);
}

export async function updateAnalysisSession(
  id: string,
  patch: SessionPatch,
  options?: SessionWriteOptions & { requireClientToken?: string },
): Promise<AnalysisSession | null> {
  const required = options?.requireClientToken;
  if (required) {
    const owned = await getAnalysisSessionForClient(id, required);
    if (!owned) return null;
  }

  if (options?.persist === false) {
    return memorySessionStore.update(id, patch);
  }
  const store = getSessionStore();
  const updated = await store.update(id, patch);
  if (updated) return updated;
  return memorySessionStore.update(id, patch);
}

export async function listSessionsForClient(
  clientToken: string,
  limit = 50,
): Promise<AnalysisSession[]> {
  if (!clientToken) return [];
  return getSessionStore().listByClientToken(clientToken, limit);
}

export async function deleteSessionForClient(
  id: string,
  clientToken: string,
): Promise<boolean> {
  return getSessionStore().delete(id, clientToken);
}

export async function attachMatchToSession(
  sessionId: string | undefined,
  profile: ResumeProfile,
  matchResult: JobMatchResult,
  jobBankVersion: string,
  source: AnalysisSession["source"],
  options?: {
    clientToken?: string;
    resumeTextHash?: string;
    persist?: boolean;
    structuredResume?: StructuredResume;
  },
): Promise<AnalysisSession> {
  const write = { persist: options?.persist };
  const patch: SessionPatch = {
    resumeProfile: profile,
    structuredResume: options?.structuredResume,
    matchResult,
    jobBankVersion,
    source,
    clientToken: options?.clientToken,
    resumeTextHash: options?.resumeTextHash || profile.rawTextHash,
  };

  const existing = await resolveSessionForWrite(sessionId, options?.clientToken);
  if (existing) {
    const updated = await updateAnalysisSession(
      existing.id,
      patch,
      {
        ...write,
        requireClientToken: options?.clientToken,
      },
    );
    if (updated) return updated;
  }

  return createAnalysisSession(
    {
      ...patch,
      gapResults: [],
      learningPlans: [],
      optimizations: [],
    },
    write,
  );
}

function mergeByKey<T>(
  list: T[],
  item: T,
  keyOf: (x: T) => string,
  max = 20,
): T[] {
  const key = keyOf(item);
  const next = list.filter((x) => keyOf(x) !== key);
  next.push(item);
  return next.slice(-max);
}

export async function attachGapToSession(
  sessionId: string | undefined,
  gap: SkillGapAnalysisResult,
  options?: { clientToken?: string; persist?: boolean },
): Promise<AnalysisSession> {
  const write = { persist: options?.persist };
  const existing = await resolveSessionForWrite(sessionId, options?.clientToken);

  if (existing) {
    // Re-read owned session to reduce stale merge under concurrent writes
    const fresh =
      (options?.clientToken
        ? await getAnalysisSessionForClient(existing.id, options.clientToken)
        : await getAnalysisSession(existing.id)) || existing;
    const gaps = mergeByKey(
      fresh.gapResults || [],
      gap,
      (g) => g.targetRole,
      12,
    );
    const updated = await updateAnalysisSession(
      fresh.id,
      {
        gapResults: gaps,
        clientToken: options?.clientToken || fresh.clientToken,
      },
      {
        ...write,
        requireClientToken: options?.clientToken,
      },
    );
    if (updated) return updated;
  }

  return createAnalysisSession(
    {
      gapResults: [gap],
      clientToken: options?.clientToken,
    },
    write,
  );
}

export async function attachLearningPlanToSession(
  sessionId: string | undefined,
  plan: LearningPlanResult,
  options?: { clientToken?: string; persist?: boolean },
): Promise<AnalysisSession> {
  const write = { persist: options?.persist };
  const existing = await resolveSessionForWrite(sessionId, options?.clientToken);

  if (existing) {
    const fresh =
      (options?.clientToken
        ? await getAnalysisSessionForClient(existing.id, options.clientToken)
        : await getAnalysisSession(existing.id)) || existing;
    const plans = mergeByKey(
      fresh.learningPlans || [],
      plan,
      (p) => p.targetRole,
      12,
    );
    const updated = await updateAnalysisSession(
      fresh.id,
      {
        learningPlans: plans,
        clientToken: options?.clientToken || fresh.clientToken,
      },
      {
        ...write,
        requireClientToken: options?.clientToken,
      },
    );
    if (updated) return updated;
  }

  return createAnalysisSession(
    {
      learningPlans: [plan],
      clientToken: options?.clientToken,
    },
    write,
  );
}

export async function attachOptimizationToSession(
  sessionId: string | undefined,
  optimization: ResumeOptimizationResult,
  options?: { clientToken?: string; persist?: boolean },
): Promise<AnalysisSession> {
  const write = { persist: options?.persist };
  const existing = await resolveSessionForWrite(sessionId, options?.clientToken);

  if (existing) {
    const fresh =
      (options?.clientToken
        ? await getAnalysisSessionForClient(existing.id, options.clientToken)
        : await getAnalysisSession(existing.id)) || existing;
    const list = [...(fresh.optimizations || []), optimization].slice(-10);
    const updated = await updateAnalysisSession(
      fresh.id,
      {
        optimizations: list,
        clientToken: options?.clientToken || fresh.clientToken,
      },
      {
        ...write,
        requireClientToken: options?.clientToken,
      },
    );
    if (updated) return updated;
  }

  return createAnalysisSession(
    {
      optimizations: [optimization],
      clientToken: options?.clientToken,
    },
    write,
  );
}

export function isSessionPersistenceEnabled(): boolean {
  return getSessionStore().kind === "supabase";
}

/** Pure helper for match pool: personal overlay first, then shared bank. */
export function mergeJobPools(
  personal: import("@/types/jobMatch").StoredJob[],
  shared: import("@/types/jobMatch").StoredJob[],
): import("@/types/jobMatch").StoredJob[] {
  const map = new Map<string, import("@/types/jobMatch").StoredJob>();
  for (const j of shared) map.set(j.id, j);
  for (const j of personal) map.set(j.id, j);
  // Prefer personal title+company overrides
  const byTitleCompany = new Map<string, import("@/types/jobMatch").StoredJob>();
  for (const j of map.values()) {
    const k = `${j.title.trim().toLowerCase()}::${j.company.trim().toLowerCase()}`;
    const prev = byTitleCompany.get(k);
    if (!prev || personal.some((p) => p.id === j.id)) {
      byTitleCompany.set(k, j);
    }
  }
  return [...byTitleCompany.values()];
}
