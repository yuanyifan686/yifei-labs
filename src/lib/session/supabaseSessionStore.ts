import { randomUUID } from "crypto";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { SessionStore } from "@/lib/session/sessionStore";
import { AnalysisSession, SessionPatch } from "@/types/jobMatch";

type SessionRow = {
  id: string;
  created_at: string;
  updated_at: string;
  client_token: string | null;
  source: string | null;
  resume_text_hash: string | null;
  resume_profile: AnalysisSession["resumeProfile"] | null;
  structured_resume: AnalysisSession["structuredResume"] | null;
  job_bank_version: string | null;
  match_result: AnalysisSession["matchResult"] | null;
  gap_results: AnalysisSession["gapResults"] | null;
  learning_plans: AnalysisSession["learningPlans"] | null;
  optimizations: AnalysisSession["optimizations"] | null;
};

function rowToSession(row: SessionRow): AnalysisSession {
  return {
    id: row.id,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    clientToken: row.client_token || undefined,
    resumeTextHash: row.resume_text_hash || undefined,
    resumeProfile: row.resume_profile || undefined,
    structuredResume: row.structured_resume || undefined,
    jobBankVersion: row.job_bank_version || undefined,
    matchResult: row.match_result || undefined,
    gapResults: row.gap_results || [],
    learningPlans: row.learning_plans || [],
    optimizations: row.optimizations || [],
    source: (row.source as AnalysisSession["source"]) || undefined,
    persistence: "supabase",
  };
}

function sessionToRow(session: AnalysisSession) {
  return {
    id: session.id,
    created_at: session.createdAt,
    updated_at: session.updatedAt,
    client_token: session.clientToken || null,
    source: session.source || null,
    resume_text_hash: session.resumeTextHash || null,
    resume_profile: session.resumeProfile || null,
    structured_resume: session.structuredResume || null,
    job_bank_version: session.jobBankVersion || null,
    match_result: session.matchResult || null,
    gap_results: session.gapResults || [],
    learning_plans: session.learningPlans || [],
    optimizations: session.optimizations || [],
  };
}

export const supabaseSessionStore: SessionStore = {
  kind: "supabase",

  async create(partial) {
    const supabase = getSupabaseAdmin();
    if (!supabase) {
      throw new Error("SUPABASE_UNAVAILABLE");
    }

    const now = new Date().toISOString();
    const session: AnalysisSession = {
      id: partial?.id || randomUUID(),
      createdAt: partial?.createdAt || now,
      updatedAt: now,
      clientToken: partial?.clientToken,
      resumeTextHash: partial?.resumeTextHash,
      resumeProfile: partial?.resumeProfile,
      structuredResume: partial?.structuredResume,
      jobBankVersion: partial?.jobBankVersion,
      matchResult: partial?.matchResult,
      gapResults: partial?.gapResults || [],
      learningPlans: partial?.learningPlans || [],
      optimizations: partial?.optimizations || [],
      source: partial?.source,
      persistence: "supabase",
    };

    const { data, error } = await supabase
      .from("analysis_sessions")
      .insert(sessionToRow(session))
      .select("*")
      .single();

    if (error) {
      console.error("[session] create failed:", error.message);
      throw new Error(`SESSION_CREATE_FAILED: ${error.message}`);
    }

    return rowToSession(data as SessionRow);
  },

  async get(id) {
    const supabase = getSupabaseAdmin();
    if (!supabase) return null;

    const { data, error } = await supabase
      .from("analysis_sessions")
      .select("*")
      .eq("id", id)
      .maybeSingle();

    if (error) {
      console.error("[session] get failed:", error.message);
      return null;
    }
    if (!data) return null;
    return rowToSession(data as SessionRow);
  },

  async getForClient(id, clientToken) {
    const supabase = getSupabaseAdmin();
    if (!supabase || !clientToken) return null;

    const { data, error } = await supabase
      .from("analysis_sessions")
      .select("*")
      .eq("id", id)
      .eq("client_token", clientToken)
      .maybeSingle();

    if (error) {
      console.error("[session] getForClient failed:", error.message);
      return null;
    }
    if (!data) return null;
    return rowToSession(data as SessionRow);
  },

  async update(id, patch: SessionPatch) {
    const supabase = getSupabaseAdmin();
    if (!supabase) return null;

    const current = await this.get(id);
    if (!current) return null;

    // Prevent clientToken hijack / reassignment
    if (
      current.clientToken &&
      patch.clientToken &&
      patch.clientToken !== current.clientToken
    ) {
      return null;
    }

    const next: AnalysisSession = {
      ...current,
      ...patch,
      id: current.id,
      createdAt: current.createdAt,
      clientToken: current.clientToken || patch.clientToken,
      updatedAt: new Date().toISOString(),
      persistence: "supabase",
    };

    const { data, error } = await supabase
      .from("analysis_sessions")
      .update(sessionToRow(next))
      .eq("id", id)
      .select("*")
      .single();

    if (error) {
      console.error("[session] update failed:", error.message);
      return null;
    }

    return rowToSession(data as SessionRow);
  },

  async listByClientToken(clientToken, limit = 50) {
    const supabase = getSupabaseAdmin();
    if (!supabase || !clientToken) return [];

    const { data, error } = await supabase
      .from("analysis_sessions")
      .select("*")
      .eq("client_token", clientToken)
      .order("updated_at", { ascending: false })
      .limit(limit);

    if (error) {
      console.error("[session] list failed:", error.message);
      return [];
    }

    return (data || []).map((row) => rowToSession(row as SessionRow));
  },

  async delete(id, clientToken) {
    const supabase = getSupabaseAdmin();
    if (!supabase || !clientToken) return false;

    const { error, count } = await supabase
      .from("analysis_sessions")
      .delete({ count: "exact" })
      .eq("id", id)
      .eq("client_token", clientToken);

    if (error) {
      console.error("[session] delete failed:", error.message);
      return false;
    }

    return (count ?? 0) > 0;
  },
};
