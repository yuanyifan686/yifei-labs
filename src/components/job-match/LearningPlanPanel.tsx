"use client";

import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { LearningPlanResult } from "@/types/jobMatch";

export function LearningPlanPanel({
  plan,
  loading,
  onGenerate,
  targetRole,
  hoursPerWeek = 10,
  onHoursPerWeekChange,
}: {
  plan: LearningPlanResult | null;
  loading: boolean;
  onGenerate: () => void;
  targetRole: string;
  hoursPerWeek?: number;
  onHoursPerWeekChange?: (hours: number) => void;
}) {
  if (loading) {
    return (
      <Card className="interactive-card p-8 text-center">
        <div className="mx-auto mb-4 orbit" />
        <p className="text-sm font-medium text-slate-100">
          正在生成 30 天学习与项目计划…
        </p>
        <p className="mt-1 text-xs text-slate-400">通常需要 15–25 秒</p>
      </Card>
    );
  }

  if (!plan) {
    return (
      <Card className="interactive-card border-dashed border-cyan-400/30 bg-gradient-to-br from-cyan-500/10 to-transparent p-5">
        <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-cyan-300">
          Next step
        </p>
        <h3 className="mt-1 text-base font-semibold text-slate-50">30 天学习路径</h3>
        <p className="mt-2 text-sm leading-6 text-slate-300">
          基于刚完成的差距诊断，为「{targetRole || "目标岗位"}」生成可执行周计划与作品项目建议。
        </p>
        {onHoursPerWeekChange ? (
          <label className="mt-4 block">
            <span className="mb-1.5 block text-xs font-medium text-slate-400">
              每周可投入小时
            </span>
            <Input
              type="number"
              min={3}
              max={40}
              value={hoursPerWeek}
              onChange={(e) => {
                const n = Number(e.target.value);
                onHoursPerWeekChange(
                  Number.isFinite(n) ? Math.min(40, Math.max(3, Math.round(n))) : 10,
                );
              }}
              className="max-w-[140px]"
            />
          </label>
        ) : null}
        <Button variant="command" className="mt-4" onClick={onGenerate}>
          生成 30 天计划与项目 →
        </Button>
      </Card>
    );
  }

  return (
    <div className="mode-panel space-y-4">
      <Card className="interactive-card p-5">
        <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-400">
          30-day plan
        </p>
        <h3 className="mt-1 text-lg font-semibold text-slate-50">
          {plan.targetRole} · {plan.horizonDays} 天计划
        </h3>
        <p className="mt-3 text-sm leading-7 text-slate-300">{plan.summary}</p>
      </Card>

      <Card className="p-5">
        <p className="pro-label">Timeline</p>
        <h4 className="mt-1 text-sm font-semibold text-slate-50">四周路径</h4>
        <div className="relative mt-5 space-y-0">
          <div className="absolute bottom-2 left-[15px] top-2 w-px bg-gradient-to-b from-cyan-400/50 via-violet-400/30 to-transparent" />
          {plan.weeklyPlan.map((week, i) => (
            <div
              key={week.week}
              className={`relative animate-fade-up flex gap-4 pb-6 last:pb-0 stagger-${Math.min(i + 1, 8)}`}
            >
              <div className="relative z-10 mt-0.5 grid h-8 w-8 shrink-0 place-items-center rounded-full border border-cyan-400/40 bg-[#0c1220] text-[11px] font-bold text-cyan-200 shadow-[0_0_12px_rgba(56,189,248,0.25)]">
                {week.week}
              </div>
              <div className="min-w-0 flex-1 rounded-xl border border-white/10 bg-white/[0.03] p-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <h5 className="text-sm font-semibold text-slate-50">
                    第 {week.week} 周 · {week.theme}
                  </h5>
                  <Badge className="border-cyan-400/25 bg-cyan-400/10 text-cyan-200">
                    Week {week.week}
                  </Badge>
                </div>
                <ul className="mt-2 list-disc space-y-1 pl-4 text-xs leading-5 text-slate-300">
                  {week.goals.map((g) => (
                    <li key={g}>{g}</li>
                  ))}
                </ul>
                {week.deliverables?.length ? (
                  <p className="mt-2 text-[11px] text-slate-500">
                    交付：{week.deliverables.join("、")}
                  </p>
                ) : null}
              </div>
            </div>
          ))}
        </div>
      </Card>

      {plan.projectIdeas?.length ? (
        <Card className="p-5">
          <p className="pro-label">Projects</p>
          <h4 className="mt-1 text-sm font-semibold text-slate-50">项目选题</h4>
          <div className="mt-3 space-y-3">
            {plan.projectIdeas.map((p) => (
              <div
                key={p.title}
                className="rounded-lg border border-white/10 bg-white/[0.03] p-3"
              >
                <div className="flex flex-wrap items-center gap-2">
                  <h5 className="text-sm font-semibold text-slate-50">{p.title}</h5>
                  <Badge>{p.difficulty}</Badge>
                  <Badge className="text-slate-400">{p.durationDays} 天</Badge>
                </div>
                <p className="mt-2 text-xs leading-5 text-slate-300">{p.description}</p>
              </div>
            ))}
          </div>
        </Card>
      ) : null}
    </div>
  );
}
