"use client";

import { useRef } from "react";
import {
  EvidenceScoreCards,
  NextActionsPanel,
  RiskFlagsPanel,
} from "@/components/job-match/EvidenceScoreCards";
import { LearningPlanPanel } from "@/components/job-match/LearningPlanPanel";
import { ResultEmptyState } from "@/components/job-match/ResultEmptyState";
import { SkillEvidenceMap } from "@/components/job-match/SkillEvidenceMap";
import { ListCard } from "@/components/job-match/workspace/ListCard";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { ScoreMeter } from "@/components/ui/ScoreMeter";
import { SourceStatusBadge } from "@/components/ui/SourceStatusBadge";
import { GapResult } from "@/hooks/useMarketFitAnalysis";
import { LearningPlanResult } from "@/types/jobMatch";

export function MarketFitView({
  busy,
  gapResult,
  targetRole,
  learningPlan,
  isLearningPlan,
  needsDirectionFirst,
  isSuggestingDirections,
  showInlineAction = true,
  hoursPerWeek,
  onHoursPerWeekChange,
  onGeneratePlan,
  onStartDiagnosis,
}: {
  busy: boolean;
  gapResult: GapResult | null;
  targetRole: string;
  learningPlan: LearningPlanResult | null;
  isLearningPlan: boolean;
  needsDirectionFirst?: boolean;
  isSuggestingDirections?: boolean;
  showInlineAction?: boolean;
  hoursPerWeek?: number;
  onHoursPerWeekChange?: (hours: number) => void;
  onGeneratePlan: () => void;
  onStartDiagnosis?: () => void;
}) {
  const planRef = useRef<HTMLDivElement | null>(null);

  return (
    <>
      <MarketFitResultCard
        busy={busy}
        gapResult={gapResult}
        targetRole={targetRole}
        needsDirectionFirst={needsDirectionFirst}
        isSuggestingDirections={isSuggestingDirections}
        showInlineAction={showInlineAction}
        onStartDiagnosis={onStartDiagnosis}
      />
      {gapResult && !busy && gapResult.evidenceScores?.length ? (
        <EvidenceScoreCards scores={gapResult.evidenceScores} />
      ) : null}
      {gapResult && !busy && gapResult.riskFlags?.length ? (
        <RiskFlagsPanel risks={gapResult.riskFlags} />
      ) : null}
      {gapResult && !busy && gapResult.nextActions?.length ? (
        <NextActionsPanel actions={gapResult.nextActions} />
      ) : null}
      {gapResult && !busy ? <SkillEvidenceMap gapResult={gapResult} /> : null}
      {gapResult && !busy ? (
        <div ref={planRef}>
          <LearningPlanPanel
            plan={learningPlan}
            loading={isLearningPlan}
            targetRole={gapResult.targetRole}
            hoursPerWeek={hoursPerWeek}
            onHoursPerWeekChange={onHoursPerWeekChange}
            onGenerate={onGeneratePlan}
          />
        </div>
      ) : null}
    </>
  );
}

function MarketFitResultCard({
  busy,
  gapResult,
  targetRole,
  needsDirectionFirst,
  isSuggestingDirections,
  showInlineAction = true,
  onStartDiagnosis,
}: {
  busy: boolean;
  gapResult: GapResult | null;
  targetRole: string;
  needsDirectionFirst?: boolean;
  isSuggestingDirections?: boolean;
  showInlineAction?: boolean;
  onStartDiagnosis?: () => void;
}) {
  if (busy) {
    return (
      <Card className="mode-panel p-10 text-center">
        <div className="mx-auto mb-4 orbit" />
        <p className="text-sm font-medium text-slate-100">
          正在诊断{targetRole ? `「${targetRole}」` : "目标岗位"}
        </p>
        <p className="mt-1 text-xs text-slate-400">模型分析通常需要 15–30 秒</p>
      </Card>
    );
  }

  if (!gapResult) {
    return (
      <ResultEmptyState
        mode="market-fit"
        needsDirectionFirst={needsDirectionFirst}
        action={
          showInlineAction ? (
            <Button
              variant="command"
              disabled={isSuggestingDirections}
              onClick={onStartDiagnosis}
            >
              {needsDirectionFirst ? "先推荐可投方向" : "开始能力诊断"}
            </Button>
          ) : null
        }
      />
    );
  }

  const marketScore = gapResult.marketFitScore ?? gapResult.readinessScore;

  return (
    <div className="mode-panel space-y-4">
      <Card className="interactive-card p-5">
        <p className="pro-label">Diagnosis report</p>
        <div className="mt-1 flex flex-wrap items-center gap-2">
          <h2 className="text-xl font-semibold tracking-tight text-slate-50">
            {gapResult.targetRole}
          </h2>
          <SourceStatusBadge status="real_jd" label="真实 JD 优先" />
          {(gapResult.marketJobsUsed ?? 0) > 0 ? (
            <SourceStatusBadge
              status="synthetic"
              label={`+${gapResult.marketJobsUsed} 合成样本对照`}
            />
          ) : null}
        </div>
        <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-300">
          {gapResult.summary}
        </p>
        <div className="mt-5 grid gap-4 sm:grid-cols-2">
          <ScoreMeter title="准备度" value={gapResult.readinessScore} />
          <ScoreMeter title="市场匹配度" value={marketScore} />
        </div>
        {gapResult.proofSummary ? (
          <p className="mt-3 text-xs leading-5 text-slate-400">
            证明资产：{gapResult.proofSummary}
          </p>
        ) : null}
        <p className="mt-2 text-[11px] leading-5 text-slate-500">
          评分基于简历证据链，不因学校名气、GPA、姓名或性别加减分。
        </p>
      </Card>

      <div className="grid gap-4 lg:grid-cols-2">
        <ListCard title="已匹配优势" items={gapResult.matchedStrengths} />
        <ListCard title="缺失技能" items={gapResult.missingSkills} />
        <ListCard title="学习优先级" items={gapResult.learningPriorities} />
        <ListCard title="简历改进" items={gapResult.resumeImprovements} />
      </div>
    </div>
  );
}
