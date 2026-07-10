"use client";

import { MatchEvidenceBlock } from "@/components/job-match/MatchEvidenceBlock";
import { RoleDetailPanel } from "@/components/job-match/RoleDetailPanel";
import { ResultEmptyState } from "@/components/job-match/ResultEmptyState";
import { ScoreDimensionsBar } from "@/components/job-match/ScoreDimensionsBar";
import { SkillEvidenceMap } from "@/components/job-match/SkillEvidenceMap";
import { DetailPanel } from "@/components/job-match/constants";
import { AnimatedNumber } from "@/components/ui/AnimatedNumber";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { scoreBar, scoreText } from "@/lib/scoreUtils";
import { cn, matchLabel } from "@/lib/utils";
import {
  JobMatch,
  JobMatchResult,
  LearningPlanResult,
  MatchPipelineMeta,
  ResumeOptimizationResult,
  ResumeProfile,
  SkillGapAnalysisResult,
} from "@/types/jobMatch";
import { useMemo } from "react";

export function JobBankMatchView({
  isAnalyzing,
  result,
  sortedRoles,
  activeRole,
  activePanel,
  gapResult,
  optimizationResult,
  learningPlan,
  isGapAnalyzing,
  isOptimizing,
  isLearningPlan,
  copied,
  profile,
  pipeline,
  onSelectRole,
  onPanelChange,
  onGap,
  onOptimize,
  onGeneratePlan,
  onCopy,
  onStartAnalysis,
}: {
  isAnalyzing: boolean;
  result: JobMatchResult | null;
  sortedRoles: JobMatch[];
  activeRole: JobMatch | null;
  activePanel: DetailPanel;
  gapResult: SkillGapAnalysisResult | null;
  optimizationResult: ResumeOptimizationResult | null;
  learningPlan?: LearningPlanResult | null;
  isGapAnalyzing: boolean;
  isOptimizing: boolean;
  isLearningPlan?: boolean;
  copied: string;
  profile?: ResumeProfile | null;
  pipeline?: MatchPipelineMeta | null;
  onSelectRole: (role: JobMatch) => void;
  onPanelChange: (panel: DetailPanel) => void;
  onGap: () => void;
  onOptimize: () => void;
  onGeneratePlan?: () => void;
  onCopy: (label: string, text: string) => void;
  onStartAnalysis?: () => void;
}) {
  const top3 = sortedRoles.slice(0, 3);
  const aggregateGaps = useMemo(() => result?.aggregateGaps || [], [result]);
  const resolvedProfile = profile || result?.profile;
  const resolvedPipeline = pipeline || result?.pipeline;
  return (
    <>
      {result && !isAnalyzing ? (
        <Card className="animate-fade-up interactive-card overflow-hidden p-0">
          <div className="border-b border-white/10 bg-gradient-to-r from-cyan-500/10 via-transparent to-sky-500/5 px-5 py-4">
            <p className="pro-label">Decision HUD</p>
            <h2 className="mt-1 text-base font-semibold text-slate-50">匹配决策总览</h2>
            <p className="mt-1 text-xs text-slate-400">
              优先投什么 · 最大短板 · 下一步动作
            </p>
          </div>
          <div className="grid gap-0 divide-y divide-white/10 lg:grid-cols-3 lg:divide-x lg:divide-y-0">
            <div className="p-4">
              <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                推荐方向 Top 3
              </p>
              <ul className="mt-2 space-y-2">
                {top3.map((role, i) => (
                  <li key={`${role.title}-${i}`}>
                    <button
                      type="button"
                      className="flex w-full items-center justify-between gap-2 rounded-lg px-1 py-1 text-left hover:bg-white/[0.04]"
                      onClick={() => onSelectRole(role)}
                    >
                      <span className="min-w-0 truncate text-sm font-medium text-slate-100">
                        <span className="mr-1.5 tabular-nums text-cyan-400">
                          {String(i + 1).padStart(2, "0")}
                        </span>
                        {role.title}
                      </span>
                      <span
                        className={cn(
                          "shrink-0 text-sm font-semibold tabular-nums",
                          scoreText(role.matchScore),
                        )}
                      >
                        {role.matchScore}
                      </span>
                    </button>
                  </li>
                ))}
                {top3.length === 0 ? (
                  <li className="text-xs text-slate-500">暂无排序结果</li>
                ) : null}
              </ul>
            </div>
            <div className="p-4">
              <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                跨岗优先短板
              </p>
              <ul className="mt-2 space-y-1.5">
                {(aggregateGaps.length > 0
                  ? aggregateGaps
                  : ["完成匹配后将汇总高频缺口"]
                ).map((gap) => (
                  <li
                    key={gap}
                    className="rounded-md border border-amber-400/25 bg-amber-400/10 px-2 py-1.5 text-xs leading-5 text-amber-100"
                  >
                    {gap}
                  </li>
                ))}
              </ul>
            </div>
            <div className="p-4">
              <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                简历画像 / 流水线
              </p>
              <p className="mt-2 text-xs leading-5 text-slate-300">
                {resolvedProfile?.summaryLine || result.candidateSummary}
              </p>
              {resolvedPipeline ? (
                <p className="mt-2 text-[11px] text-slate-500">
                  语料 {resolvedPipeline.jobBankTotal} → 预筛{" "}
                  {resolvedPipeline.candidateCount} → 输出{" "}
                  {resolvedPipeline.rankedCount} · 技能标签{" "}
                  {resolvedPipeline.profileSkillCount}
                  {resolvedPipeline.directionFilterEnabled
                    ? ` · 方向过滤(${resolvedPipeline.directionFilterMode || "on"})：${(resolvedPipeline.directionTitles || []).slice(0, 3).join("、")}`
                    : " · 方向过滤：关"}
                </p>
              ) : null}
              {resolvedProfile?.skillNames?.length ? (
                <div className="mt-2 flex flex-wrap gap-1">
                  {resolvedProfile.skillNames.slice(0, 8).map((s) => (
                    <Badge
                      key={s}
                      className="border-cyan-400/25 bg-cyan-400/10 text-[10px] text-cyan-200"
                    >
                      {s}
                    </Badge>
                  ))}
                </div>
              ) : null}
              {activeRole ? (
                <button
                  type="button"
                  onClick={onGap}
                  disabled={isGapAnalyzing}
                  className="mt-3 w-full rounded-lg bg-gradient-to-r from-sky-500 to-violet-600 px-3 py-2 text-xs font-medium text-white transition hover:bg-slate-200 disabled:opacity-60"
                >
                  {isGapAnalyzing
                    ? "诊断中…"
                    : `对「${activeRole.title}」一键诊断`}
                </button>
              ) : null}
            </div>
          </div>
        </Card>
      ) : null}

      {result && !isAnalyzing && (activeRole || gapResult) ? (
        <SkillEvidenceMap
          role={activeRole}
          profile={resolvedProfile}
          gapResult={gapResult}
        />
      ) : null}

      {result?.candidateSummary ? (
        <Card className="animate-fade-up interactive-card p-5">
          <p className="pro-label">Profile summary</p>
          <h2 className="mt-1 text-base font-semibold text-slate-50">简历解读</h2>
          <p className="mt-3 text-sm leading-7 text-slate-300">
            {result.candidateSummary}
          </p>
        </Card>
      ) : null}

      {isAnalyzing ? (
        <div className="space-y-3">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className="overflow-hidden rounded-xl border border-white/10 bg-white/[0.04]"
              style={{ animationDelay: `${i * 0.08}s` }}
            >
              <div className="analyzing-shimmer h-24 w-full" />
            </div>
          ))}
        </div>
      ) : sortedRoles.length === 0 ? (
        <ResultEmptyState
          mode="job-bank"
          action={onStartAnalysis ? (
            <Button variant="command" onClick={onStartAnalysis}>
              开始岗位匹配
            </Button>
          ) : undefined}
        />
      ) : (
        <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_320px]">
          <Card className="animate-fade-up overflow-hidden">
            <div className="border-b border-white/10 bg-gradient-to-r from-white/[0.04] to-cyan-500/5 px-5 py-4">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="pro-label">Ranked matches</p>
                  <h2 className="mt-1 text-base font-semibold text-slate-50">
                    岗位匹配排序
                  </h2>
                </div>
                <Badge className="border-cyan-400/25 bg-cyan-400/10 text-cyan-200">
                  {sortedRoles.length} 条
                </Badge>
              </div>
            </div>
            <div className="divide-y divide-white/10">
              {sortedRoles.map((role, index) => {
                const active = activeRole?.title === role.title &&
                  activeRole?.company === role.company;
                return (
                  <button
                    key={`${role.jobId || role.title}-${index}`}
                    type="button"
                    onClick={() => onSelectRole(role)}
                    className={cn(
                      "interactive-row animate-fade-up w-full min-w-0 px-4 py-3.5 text-left sm:px-5 sm:py-4",
                      `stagger-${Math.min(index + 1, 8)}`,
                      active && "is-active",
                    )}
                  >
                    <div className="flex items-start justify-between gap-3 sm:gap-4">
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span
                            className={cn(
                              "grid h-6 w-6 place-items-center rounded-md text-[11px] font-bold tabular-nums",
                              active
                                ? "bg-cyan-500 text-white"
                                : "bg-white/10 text-slate-400",
                            )}
                          >
                            {String(index + 1).padStart(2, "0")}
                          </span>
                          <h3 className="text-sm font-semibold text-slate-50">
                            {role.title}
                          </h3>
                          {index === 0 ? (
                            <span className="rounded-full bg-emerald-400/10 px-2 py-0.5 text-[10px] font-semibold text-emerald-300">
                              TOP
                            </span>
                          ) : null}
                          {role.isSynthetic !== false ? (
                            <span className="rounded-full border border-white/10 bg-white/[0.04] px-2 py-0.5 text-[10px] font-medium text-slate-400">
                              合成样本
                            </span>
                          ) : null}
                        </div>
                        <p className="mt-1 text-xs text-slate-400">
                          {[role.company, role.location].filter(Boolean).join(" · ") ||
                            "市场样本岗位"}
                        </p>
                        <p className="mt-2 line-clamp-2 text-sm leading-6 text-slate-300">
                          {role.reason}
                        </p>
                        <div className="score-track mt-3 max-w-xs">
                          <div
                            className={cn("score-fill", scoreBar(role.matchScore))}
                            style={{ width: `${role.matchScore}%` }}
                          />
                        </div>
                        {role.scoreDimensions ? (
                          <ScoreDimensionsBar
                            dimensions={role.scoreDimensions}
                            compact
                          />
                        ) : null}
                        <MatchEvidenceBlock
                          role={role}
                          profile={resolvedProfile}
                          compact
                        />
                      </div>
                      <div className="shrink-0 text-right">
                        <div
                          className={cn(
                            "text-xl font-semibold tabular-nums",
                            scoreText(role.matchScore),
                          )}
                          data-value={role.matchScore}
                        >
                          <AnimatedNumber value={role.matchScore} />
                        </div>
                        <div className="text-[11px] font-medium text-slate-500">
                          {matchLabel(role.matchScore)}
                        </div>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </Card>

          {activeRole ? (
            <div className="animate-slide-in-right xl:sticky xl:top-36 xl:self-start">
              <RoleDetailPanel
                role={activeRole}
                activePanel={activePanel}
                gapResult={gapResult}
                optimizationResult={optimizationResult}
                learningPlan={learningPlan}
                isGapAnalyzing={isGapAnalyzing}
                isOptimizing={isOptimizing}
                isLearningPlan={isLearningPlan}
                profile={resolvedProfile}
                copied={copied}
                onPanelChange={onPanelChange}
                onGap={onGap}
                onOptimize={onOptimize}
                onGeneratePlan={onGeneratePlan}
                onCopy={onCopy}
              />
            </div>
          ) : null}
        </div>
      )}
    </>
  );
}
