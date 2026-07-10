"use client";

import { useState } from "react";
import { runLearningPlanAction } from "@/app/apps/job-match/actions";
import { ActionErrorCode } from "@/lib/actionState";
import {
  LearningPlanResult,
  PreferredLanguage,
  SkillGapAnalysisResult,
} from "@/types/jobMatch";

type RunOptions = {
  resumeContent: string;
  preferredLanguage: PreferredLanguage;
  gapResult: SkillGapAnalysisResult;
  validateResume: () => boolean;
  sessionId?: string | null;
  clientToken?: string;
  persistHistory?: boolean;
  hoursPerWeek?: number;
};

export function useLearningPlan() {
  const [learningPlan, setLearningPlan] = useState<LearningPlanResult | null>(
    null,
  );
  const [isLearningPlan, setIsLearningPlan] = useState(false);

  async function generateLearningPlanFromGap(options: RunOptions): Promise<{
    ok: boolean;
    error?: string;
    code?: ActionErrorCode;
    warning?: string;
    sessionId?: string;
  }> {
    if (!options.gapResult || isLearningPlan) {
      return { ok: false, error: "无法生成学习计划" };
    }
    if (!options.validateResume()) {
      return {
        ok: false,
        error: "简历内容不足，无法完成分析。",
        code: "VALIDATION_ERROR",
      };
    }

    setIsLearningPlan(true);
    try {
      const response = await runLearningPlanAction({
        resumeContent: options.resumeContent,
        targetRole: options.gapResult.targetRole,
        preferredLanguage: options.preferredLanguage,
        readinessScore: options.gapResult.readinessScore,
        marketFitScore: options.gapResult.marketFitScore,
        matchedStrengths: options.gapResult.matchedStrengths,
        missingSkills: options.gapResult.missingSkills,
        learningPriorities: options.gapResult.learningPriorities,
        hoursPerWeek: options.hoursPerWeek ?? 10,
        sessionId: options.sessionId || undefined,
        clientToken: options.clientToken,
        persistHistory: options.persistHistory,
      });
      if (!response.ok) {
        return { ok: false, error: response.error, code: response.code };
      }
      setLearningPlan(response.data);
      return {
        ok: true,
        warning: response.warning,
        sessionId: response.data.sessionId,
      };
    } catch {
      return {
        ok: false,
        error: "学习计划生成失败，请稍后重试。",
        code: "AI_UNAVAILABLE",
      };
    } finally {
      setIsLearningPlan(false);
    }
  }

  function clearLearningPlan() {
    setLearningPlan(null);
  }

  return {
    learningPlan,
    setLearningPlan,
    isLearningPlan,
    generateLearningPlanFromGap,
    clearLearningPlan,
  };
}
