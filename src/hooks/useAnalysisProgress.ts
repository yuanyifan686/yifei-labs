"use client";

import { useEffect, useRef, useState } from "react";
import { ESTIMATED_MS } from "@/components/job-match/constants";
import type { AppMode } from "@/components/job-match/constants";

/** Stages aligned with real match pipeline: profile → retrieve → model → calibrate */
export const JOB_BANK_STAGES = [
  "解析简历画像",
  "岗位库预筛 TopK",
  "模型推理 / 精排",
  "结果校准",
] as const;

/** Stages aligned with market-fit: profile → market samples → gap reasoning → calibrate */
export const MARKET_FIT_STAGES = [
  "解析简历画像",
  "关联市场样本 / JD",
  "差距推理",
  "结果校准",
] as const;

/** @deprecated use getAnalysisStages(mode) */
export const ANALYSIS_STAGES = JOB_BANK_STAGES;

export function getAnalysisStages(mode: AppMode = "job-bank") {
  return mode === "market-fit" ? MARKET_FIT_STAGES : JOB_BANK_STAGES;
}

export function useAnalysisProgress(busy: boolean, mode: AppMode = "job-bank") {
  const [scanProgress, setScanProgress] = useState(0);
  const [elapsedMs, setElapsedMs] = useState(0);
  const [stageIndex, setStageIndex] = useState(0);
  const startedAt = useRef<number | null>(null);
  const stages = getAnalysisStages(mode);

  useEffect(() => {
    if (!busy) return;
    const timer = window.setInterval(() => {
      const started = startedAt.current || Date.now();
      const elapsed = Date.now() - started;
      setElapsedMs(elapsed);
      const ratio = Math.min(1, elapsed / ESTIMATED_MS);
      const eased = 1 - Math.pow(1 - ratio, 1.55);
      const progress = Math.min(92, Math.round(eased * 92));
      setScanProgress(progress);
      // Map progress bands to pipeline stages (still time-based; labels match real stages)
      if (progress < 22) setStageIndex(0);
      else if (progress < 48) setStageIndex(1);
      else if (progress < 78) setStageIndex(2);
      else setStageIndex(3);
    }, 120);
    return () => window.clearInterval(timer);
  }, [busy]);

  function beginLoading() {
    startedAt.current = Date.now();
    setScanProgress(6);
    setElapsedMs(0);
    setStageIndex(0);
  }

  async function completeLoading() {
    setStageIndex(stages.length - 1);
    setScanProgress(100);
    await new Promise((resolve) => window.setTimeout(resolve, 300));
  }

  return {
    scanProgress,
    elapsedMs,
    stageIndex,
    stages,
    beginLoading,
    completeLoading,
    setScanProgress,
  };
}
