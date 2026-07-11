"use client";

import { Field } from "@/components/job-match/workspace/Field";
import { AppMode } from "@/components/job-match/constants";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { MetricCard } from "@/components/ui/MetricCard";
import { Textarea } from "@/components/ui/Textarea";
import { cn } from "@/lib/utils";
import { JobBankStats, RoleDirection } from "@/types/jobMatch";

const QUICK_DIRECTIONS = [
  "AI Agent 开发工程师",
  "RAG / 知识库工程师",
  "大模型应用工程师",
  "全栈工程师（AI 产品）",
  "AI 产品经理",
  "数据工程师",
];

export function CorpusStatusCard({
  mode,
  jobBankStats,
  targetRole,
  optionalJd,
  selectedDirections,
  suggestedDirections,
  isSuggestingDirections,
  proofGithub,
  proofPortfolio,
  proofDemo,
  onTargetRoleChange,
  onOptionalJdChange,
  onToggleDirection,
  onClearDirections,
  onSuggestDirections,
  onProofGithubChange,
  onProofPortfolioChange,
  onProofDemoChange,
}: {
  mode: AppMode;
  jobBankStats: JobBankStats | null;
  targetRole: string;
  optionalJd: string;
  selectedDirections: string[];
  suggestedDirections: RoleDirection[];
  isSuggestingDirections?: boolean;
  proofGithub?: string;
  proofPortfolio?: string;
  proofDemo?: string;
  onTargetRoleChange: (value: string) => void;
  onOptionalJdChange: (value: string) => void;
  onToggleDirection: (title: string) => void;
  onClearDirections: () => void;
  onSuggestDirections: () => void;
  onProofGithubChange?: (value: string) => void;
  onProofPortfolioChange?: (value: string) => void;
  onProofDemoChange?: (value: string) => void;
}) {
  if (mode === "market-fit") {
    const hasRealJd = optionalJd.trim().length >= 40;
    const hasTargetRole = targetRole.trim().length > 0;
    return (
      <Card className="interactive-card mode-panel p-5">
        <p className="pro-label">Target JD</p>
        <h2 className="mt-1 text-base font-semibold text-slate-50">目标岗位诊断</h2>
        <p className="mt-2 text-xs leading-5 text-slate-400">
          把你的简历和一个具体岗位 JD 对照，判断现在能不能投、差哪些能力、简历该怎么改。
        </p>
        <div className="mt-3 rounded-lg border border-cyan-400/15 bg-cyan-400/[0.06] p-3 text-[11px] leading-5 text-slate-300">
          <p className="font-semibold text-cyan-100">粘贴真实 JD 后，诊断会优先看岗位原文。</p>
          <p className="mt-1 text-slate-400">
            岗位库只用来补充市场参考；不粘贴 JD 时，结果会更像方向评估，可信度较低。
          </p>
        </div>
        <div className="mt-4 space-y-3">
          <Field label="岗位名称（可选）">
            <Input
              value={targetRole}
              onChange={(e) => onTargetRoleChange(e.target.value)}
              placeholder="不知道投什么岗位时，可先用下方 AI 推荐方向"
            />
          </Field>
          <Field
            label={
              hasRealJd
                ? "岗位 JD *（已识别真实岗位描述）"
                : "岗位 JD（建议粘贴招聘页原文）"
            }
          >
            <Textarea
              className={cn(
                "min-h-[120px]",
                hasRealJd && "border-emerald-400/40 bg-emerald-400/5",
              )}
              value={optionalJd}
              onChange={(e) => onOptionalJdChange(e.target.value)}
              placeholder="粘贴招聘页里的岗位职责、任职要求、加分项等内容"
            />
          </Field>
          {hasRealJd ? (
            <Badge className="border-emerald-400/30 bg-emerald-400/10 text-emerald-200">
              已启用真实 JD 优先诊断
            </Badge>
          ) : (
            <p className="text-[11px] leading-5 text-amber-200/90">
              只填写岗位名称时，系统只能根据合成市场样本推断要求，建议补充真实 JD。
            </p>
          )}
          <p className="text-[11px] leading-5 text-slate-500">
            可用扩展「Yifei Labs JD 导入」从招聘站详情页一键带入（见
            extensions/jd-importer）。
          </p>

          {onProofGithubChange ? (
            <details className="rounded-lg border border-white/10 bg-white/[0.03] p-3">
              <summary className="cursor-pointer text-xs font-semibold text-slate-100">
                补充作品链接（可选）· 证明资产
              </summary>
              <p className="mt-2 text-[11px] leading-5 text-slate-500">
                用于证据评分中的「证明资产」：GitHub / Demo / 作品集。不做深度爬取，仅检测可访问性。
              </p>
              <div className="mt-3 space-y-2">
                <Field label="GitHub">
                  <Input
                    value={proofGithub || ""}
                    onChange={(e) => onProofGithubChange(e.target.value)}
                    placeholder="https://github.com/you"
                  />
                </Field>
                <Field label="作品集 / 主页">
                  <Input
                    value={proofPortfolio || ""}
                    onChange={(e) => onProofPortfolioChange?.(e.target.value)}
                    placeholder="https://..."
                  />
                </Field>
                <Field label="项目 Demo">
                  <Input
                    value={proofDemo || ""}
                    onChange={(e) => onProofDemoChange?.(e.target.value)}
                    placeholder="https://xxx.vercel.app"
                  />
                </Field>
              </div>
            </details>
          ) : null}

          <div className="rounded-lg border border-white/10 bg-white/[0.03] p-3">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-xs font-semibold text-slate-100">还不知道投什么岗位？</p>
                <p className="mt-1 text-[11px] leading-5 text-slate-500">
                  先让 AI 根据简历推荐 3 个可投方向，再选择其中一个继续诊断。
                </p>
              </div>
              <Button
                type="button"
                variant="secondary"
                className="h-8 shrink-0 px-3 text-[11px]"
                disabled={isSuggestingDirections}
                onClick={onSuggestDirections}
              >
                {isSuggestingDirections ? <LoadingSpinner /> : null}
                {suggestedDirections.length > 0 ? "重新推荐" : "推荐方向"}
              </Button>
            </div>
            {suggestedDirections.length > 0 ? (
              <div className="mt-3 flex flex-wrap gap-1.5">
                {suggestedDirections.slice(0, 4).map((direction) => {
                  const active = targetRole.trim() === direction.title;
                  return (
                    <button
                      key={direction.title}
                      type="button"
                      className={cn(
                        "rounded-full border px-2.5 py-1 text-[11px] transition",
                        active
                          ? "border-cyan-400/40 bg-cyan-400/15 text-cyan-100"
                          : "border-white/10 bg-white/[0.03] text-slate-400 hover:border-white/20 hover:text-slate-200",
                      )}
                      onClick={() => {
                        onTargetRoleChange(direction.title);
                        if (!selectedDirections.includes(direction.title)) {
                          onToggleDirection(direction.title);
                        }
                      }}
                    >
                      {direction.title}
                    </button>
                  );
                })}
              </div>
            ) : null}
            {!hasTargetRole && suggestedDirections.length > 0 ? (
              <p className="mt-2 text-[11px] leading-5 text-amber-200/90">
                请选择一个推荐方向，系统会把它作为本次诊断目标。
              </p>
            ) : null}
          </div>
        </div>
      </Card>
    );
  }

  const chipTitles = [
    ...QUICK_DIRECTIONS,
    ...suggestedDirections.map((d) => d.title),
  ].filter((t, i, arr) => arr.indexOf(t) === i);

  return (
    <Card className="interactive-card mode-panel overflow-hidden p-0">
      <details className="group" open={selectedDirections.length > 0 || suggestedDirections.length > 0}>
        <summary className="flex cursor-pointer list-none items-start justify-between gap-3 px-5 py-4">
          <div className="min-w-0">
            <p className="pro-label">Corpus</p>
            <h2 className="mt-1 text-base font-semibold text-slate-50">匹配语料与方向</h2>
            <div className="mt-2 flex flex-wrap items-center gap-1.5 text-xs leading-5 text-slate-400">
              <span>合成市场样本 · {jobBankStats?.total ?? 0} 条</span>
              {selectedDirections.length > 0 ? (
                <span className="rounded-full border border-cyan-400/25 bg-cyan-400/10 px-2 py-0.5 text-[11px] font-medium text-cyan-100">
                  已选 {selectedDirections.length} 个方向
                </span>
              ) : (
                <span>· 可选方向预筛</span>
              )}
            </div>
            {selectedDirections.length > 0 ? (
              <p className="mt-1 truncate text-[11px] text-slate-500">
                {selectedDirections.slice(0, 2).join("、")}
                {selectedDirections.length > 2 ? ` 等 ${selectedDirections.length} 个` : ""}
              </p>
            ) : null}
          </div>
          <span className="mt-1 shrink-0 text-xs text-slate-500 transition group-open:rotate-180">
            ▾
          </span>
        </summary>

        <div className="border-t border-white/10 px-5 pb-5 pt-4">
          <p className="text-xs leading-5 text-slate-400">
            合成市场样本，非实时在招。可先选定方向再匹配，减少噪声。
          </p>
          <div className="mt-4 grid grid-cols-2 gap-3">
            <MetricCard label="样本数" value={jobBankStats?.total ?? 0} animated />
            <MetricCard
              label="数据类型"
              value={<span className="text-sm font-semibold">合成样本</span>}
              className="from-cyan-500/10"
            />
          </div>

          <div className="mt-4">
        <div className="flex items-center justify-between gap-2">
          <p className="text-xs font-semibold text-slate-200">目标方向预筛</p>
          <div className="flex gap-2">
            {selectedDirections.length > 0 ? (
              <button
                type="button"
                className="text-[11px] text-slate-400 hover:text-slate-200"
                onClick={onClearDirections}
              >
                清空
              </button>
            ) : null}
            <Button
              type="button"
              variant="ghost"
              className="h-7 px-2 text-[11px]"
              disabled={isSuggestingDirections}
              onClick={onSuggestDirections}
            >
              {isSuggestingDirections ? <LoadingSpinner /> : null}
              AI 推荐方向
            </Button>
          </div>
        </div>
        <div className="mt-2 flex flex-wrap gap-1.5">
          {chipTitles.map((title) => {
            const active = selectedDirections.includes(title);
            return (
              <button
                key={title}
                type="button"
                onClick={() => onToggleDirection(title)}
                className={cn(
                  "rounded-full border px-2.5 py-1 text-[11px] transition",
                  active
                    ? "border-cyan-400/40 bg-cyan-400/15 text-cyan-100"
                    : "border-white/10 bg-white/[0.03] text-slate-400 hover:border-white/20 hover:text-slate-200",
                )}
              >
                {title}
              </button>
            );
          })}
        </div>
        <p className="mt-2 text-[11px] leading-5 text-slate-500">
          {selectedDirections.length > 0
            ? `已选 ${selectedDirections.length} 个方向，匹配时优先在相关岗位中排序。`
            : "不选则用简历画像方向弱过滤；仍可全库 TopK。"}
        </p>
          </div>
      </div>
      </details>
    </Card>
  );
}
