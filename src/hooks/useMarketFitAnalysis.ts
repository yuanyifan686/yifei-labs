"use client";

import { useState } from "react";
import { runSkillGapAnalysisAction } from "@/app/apps/job-match/actions";
import { ActionErrorCode } from "@/lib/actionState";
import { JobMatchInput, PreferredLanguage, SkillGapAnalysisResult } from "@/types/jobMatch";
import type { ProofLinkInput } from "@/types/resume";

export type GapResult = SkillGapAnalysisResult & { marketJobsUsed?: number };

type RunOptions = {
  resumeContent: string;
  preferredLanguage: PreferredLanguage;
  targetRole: string;
  optionalJd?: string;
  proofLinks?: ProofLinkInput;
  validateResume: () => boolean;
  beginLoading: () => void;
  completeLoading: () => Promise<void>;
  onFieldError?: (message: string) => void;
  sessionId?: string | null;
  clientToken?: string;
  persistHistory?: boolean;
  /** When true, keep previous gapResult until new one arrives (inline diagnose). */
  keepPrevious?: boolean;
};

export function useMarketFitAnalysis() {
  const [gapResult, setGapResult] = useState<GapResult | null>(null);
  const [isGapAnalyzing, setIsGapAnalyzing] = useState(false);
  const [analysisSource, setAnalysisSource] = useState<"ai" | "fallback" | null>(
    null,
  );
  const [sessionId, setSessionId] = useState<string | null>(null);

  async function runMarketFit(options: RunOptions): Promise<{
    ok: boolean;
    error?: string;
    code?: ActionErrorCode;
    warning?: string;
    sessionId?: string;
    readinessScore?: number;
  }> {
    if (isGapAnalyzing) return { ok: false, error: "分析进行中" };
    if (!options.validateResume()) {
      return {
        ok: false,
        error: "简历内容不足，无法完成分析。",
        code: "VALIDATION_ERROR",
      };
    }
    if (!options.targetRole.trim()) {
      options.onFieldError?.("请填写目标岗位、粘贴真实 JD，或先使用 AI 推荐方向。");
      return {
        ok: false,
        error: "缺少诊断目标，无法进行能力诊断。",
        code: "VALIDATION_ERROR",
      };
    }

    options.beginLoading();
    setIsGapAnalyzing(true);
    if (!options.keepPrevious) {
      setGapResult(null);
    }
    setAnalysisSource(null);

    try {
      const response = await runSkillGapAnalysisAction({
        resumeContent: options.resumeContent,
        targetRole: options.targetRole.trim(),
        targetJobDescription: options.optionalJd?.trim() || undefined,
        preferredLanguage: options.preferredLanguage,
        proofLinks: options.proofLinks,
        sessionId: options.sessionId || sessionId || undefined,
        clientToken: options.clientToken,
        persistHistory: options.persistHistory,
      });

      if (!response.ok) {
        return { ok: false, error: response.error, code: response.code };
      }

      await options.completeLoading();
      setGapResult(response.data);
      setAnalysisSource(response.source || "ai");
      if (response.data.sessionId) setSessionId(response.data.sessionId);
      return {
        ok: true,
        warning: response.warning,
        sessionId: response.data.sessionId,
        readinessScore: response.data.readinessScore,
      };
    } catch (error) {
      console.error("Market fit request failed:", error);
      return {
        ok: false,
        error: "市场匹配度分析请求未完成，请刷新页面后重试。",
        code: "ACTION_REQUEST_FAILED",
      };
    } finally {
      setIsGapAnalyzing(false);
    }
  }

  function clearGapResult() {
    setGapResult(null);
  }

  return {
    gapResult,
    setGapResult,
    isGapAnalyzing,
    analysisSource,
    setAnalysisSource,
    sessionId,
    setSessionId,
    runMarketFit,
    clearGapResult,
  };
}

export type MarketFitInputSlice = Pick<
  JobMatchInput,
  "resumeContent" | "preferredLanguage"
>;
