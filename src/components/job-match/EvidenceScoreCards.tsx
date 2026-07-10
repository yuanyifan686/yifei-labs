"use client";

import { useState } from "react";
import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import { scoreBar, scoreText } from "@/lib/scoreUtils";
import { cn } from "@/lib/utils";
import type { CandidateEvidenceScore } from "@/types/resume";

export function EvidenceScoreCards({
  scores,
}: {
  scores: CandidateEvidenceScore[];
}) {
  const [open, setOpen] = useState<string | null>(scores[0]?.category || null);

  if (!scores?.length) return null;

  return (
    <Card className="interactive-card overflow-hidden p-0" data-testid="evidence-score-cards">
      <div className="border-b border-white/10 bg-gradient-to-r from-cyan-500/10 via-transparent to-violet-500/5 px-5 py-4">
        <p className="pro-label">Evidence scores</p>
        <h2 className="mt-1 text-base font-semibold text-slate-50">证据评分卡</h2>
        <p className="mt-1 text-xs text-slate-400">
          每项分数都附带可核对证据；不因学校名气 / GPA / 姓名加减分。
        </p>
      </div>
      <div className="divide-y divide-white/10">
        {scores.map((item) => {
          const isOpen = open === item.category;
          const pct = Math.min(100, Math.round((item.score / (item.max || 100)) * 100));
          return (
            <div key={item.category} className="px-4 py-3 sm:px-5">
              <button
                type="button"
                className="flex w-full items-center justify-between gap-3 text-left"
                onClick={() => setOpen(isOpen ? null : item.category)}
              >
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-sm font-semibold text-slate-50">
                      {item.label}
                    </span>
                    <Badge className="text-[10px] text-slate-400">
                      {item.score}/{item.max || 100}
                    </Badge>
                  </div>
                  <div className="score-track mt-2 max-w-md">
                    <div
                      className={cn("score-fill", scoreBar(pct))}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
                <span
                  className={cn(
                    "shrink-0 text-lg font-semibold tabular-nums",
                    scoreText(pct),
                  )}
                >
                  {item.score}
                </span>
              </button>
              {isOpen ? (
                <div className="mt-3 space-y-2 text-xs leading-5 text-slate-300">
                  <div>
                    <p className="mb-1 font-semibold text-slate-200">证据</p>
                    <ul className="list-disc space-y-1 pl-4">
                      {(item.evidence || []).map((e) => (
                        <li key={e}>{e}</li>
                      ))}
                    </ul>
                  </div>
                  {item.risks?.length ? (
                    <div>
                      <p className="mb-1 font-semibold text-amber-200">风险提示</p>
                      <ul className="list-disc space-y-1 pl-4 text-amber-100/90">
                        {item.risks.map((r) => (
                          <li key={r}>{r}</li>
                        ))}
                      </ul>
                    </div>
                  ) : null}
                  {item.nextActions?.length ? (
                    <div>
                      <p className="mb-1 font-semibold text-cyan-200">补强动作</p>
                      <ul className="list-disc space-y-1 pl-4 text-cyan-100/90">
                        {item.nextActions.map((a) => (
                          <li key={a}>{a}</li>
                        ))}
                      </ul>
                    </div>
                  ) : null}
                </div>
              ) : null}
            </div>
          );
        })}
      </div>
    </Card>
  );
}

export function RiskFlagsPanel({ risks }: { risks: string[] }) {
  if (!risks?.length) return null;
  return (
    <Card className="interactive-card border-amber-400/20 bg-amber-400/[0.04] p-5">
      <p className="pro-label text-amber-200/80">Match risks</p>
      <h2 className="mt-1 text-base font-semibold text-amber-50">
        影响匹配的风险点
      </h2>
      <p className="mt-1 text-xs text-amber-100/70">
        不是淘汰判决，而是帮助你优先补证据的提示。
      </p>
      <ul className="mt-3 list-disc space-y-1.5 pl-4 text-sm leading-6 text-amber-50/90">
        {risks.map((r) => (
          <li key={r}>{r}</li>
        ))}
      </ul>
    </Card>
  );
}

export function NextActionsPanel({ actions }: { actions: string[] }) {
  if (!actions?.length) return null;
  return (
    <Card className="interactive-card border-cyan-400/20 bg-cyan-400/[0.04] p-5">
      <p className="pro-label text-cyan-200/80">Next actions</p>
      <h2 className="mt-1 text-base font-semibold text-slate-50">补强动作</h2>
      <ul className="mt-3 list-disc space-y-1.5 pl-4 text-sm leading-6 text-slate-300">
        {actions.map((a) => (
          <li key={a}>{a}</li>
        ))}
      </ul>
    </Card>
  );
}
