"use client";

import { useState } from "react";
import { runResumeOptimizationAction } from "@/app/apps/job-match/actions";
import { ActionErrorCode } from "@/lib/actionState";
import {
  JobMatch,
  PreferredLanguage,
  ResumeOptimizationResult,
} from "@/types/jobMatch";

type RunOptions = {
  originalResume: string;
  preferredLanguage: PreferredLanguage;
  role: JobMatch;
  sessionId?: string | null;
  clientToken?: string;
  persistHistory?: boolean;
};

export function useResumeOptimization() {
  const [optimizationResult, setOptimizationResult] =
    useState<ResumeOptimizationResult | null>(null);
  const [isOptimizing, setIsOptimizing] = useState(false);

  async function submitResumeOptimization(options: RunOptions): Promise<{
    ok: boolean;
    error?: string;
    code?: ActionErrorCode;
    warning?: string;
    sessionId?: string;
  }> {
    if (!options.role || isOptimizing) {
      return { ok: false, error: "无法优化简历" };
    }

    setIsOptimizing(true);
    try {
      const response = await runResumeOptimizationAction({
        originalResume: options.originalResume,
        selectedRole: options.role,
        preferredLanguage: options.preferredLanguage,
        optionalJobDescription: options.role.sourceText || "",
        sessionId: options.sessionId || undefined,
        clientToken: options.clientToken,
        persistHistory: options.persistHistory,
      });
      if (!response.ok) {
        return { ok: false, error: response.error, code: response.code };
      }
      setOptimizationResult(response.data);
      return {
        ok: true,
        warning: response.warning,
        sessionId: response.data.sessionId,
      };
    } catch {
      return {
        ok: false,
        error: "简历优化失败，请稍后重试。",
        code: "AI_UNAVAILABLE",
      };
    } finally {
      setIsOptimizing(false);
    }
  }

  function clearOptimization() {
    setOptimizationResult(null);
  }

  return {
    optimizationResult,
    setOptimizationResult,
    isOptimizing,
    submitResumeOptimization,
    clearOptimization,
  };
}
