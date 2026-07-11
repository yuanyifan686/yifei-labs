"use client";

import { ReportToolbar } from "@/components/job-match/ReportToolbar";
import { getAnalysisStages } from "@/hooks/useAnalysisProgress";
import { Card } from "@/components/ui/Card";
import { SourceStatusBadge } from "@/components/ui/SourceStatusBadge";
import type { AnalysisLoadSnapshot } from "@/lib/load/analysisLoadTracker";
import { ReportBundle } from "@/lib/reportExport";
import { cn } from "@/lib/utils";
import { AppMode } from "@/components/job-match/constants";

export function AnalysisStatusCard({
  mode,
  busy,
  hasJobBankResult,
  hasMarketFitResult,
  resumeReady = false,
  elapsedMs,
  stageIndex = 0,
  stages,
  analysisSource,
  reportBundle,
  reportDisabled,
  onExported,
  load,
}: {
  mode: AppMode;
  busy: boolean;
  hasJobBankResult: boolean;
  hasMarketFitResult: boolean;
  resumeReady?: boolean;
  elapsedMs: number;
  stageIndex?: number;
  stages?: readonly string[];
  analysisSource: "ai" | "fallback" | null;
  reportBundle: ReportBundle | null;
  reportDisabled: boolean;
  onExported?: () => void;
  /** Live concurrent load / queue snapshot */
  load?: AnalysisLoadSnapshot | null;
}) {
  const done = hasJobBankResult || hasMarketFitResult;
  const stageLabels = stages || getAnalysisStages(mode);

  return (
    <Card
      className={cn(
        "overflow-hidden p-5 transition-all duration-300",
        busy && "progress-live ring-1 ring-cyan-400/20",
      )}
    >
      <div className="flex flex-col gap-4 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between sm:gap-3">
        <div className="flex min-w-0 items-start gap-3">
          {busy ? (
            <div className="orbit mt-0.5 shrink-0" />
          ) : done ? (
            <div className="mt-0.5 grid h-11 w-11 shrink-0 place-items-center rounded-full border border-emerald-400/30 bg-emerald-400/10 text-emerald-300 sm:h-14 sm:w-14">
              <span className="text-base font-bold sm:text-lg">✓</span>
            </div>
          ) : (
            <div className="mt-0.5 grid h-11 w-11 shrink-0 place-items-center rounded-full border border-white/10 bg-white/[0.04] text-slate-500 sm:h-14 sm:w-14">
              <span className="text-[10px] font-semibold sm:text-xs">READY</span>
            </div>
          )}
          <div className="min-w-0">
            <p className="pro-label">Status</p>
            <h2 className="mt-1 text-base font-semibold text-slate-50">分析状态</h2>
            <p className="mt-1 text-sm leading-5 text-slate-400">
              {busy
                ? `流水线运行中 · 已用时 ${Math.floor(elapsedMs / 1000)}s · 通常 15–40 秒`
                : mode === "job-bank"
                  ? hasJobBankResult
                    ? "岗位匹配已完成，可导出报告"
                    : resumeReady
                      ? "简历已就绪，可以开始岗位匹配"
                      : "等待简历输入达到 100 字"
                  : hasMarketFitResult
                    ? "能力诊断已完成，可生成学习计划"
                    : resumeReady
                      ? "简历已就绪，可推荐方向或粘贴 JD 开始诊断"
                      : "等待简历输入达到 100 字"}
            </p>
            {busy ? (
              <div className="analysis-stage mt-3">
                {stageLabels.map((label, i) => {
                  const state =
                    i < stageIndex ? "is-done" : i === stageIndex ? "is-active" : "";
                  return (
                    <span key={label} className={cn("analysis-stage-item", state)}>
                      <span className={cn("analysis-stage-dot", i === stageIndex && "status-pulse")} />
                      {label}
                    </span>
                  );
                })}
              </div>
            ) : null}
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {analysisSource ? (
            <SourceStatusBadge
              status={analysisSource === "ai" ? "ai" : "fallback"}
              label={analysisSource === "ai" ? "AI 语义分析" : "规则回退"}
            />
          ) : (
            <SourceStatusBadge status="unconfigured" label="待分析" />
          )}
          {reportBundle ? (
            <ReportToolbar
              report={reportBundle}
              disabled={reportDisabled}
              onExported={onExported}
            />
          ) : null}
        </div>
      </div>

      {busy && load ? (
        <div
          className={cn(
            "mt-4 rounded-xl border px-3 py-3 text-sm",
            load.needsQueue
              ? "border-amber-400/25 bg-amber-400/[0.06]"
              : "border-cyan-400/20 bg-cyan-400/[0.05]",
          )}
          data-testid="analysis-load-panel"
        >
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="font-medium text-slate-100">
              {load.needsQueue ? "通道繁忙 · 可能需要排队" : "通道空闲 · 无需排队"}
            </p>
            <p className="tabular-nums text-xs text-slate-400">
              并行上限 {load.maxConcurrent}
            </p>
          </div>
          <div className="mt-2 flex flex-wrap gap-3 text-xs text-slate-300">
            <span>
              正在测评约{" "}
              <strong className="text-slate-50">{load.testingNow}</strong> 人
            </span>
            <span>
              处理中{" "}
              <strong className="text-slate-50">{load.active}</strong>
            </span>
            <span>
              排队{" "}
              <strong className="text-slate-50">{load.waiting}</strong>
            </span>
            {load.needsQueue && load.estimatedWaitSec > 0 ? (
              <span>
                预计等待约{" "}
                <strong className="text-amber-100">{load.estimatedWaitSec}s</strong>
              </span>
            ) : null}
          </div>
          <p className="mt-1.5 text-xs leading-5 text-slate-400">{load.statusLine}</p>
          <p className="mt-1 text-[10px] text-slate-500">{load.scopeNote}</p>
        </div>
      ) : null}

      {/* Idle hint when others are testing */}
      {!busy && load && load.testingNow > 0 ? (
        <p className="mt-3 text-xs text-slate-500">
          此刻约有 {load.testingNow} 人在测评
          {load.needsQueue
            ? ` · 通道较满（排队 ${load.waiting}），提交后可能需等待`
            : " · 通道空闲，可直接提交"}
        </p>
      ) : null}

      {busy ? <div className="mt-4 h-1.5 overflow-hidden rounded-full progress-live-bar" /> : null}
    </Card>
  );
}
