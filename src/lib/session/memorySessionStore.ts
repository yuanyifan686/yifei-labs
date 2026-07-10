import { randomUUID } from "crypto";
import { AnalysisSession, SessionPatch } from "@/types/jobMatch";
import { SessionStore } from "@/lib/session/sessionStore";

const memorySessions = new Map<string, AnalysisSession>();

function stamp(
  partial?: Partial<AnalysisSession>,
  existing?: AnalysisSession,
): AnalysisSession {
  const now = new Date().toISOString();
  return {
    id: partial?.id || existing?.id || randomUUID(),
    createdAt: partial?.createdAt || existing?.createdAt || now,
    updatedAt: now,
    clientToken: partial?.clientToken ?? existing?.clientToken,
    resumeTextHash: partial?.resumeTextHash ?? existing?.resumeTextHash,
    resumeProfile: partial?.resumeProfile ?? existing?.resumeProfile,
    structuredResume: partial?.structuredResume ?? existing?.structuredResume,
    jobBankVersion: partial?.jobBankVersion ?? existing?.jobBankVersion,
    matchResult: partial?.matchResult ?? existing?.matchResult,
    gapResults: partial?.gapResults ?? existing?.gapResults ?? [],
    learningPlans: partial?.learningPlans ?? existing?.learningPlans ?? [],
    optimizations: partial?.optimizations ?? existing?.optimizations ?? [],
    source: partial?.source ?? existing?.source,
    persistence: "memory",
  };
}

export const memorySessionStore: SessionStore = {
  kind: "memory",

  async create(partial) {
    const session = stamp(partial);
    memorySessions.set(session.id, session);
    return session;
  },

  async get(id) {
    const s = memorySessions.get(id);
    return s ? { ...s, persistence: "memory" } : null;
  },

  async getForClient(id, clientToken) {
    const s = await this.get(id);
    if (!s) return null;
    if (!clientToken || s.clientToken !== clientToken) return null;
    return s;
  },

  async update(id, patch: SessionPatch) {
    const current = memorySessions.get(id);
    if (!current) return null;
    // Prevent clientToken hijack: cannot reassign ownership
    if (
      current.clientToken &&
      patch.clientToken &&
      patch.clientToken !== current.clientToken
    ) {
      return null;
    }
    const next = stamp(
      {
        ...current,
        ...patch,
        id: current.id,
        // Freeze ownership once set
        clientToken: current.clientToken || patch.clientToken,
      },
      current,
    );
    memorySessions.set(id, next);
    return next;
  },

  async listByClientToken(clientToken, limit = 50) {
    if (!clientToken) return [];
    return [...memorySessions.values()]
      .filter((s) => s.clientToken === clientToken)
      .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
      .slice(0, limit)
      .map((s) => ({ ...s, persistence: "memory" as const }));
  },

  async delete(id, clientToken) {
    const current = memorySessions.get(id);
    if (!current || current.clientToken !== clientToken) return false;
    return memorySessions.delete(id);
  },
};
