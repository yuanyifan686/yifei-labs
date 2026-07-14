"use client";

import { useEffect, useState, useTransition } from "react";
import { getMyAnalysisSessionAction } from "@/app/apps/job-match/actions";
import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import { HardLink } from "@/components/ui/HardLink";
import { getOrCreateClientToken } from "@/lib/session/clientIdentity";
import { formatDate, matchTone } from "@/lib/utils";
import { AnalysisSession } from "@/types/jobMatch";

export function HistorySessionDetailClient({ sessionId }: { sessionId: string }) {
  const [session, setSession] = useState<AnalysisSession | null>(null);
  const [error, setError] = useState("");
  const [showHashHint, setShowHashHint] = useState(false);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    startTransition(async () => {
      const token = getOrCreateClientToken();
      const response = await getMyAnalysisSessionAction(sessionId, token);
      if (!response.ok) {
        setError(response.error);
        setSession(null);
      } else {
        setError("");
        setSession(response.data.session);
      }
    });
  }, [sessionId]);

  if (isPending && !session && !error) {
    return (
      <div className="mx-auto max-w-6xl px-4 py-10 text-sm text-slate-400">
        加载会话…
      </div>
    );
  }

  if (error || !session) {
    return (
      <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
        <HardLink
          className="text-sm font-medium text-slate-300 hover:text-slate-50"
          href="/apps/job-match/history"
        >
          ← 返回历史
        </HardLink>
        <Card className="mt-6 border-red-400/20 bg-red-400/5 p-6 text-sm text-red-100">
          {error || "会话不存在"}
        </Card>
      </div>
    );
  }

  const topRoles = session.matchResult?.recommendedRoles?.slice(0, 5) || [];
  const gaps = session.gapResults || [];
  const plans = session.learningPlans || [];
  const opts = session.optimizations || [];

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
      <HardLink
        className="text-sm font-medium text-slate-300 hover:text-slate-50"
        href="/apps/job-match/history"
      >
        ← 返回历史
      </HardLink>

      <div className="mt-5">
        <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-400">
          Analysis Session
        </p>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight text-slate-50">
          {topRoles[0]?.title || gaps[0]?.targetRole || "职业分析会话"}
        </h1>
        <p className="mt-2 text-sm text-slate-400">
          更新 {formatDate(session.updatedAt)} · 来源 {session.source || "mixed"} · 存储{" "}
          {session.persistence || "unknown"}
        </p>
      </div>

      <div className="mt-8 grid gap-5 lg:grid-cols-[0.36fr_0.64fr]">
        <div className="space-y-4">
          <Card className="p-5">
            <h2 className="text-sm font-semibold text-slate-50">隐私与简历</h2>
            <p className="mt-2 text-xs leading-5 text-slate-400">
              完整原始简历默认不在历史中展示。会话保存结构化画像与分析结果摘要。
            </p>
            <dl className="mt-4 space-y-3 text-sm">
              <div>
                <dt className="text-xs text-slate-400">简历指纹</dt>
                <dd className="mt-1 font-mono text-xs text-slate-200">
                  {session.resumeTextHash || "（无）"}
                </dd>
              </div>
              <div>
                <dt className="text-xs text-slate-400">画像摘要</dt>
                <dd className="mt-1 text-slate-200">
                  {session.resumeProfile?.summaryLine || "暂无"}
                </dd>
              </div>
              <div>
                <dt className="text-xs text-slate-400">技能标签</dt>
                <dd className="mt-2 flex flex-wrap gap-1.5">
                  {(session.resumeProfile?.skillNames || []).slice(0, 12).map((s) => (
                    <Badge key={s}>{s}</Badge>
                  ))}
                  {(session.resumeProfile?.skillNames || []).length === 0 ? (
                    <span className="text-slate-400">暂无</span>
                  ) : null}
                </dd>
              </div>
            </dl>
            <button
              type="button"
              className="mt-4 text-xs text-cyan-200 underline-offset-2 hover:underline"
              onClick={() => setShowHashHint((v) => !v)}
            >
              {showHashHint ? "收起说明" : "为什么看不到完整简历？"}
            </button>
            {showHashHint ? (
              <p className="mt-2 text-xs leading-5 text-slate-400">
                为降低隐私风险，历史页不默认展开原文。分析时简历会发送给 AI
                服务；归档以 hash + 结构化结果为主。如需重新分析请回到工作台粘贴简历。
              </p>
            ) : null}
          </Card>

          {session.jobBankVersion ? (
            <Card className="p-5">
              <h2 className="text-sm font-semibold text-slate-50">岗位库版本</h2>
              <p className="mt-2 font-mono text-xs text-slate-300">
                {session.jobBankVersion}
              </p>
              <p className="mt-2 text-xs text-amber-200/90">
                合成市场样本，非实时在招岗位。
              </p>
            </Card>
          ) : null}
        </div>

        <div className="space-y-4">
          <Card className="p-5">
            <h2 className="text-sm font-semibold text-slate-50">岗位匹配</h2>
            {session.matchResult ? (
              <>
                <p className="mt-3 text-sm leading-7 text-slate-300">
                  {session.matchResult.candidateSummary}
                </p>
                <div className="mt-4 space-y-3">
                  {topRoles.map((role) => (
                    <div
                      className="rounded-lg border border-white/10 p-4"
                      key={`${role.title}-${role.jobId || ""}`}
                    >
                      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                          <h3 className="text-sm font-semibold text-slate-50">
                            {role.title}
                          </h3>
                          <p className="mt-1 text-xs text-slate-400">
                            {[role.company, role.location].filter(Boolean).join(" · ")}
                            {role.isSynthetic !== false ? " · 合成样本" : ""}
                          </p>
                        </div>
                        <Badge className={matchTone(role.matchScore)}>
                          {role.matchScore}%
                        </Badge>
                      </div>
                      <p className="mt-2 text-sm leading-6 text-slate-300">{role.reason}</p>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <p className="mt-3 text-sm text-slate-400">尚未完成岗位匹配。</p>
            )}
          </Card>

          <Card className="p-5">
            <h2 className="text-sm font-semibold text-slate-50">能力诊断</h2>
            {gaps.length === 0 ? (
              <p className="mt-3 text-sm text-slate-400">尚未完成能力诊断。</p>
            ) : (
              <div className="mt-4 space-y-3">
                {gaps.map((gap) => (
                  <div
                    className="rounded-lg border border-white/10 p-4"
                    key={gap.targetRole}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <h3 className="text-sm font-semibold text-slate-50">
                        {gap.targetRole}
                      </h3>
                      <Badge className={matchTone(gap.readinessScore)}>
                        准备度 {gap.readinessScore}%
                      </Badge>
                    </div>
                    <p className="mt-2 text-sm text-slate-300">{gap.summary}</p>
                    {gap.missingSkills?.length ? (
                      <div className="mt-3 flex flex-wrap gap-1.5">
                        {gap.missingSkills.slice(0, 8).map((s) => (
                          <Badge key={s}>{s}</Badge>
                        ))}
                      </div>
                    ) : null}
                  </div>
                ))}
              </div>
            )}
          </Card>

          <Card className="p-5">
            <h2 className="text-sm font-semibold text-slate-50">学习计划</h2>
            {plans.length === 0 ? (
              <p className="mt-3 text-sm text-slate-400">尚未生成学习计划。</p>
            ) : (
              <div className="mt-4 space-y-3">
                {plans.map((plan) => (
                  <div
                    className="rounded-lg border border-white/10 p-4"
                    key={plan.targetRole}
                  >
                    <h3 className="text-sm font-semibold text-slate-50">
                      {plan.targetRole}
                    </h3>
                    <p className="mt-2 text-sm text-slate-300">{plan.summary}</p>
                    <p className="mt-2 text-xs text-slate-400">
                      {plan.horizonDays} 天 · {plan.weeklyPlan?.length || 0} 周计划 ·{" "}
                      {plan.projectIdeas?.length || 0} 个项目选题
                    </p>
                  </div>
                ))}
              </div>
            )}
          </Card>

          {opts.length > 0 ? (
            <Card className="p-5">
              <h2 className="text-sm font-semibold text-slate-50">简历优化</h2>
              <p className="mt-3 text-sm text-slate-300">
                已保存 {opts.length} 次优化结果（最新 overall{" "}
                {opts[opts.length - 1]?.score?.overall ?? "—"}）。
              </p>
            </Card>
          ) : null}
        </div>
      </div>
    </div>
  );
}
