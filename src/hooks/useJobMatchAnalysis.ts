"use client";

import { useMemo, useState } from "react";
import { runMatchAgainstJobBankAction } from "@/app/apps/job-match/actions";
import { ActionErrorCode } from "@/lib/actionState";
import {
  JobBankStats,
  JobMatch,
  JobMatchInput,
  JobMatchResult,
  MatchPipelineMeta,
  ResumeProfile,
  RoleDirection,
} from "@/types/jobMatch";

type RunOptions = {
  input: JobMatchInput;
  validateResume: () => boolean;
  beginLoading: () => void;
  completeLoading: () => Promise<void>;
  onStats?: (stats: JobBankStats) => void;
  onJobListContent?: (content: string) => void;
  sessionId?: string;
  clientToken?: string;
  persistHistory?: boolean;
  directions?: RoleDirection[];
};

export function useJobMatchAnalysis() {
  const [result, setResult] = useState<JobMatchResult | null>(null);
  const [selectedRole, setSelectedRole] = useState<JobMatch | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisSource, setAnalysisSource] = useState<"ai" | "fallback" | null>(
    null,
  );
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [pipeline, setPipeline] = useState<MatchPipelineMeta | null>(null);
  const [profile, setProfile] = useState<ResumeProfile | null>(null);

  const sortedRoles = useMemo(
    () =>
      [...(result?.recommendedRoles || [])].sort(
        (a, b) => b.matchScore - a.matchScore,
      ),
    [result],
  );

  const activeRole = selectedRole || sortedRoles[0] || null;

  async function runJobBankMatch(options: RunOptions): Promise<{
    ok: boolean;
    error?: string;
    code?: ActionErrorCode;
    warning?: string;
    sessionId?: string;
  }> {
    if (isAnalyzing) return { ok: false, error: "分析进行中" };
    if (!options.validateResume()) {
      return {
        ok: false,
        error: "简历内容不足，无法完成分析。",
        code: "VALIDATION_ERROR",
      };
    }

    options.beginLoading();
    setIsAnalyzing(true);
    setResult(null);
    setSelectedRole(null);
    setAnalysisSource(null);
    setPipeline(null);
    setProfile(null);

    try {
      const response = await runMatchAgainstJobBankAction({
        fullName: options.input.fullName,
        currentStatus: options.input.currentStatus,
        experienceLevel: options.input.experienceLevel,
        preferredLanguage: options.input.preferredLanguage,
        preferredLocation: options.input.preferredLocation,
        resumeContent: options.input.resumeContent,
        directions: options.directions || [],
        regenerate: false,
        sessionId: options.sessionId || sessionId || undefined,
        clientToken: options.clientToken,
        persistHistory: options.persistHistory,
      });

      if (!response.ok) {
        return { ok: false, error: response.error, code: response.code };
      }

      await options.completeLoading();
      options.onJobListContent?.(response.data.jobListContent);
      options.onStats?.(response.data.stats);

      const matchResult: JobMatchResult = {
        candidateSummary: response.data.candidateSummary,
        recommendedRoles: response.data.recommendedRoles,
        profile: response.data.profile,
        aggregateGaps: response.data.aggregateGaps,
        pipeline: response.data.pipeline,
      };

      setResult(matchResult);
      setSelectedRole(response.data.recommendedRoles[0] || null);
      setAnalysisSource(response.source || "ai");
      setSessionId(response.data.sessionId);
      setPipeline(response.data.pipeline);
      setProfile(response.data.profile || null);
      return {
        ok: true,
        warning: response.warning,
        sessionId: response.data.sessionId,
      };
    } catch (error) {
      console.error("Job bank match request failed:", error);
      return {
        ok: false,
        error: "岗位匹配请求未完成，请刷新页面后重试。",
        code: "ACTION_REQUEST_FAILED",
      };
    } finally {
      setIsAnalyzing(false);
    }
  }

  function clearMatchResult() {
    setResult(null);
    setSelectedRole(null);
    setPipeline(null);
    setProfile(null);
  }

  return {
    result,
    setResult,
    selectedRole,
    setSelectedRole,
    sortedRoles,
    activeRole,
    isAnalyzing,
    analysisSource,
    setAnalysisSource,
    sessionId,
    setSessionId,
    pipeline,
    profile,
    runJobBankMatch,
    clearMatchResult,
  };
}
