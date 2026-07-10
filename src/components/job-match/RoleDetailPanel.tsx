"use client";

import { DetailPanel } from "@/components/job-match/constants";
import { MatchEvidenceBlock } from "@/components/job-match/MatchEvidenceBlock";
import { ScoreDimensionsBar } from "@/components/job-match/ScoreDimensionsBar";
import { ListBlock } from "@/components/job-match/workspace/ListBlock";
import { AnimatedNumber } from "@/components/ui/AnimatedNumber";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { ScoreMeter } from "@/components/ui/ScoreMeter";
import { scoreText } from "@/lib/scoreUtils";
import { cn, matchLabel } from "@/lib/utils";
import {
  JobMatch,
  LearningPlanResult,
  ResumeDiffItem,
  ResumeOptimizationResult,
  ResumeProfile,
  SkillGapAnalysisResult,
} from "@/types/jobMatch";
import { useMemo, useState } from "react";

const PANELS: Array<[DetailPanel, string]> = [
  ["overview", "概览"],
  ["gap", "差距"],
  ["plan", "建议"],
  ["resume", "简历"],
];

export function RoleDetailPanel({
  role,
  activePanel,
  gapResult,
  optimizationResult,
  learningPlan,
  isGapAnalyzing,
  isOptimizing,
  isLearningPlan,
  profile,
  copied,
  onPanelChange,
  onGap,
  onOptimize,
  onGeneratePlan,
  onCopy,
}: {
  role: JobMatch;
  activePanel: DetailPanel;
  gapResult: SkillGapAnalysisResult | null;
  optimizationResult: ResumeOptimizationResult | null;
  learningPlan?: LearningPlanResult | null;
  isGapAnalyzing: boolean;
  isOptimizing: boolean;
  isLearningPlan?: boolean;
  profile?: ResumeProfile | null;
  copied: string;
  onPanelChange: (panel: DetailPanel) => void;
  onGap: () => void;
  onOptimize: () => void;
  onGeneratePlan?: () => void;
  onCopy: (label: string, text: string) => void;
}) {
  return (
    <Card className="interactive-card overflow-hidden">
      <div className="border-b border-white/10 bg-gradient-to-br from-white/[0.04] to-cyan-500/5 p-5">
        <p className="pro-label">Selected role</p>
        <h2 className="mt-1 text-base font-semibold text-slate-50">{role.title}</h2>
        <p className="mt-1 text-xs text-slate-400">
          {[role.company, role.location].filter(Boolean).join(" · ")}
        </p>
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <Badge className="border-white/10 bg-white/[0.04] text-slate-200">
            {matchLabel(role.matchScore)}
          </Badge>
          {role.isSynthetic !== false ? (
            <Badge className="border-amber-400/25 bg-amber-400/10 text-amber-200">
              合成样本
            </Badge>
          ) : (
            <Badge className="border-emerald-400/25 bg-emerald-400/10 text-emerald-200">
              真实/导入
            </Badge>
          )}
          <span
            className={cn(
              "ml-auto text-2xl font-semibold",
              scoreText(role.matchScore),
            )}
            data-value={role.matchScore}
          >
            <AnimatedNumber value={role.matchScore} />
          </span>
        </div>
        {role.scoreDimensions ? (
          <ScoreDimensionsBar dimensions={role.scoreDimensions} />
        ) : null}
      </div>
      <div className="grid grid-cols-4 border-b border-white/10 bg-white/[0.03] text-[11px] font-medium sm:text-xs">
        {PANELS.map(([key, label]) => (
          <button
            key={key}
            type="button"
            className={cn(
              "border-b-2 px-1 py-2.5 transition-colors duration-200",
              activePanel === key
                ? "border-cyan-400 bg-white/[0.04] text-slate-50"
                : "border-transparent text-slate-500 hover:text-slate-200",
            )}
            onClick={() => onPanelChange(key)}
          >
            {label}
          </button>
        ))}
      </div>
      <div className="mode-panel space-y-4 p-5" key={activePanel}>
        {activePanel === "overview" ? (
          <>
            <p className="text-sm leading-6 text-slate-300">{role.reason}</p>
            <MatchEvidenceBlock role={role} profile={profile} />
            <ListBlock title="优势" items={role.strengths} />
            <ListBlock title="缺口" items={role.gaps} />
            <Button variant="command" className="w-full" onClick={onGap} disabled={isGapAnalyzing}>
              {isGapAnalyzing ? <LoadingSpinner /> : null}
              诊断该岗位（主路径）
            </Button>
            <Button
              className="w-full"
              variant="secondary"
              onClick={onOptimize}
              disabled={isOptimizing}
            >
              {isOptimizing ? <LoadingSpinner /> : null}
              优化这份简历
            </Button>
          </>
        ) : null}
        {activePanel === "gap" ? (
          gapResult ? (
            <>
              <ScoreMeter title="准备度" value={gapResult.readinessScore} size="sm" showHint={false} />
              {gapResult.skillMatrix && gapResult.skillMatrix.length > 0 ? (
                <div>
                  <h3 className="mb-2 text-sm font-semibold text-slate-50">技能覆盖矩阵</h3>
                  <div className="space-y-1.5">
                    {gapResult.skillMatrix.slice(0, 8).map((cell) => (
                      <div
                        key={cell.skill}
                        className="flex items-center justify-between gap-2 rounded-md border border-white/10 px-2 py-1.5 text-[11px]"
                      >
                        <span className="font-medium text-slate-100">{cell.skill}</span>
                        <span className="flex gap-1 text-slate-400">
                          <span title="简历">{cell.inResume ? "✓简" : "·简"}</span>
                          <span title="JD">{cell.inTargetJd ? "✓JD" : "·JD"}</span>
                          <span title="市场">{cell.inMarket ? "✓市" : "·市"}</span>
                          <span
                            className={cn(
                              "rounded px-1 font-semibold",
                              cell.status === "covered" && "bg-emerald-400/10 text-emerald-300",
                              cell.status === "weak" && "bg-amber-400/10 text-amber-200",
                              cell.status === "missing" && "bg-red-400/10 text-red-200",
                            )}
                          >
                            {cell.status === "covered"
                              ? "覆盖"
                              : cell.status === "weak"
                                ? "弱"
                                : "缺"}
                          </span>
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              ) : null}
              <ListBlock title="缺失技能" items={gapResult.missingSkills} />
              <ListBlock title="学习优先级" items={gapResult.learningPriorities} />
              {onGeneratePlan ? (
                <Button
                  variant="command"
                  className="w-full"
                  onClick={onGeneratePlan}
                  disabled={isLearningPlan}
                >
                  {isLearningPlan ? <LoadingSpinner /> : null}
                  生成 30 天计划
                </Button>
              ) : null}
            </>
          ) : (
            <div className="space-y-3">
              <p className="text-sm text-slate-400">
                尚未诊断。主路径下一步：诊断该岗位准备度与缺口。
              </p>
              <Button variant="command" className="w-full" onClick={onGap} disabled={isGapAnalyzing}>
                {isGapAnalyzing ? <LoadingSpinner /> : null}
                诊断该岗位
              </Button>
            </div>
          )
        ) : null}
        {activePanel === "plan" ? (
          <>
            <ListBlock title="简历调整" items={role.resumeTips} />
            <ListBlock
              title="能力补强"
              items={
                gapResult?.resumeImprovements || ["优先补齐与目标岗位最相关的项目证据。"]
              }
            />
            {learningPlan ? (
              <p className="text-xs leading-5 text-slate-400">
                已生成「{learningPlan.targetRole}」{learningPlan.horizonDays}{" "}
                天计划。可继续优化简历或导出报告。
              </p>
            ) : onGeneratePlan && gapResult ? (
              <Button
                variant="command"
                className="w-full"
                onClick={onGeneratePlan}
                disabled={isLearningPlan}
              >
                {isLearningPlan ? <LoadingSpinner /> : null}
                生成 30 天计划
              </Button>
            ) : (
              <p className="text-xs text-slate-500">请先完成能力诊断，再生成计划。</p>
            )}
            <Button
              className="w-full"
              variant="secondary"
              onClick={onOptimize}
              disabled={isOptimizing}
            >
              {isOptimizing ? <LoadingSpinner /> : null}
              优化这份简历
            </Button>
          </>
        ) : null}
        {activePanel === "resume" ? (
          optimizationResult ? (
            <>
              <ScoreMeter
                title="综合评分"
                value={optimizationResult.score.overall}
                size="sm"
                showHint={false}
              />
              <ListBlock title="优化点" items={optimizationResult.keyImprovements} />
              {optimizationResult.diffs && optimizationResult.diffs.length > 0 ? (
                <ResumeDiffReview diffs={optimizationResult.diffs} />
              ) : null}
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-slate-50">优化文本</h3>
                <Button
                  className="h-8 px-3 text-xs"
                  variant="secondary"
                  onClick={() => onCopy("opt", optimizationResult.optimizedResume)}
                >
                  {copied === "opt" ? "已复制" : "复制"}
                </Button>
              </div>
              <pre className="max-h-[320px] overflow-auto whitespace-pre-wrap rounded-lg border border-white/10 bg-white/[0.04] p-3 text-xs leading-6 text-slate-200">
                {optimizationResult.optimizedResume}
              </pre>
            </>
          ) : (
            <Button className="w-full" onClick={onOptimize} disabled={isOptimizing}>
              {isOptimizing ? <LoadingSpinner /> : null}
              生成定向简历
            </Button>
          )
        ) : null}
      </div>
    </Card>
  );
}

function ResumeDiffReview({ diffs }: { diffs: ResumeDiffItem[] }) {
  const [status, setStatus] = useState<Record<number, "pending" | "accepted" | "rejected">>(
    {},
  );

  const acceptedText = useMemo(() => {
    return diffs
      .map((d, i) => (status[i] === "accepted" ? d.revised : null))
      .filter(Boolean)
      .join("\n\n");
  }, [diffs, status]);

  return (
    <div className="space-y-2">
      <h3 className="text-sm font-semibold text-slate-50">改写对照（可接受/拒绝）</h3>
      {diffs.slice(0, 8).map((diff, i) => {
        const st = status[i] || "pending";
        return (
          <div
            key={i}
            className={cn(
              "rounded-lg border p-2.5 text-[11px] leading-5",
              st === "accepted" && "border-emerald-400/30 bg-emerald-400/5",
              st === "rejected" && "border-white/10 bg-white/[0.02] opacity-60",
              st === "pending" && "border-white/10 bg-white/[0.04]",
            )}
          >
            <p className="text-slate-400">
              <span className="font-semibold text-slate-300">原：</span>
              {diff.original}
            </p>
            <p className="mt-1 text-emerald-300">
              <span className="font-semibold">改：</span>
              {diff.revised}
            </p>
            {diff.reason ? (
              <p className="mt-1 text-slate-500">原因：{diff.reason}</p>
            ) : null}
            <div className="mt-2 flex flex-wrap gap-2">
              <Button
                type="button"
                variant="secondary"
                className="h-7 px-2 text-[11px]"
                onClick={() => setStatus((s) => ({ ...s, [i]: "accepted" }))}
              >
                {st === "accepted" ? "已接受" : "接受"}
              </Button>
              <Button
                type="button"
                variant="ghost"
                className="h-7 px-2 text-[11px]"
                onClick={() => setStatus((s) => ({ ...s, [i]: "rejected" }))}
              >
                {st === "rejected" ? "已拒绝" : "拒绝"}
              </Button>
            </div>
          </div>
        );
      })}
      {acceptedText ? (
        <p className="text-[11px] text-slate-500">
          已接受 {Object.values(status).filter((s) => s === "accepted").length}{" "}
          条改写（本地决策，不会自动改原简历）。
        </p>
      ) : null}
    </div>
  );
}
