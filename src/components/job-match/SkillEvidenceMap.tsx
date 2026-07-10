"use client";

import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import { buildRoleEvidence } from "@/lib/matching/roleEvidence";
import { cn } from "@/lib/utils";
import {
  JobMatch,
  ResumeProfile,
  SkillCoverageCell,
  SkillGapAnalysisResult,
} from "@/types/jobMatch";
import { useMemo, useState } from "react";

type RingItem = {
  skill: string;
  ring: "required" | "bonus" | "gap";
  evidence?: string;
  hint?: string;
};

/**
 * Readable skill evidence map (replaces 3D star as primary decision UI).
 * Center = target role; rings = required / bonus / gap.
 */
export function SkillEvidenceMap({
  role,
  profile,
  gapResult,
}: {
  role?: JobMatch | null;
  profile?: ResumeProfile | null;
  gapResult?: SkillGapAnalysisResult | null;
}) {
  const [active, setActive] = useState<RingItem | null>(null);

  const items = useMemo(() => {
    const out: RingItem[] = [];
    if (gapResult?.skillMatrix?.length) {
      for (const cell of gapResult.skillMatrix.slice(0, 18)) {
        out.push(fromMatrixCell(cell));
      }
    } else if (role) {
      const ev = buildRoleEvidence(role, profile);
      for (const s of ev.matchedSkills.slice(0, 8)) {
        out.push({
          skill: s,
          ring: "required",
          evidence: profile?.skills.find(
            (x) => x.name.toLowerCase() === s.toLowerCase(),
          )?.evidence,
          hint: "简历与岗位均有证据",
        });
      }
      for (const s of (role.suggestedResumeKeywords || []).slice(0, 4)) {
        if (out.some((i) => i.skill === s)) continue;
        out.push({ skill: s, ring: "bonus", hint: "建议补充关键词" });
      }
      for (const s of ev.missingSkills.slice(0, 6)) {
        out.push({
          skill: s,
          ring: "gap",
          hint: "岗位要求，简历证据不足",
        });
      }
    }
    return out;
  }, [gapResult, role, profile]);

  const required = items.filter((i) => i.ring === "required");
  const bonus = items.filter((i) => i.ring === "bonus");
  const gap = items.filter((i) => i.ring === "gap");
  const hub = role?.title || gapResult?.targetRole || "目标岗位";

  if (items.length === 0) return null;

  const coverage =
    items.length === 0
      ? 0
      : Math.round((required.length / Math.max(items.length, 1)) * 100);

  return (
    <Card className="interactive-card overflow-hidden p-0" data-testid="skill-evidence-map">
      <div className="border-b border-white/10 bg-gradient-to-r from-cyan-500/10 via-transparent to-violet-500/5 px-5 py-4">
        <p className="pro-label">Skill evidence</p>
        <h2 className="mt-1 text-base font-semibold text-slate-50">岗位技能证据图</h2>
        <p className="mt-1 text-xs text-slate-400">
          中心岗位 · 内圈必备 · 外圈加分 · 缺口环 · 点击查看证据
        </p>
      </div>
      <div className="grid gap-0 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)]">
        <div className="space-y-4 p-5">
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-full border border-cyan-400/40 bg-cyan-400/15 px-3 py-1 text-sm font-semibold text-cyan-100">
              {hub}
            </span>
            <Badge className="border-white/10 text-slate-300">
              覆盖率约 {coverage}%
            </Badge>
          </div>
          <Ring
            title="必备 / 已覆盖"
            tone="required"
            items={required}
            active={active}
            onSelect={setActive}
          />
          <Ring
            title="加分技能"
            tone="bonus"
            items={bonus}
            active={active}
            onSelect={setActive}
          />
          <Ring
            title="缺口优先"
            tone="gap"
            items={gap}
            active={active}
            onSelect={setActive}
          />
        </div>
        <div className="border-t border-white/10 bg-white/[0.02] p-5 lg:border-l lg:border-t-0">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
            详情面板
          </p>
          {active ? (
            <div className="mt-3 space-y-2">
              <h3 className="text-sm font-semibold text-slate-50">{active.skill}</h3>
              <Badge
                className={cn(
                  active.ring === "required" &&
                    "border-emerald-400/30 bg-emerald-400/10 text-emerald-200",
                  active.ring === "bonus" &&
                    "border-cyan-400/30 bg-cyan-400/10 text-cyan-200",
                  active.ring === "gap" &&
                    "border-amber-400/30 bg-amber-400/10 text-amber-100",
                )}
              >
                {active.ring === "required"
                  ? "已覆盖"
                  : active.ring === "bonus"
                    ? "加分"
                    : "缺口"}
              </Badge>
              {active.evidence ? (
                <p className="rounded-lg border border-white/10 bg-black/20 p-3 text-xs leading-5 text-slate-300">
                  简历证据：{active.evidence}
                </p>
              ) : (
                <p className="text-xs text-slate-500">暂无定位到简历证据句。</p>
              )}
              {active.hint ? (
                <p className="text-xs leading-5 text-slate-400">建议：{active.hint}</p>
              ) : null}
            </div>
          ) : (
            <p className="mt-3 text-sm text-slate-400">
              点击左侧技能查看岗位要求、简历证据与补齐建议。
            </p>
          )}
          <div className="mt-6 space-y-1 text-[11px] text-slate-500">
            <p>必备命中 {required.length} · 加分 {bonus.length} · 缺口 {gap.length}</p>
            <p>优先补齐缺口环中的技能，再强化加分项。</p>
          </div>
        </div>
      </div>
    </Card>
  );
}

function fromMatrixCell(cell: SkillCoverageCell): RingItem {
  if (cell.status === "missing") {
    return {
      skill: cell.skill,
      ring: "gap",
      hint: "岗位/市场要求，简历未见证据",
    };
  }
  if (cell.status === "weak") {
    return {
      skill: cell.skill,
      ring: "bonus",
      hint: "有部分相关信号，建议补项目证据",
    };
  }
  return {
    skill: cell.skill,
    ring: "required",
    hint: "简历与目标要求对齐",
  };
}

function Ring({
  title,
  tone,
  items,
  active,
  onSelect,
}: {
  title: string;
  tone: RingItem["ring"];
  items: RingItem[];
  active: RingItem | null;
  onSelect: (item: RingItem) => void;
}) {
  if (items.length === 0) return null;
  return (
    <div>
      <p className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-slate-500">
        {title}
      </p>
      <div className="flex flex-wrap gap-1.5">
        {items.map((item) => {
          const selected = active?.skill === item.skill && active.ring === item.ring;
          return (
            <button
              key={`${item.ring}-${item.skill}`}
              type="button"
              onClick={() => onSelect(item)}
              className={cn(
                "rounded-full border px-2.5 py-1 text-[11px] transition",
                tone === "required" &&
                  "border-emerald-400/25 bg-emerald-400/10 text-emerald-100",
                tone === "bonus" &&
                  "border-cyan-400/25 bg-cyan-400/10 text-cyan-100",
                tone === "gap" &&
                  "border-amber-400/25 bg-amber-400/10 text-amber-100",
                selected && "ring-2 ring-white/30",
              )}
            >
              {item.skill}
            </button>
          );
        })}
      </div>
    </div>
  );
}
