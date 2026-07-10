"use client";

import { useMemo, useState } from "react";
import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import {
  SkillNodeStatus,
  SkillStarGraphModel,
  SkillStarNode,
} from "@/lib/three/skillStarModel";
import { cn } from "@/lib/utils";

const STATUS_META: Record<
  SkillNodeStatus,
  {
    label: string;
    dot: string;
    chip: string;
    row: string;
    hint: string;
    order: number;
  }
> = {
  hub: {
    label: "目标岗位",
    dot: "bg-cyan-400",
    chip: "border-cyan-400/30 bg-cyan-400/10 text-cyan-200",
    row: "border-cyan-400/25 bg-cyan-400/8",
    hint: "当前选中的岗位方向。",
    order: 5,
  },
  missing: {
    label: "缺口",
    dot: "bg-red-400",
    chip: "border-red-400/35 bg-red-400/10 text-red-200",
    row: "border-red-400/25 bg-red-400/8",
    hint: "岗位需要，但简历证据不足，建议优先补齐。",
    order: 1,
  },
  weak: {
    label: "弱关联",
    dot: "bg-amber-300",
    chip: "border-amber-400/35 bg-amber-400/10 text-amber-100",
    row: "border-amber-400/25 bg-amber-400/8",
    hint: "简历里有相关能力，但和岗位要求的连接不够强。",
    order: 2,
  },
  covered: {
    label: "已覆盖",
    dot: "bg-emerald-400",
    chip: "border-emerald-400/35 bg-emerald-400/10 text-emerald-200",
    row: "border-emerald-400/25 bg-emerald-400/8",
    hint: "简历已有较明确证据，可作为岗位匹配卖点。",
    order: 3,
  },
  dimension: {
    label: "评分维度",
    dot: "bg-violet-400",
    chip: "border-violet-400/35 bg-violet-400/10 text-violet-200",
    row: "border-violet-400/25 bg-violet-400/8",
    hint: "岗位匹配评分维度，用来辅助判断整体适配度。",
    order: 4,
  },
};

function getNodeScore(node: SkillStarNode) {
  return Math.max(0, Math.min(100, node.score ?? 0));
}

function statusCount(nodes: SkillStarNode[], status: SkillNodeStatus) {
  return nodes.filter((node) => node.status === status).length;
}

function sortSkillNodes(a: SkillStarNode, b: SkillStarNode) {
  const order = STATUS_META[a.status].order - STATUS_META[b.status].order;
  if (order !== 0) return order;
  return getNodeScore(b) - getNodeScore(a);
}

function EvidencePill({
  active,
  label,
}: {
  active?: boolean;
  label: string;
}) {
  return (
    <span
      className={cn(
        "rounded-md border px-1.5 py-0.5 text-[10px] font-medium",
        active
          ? "border-emerald-400/30 bg-emerald-400/10 text-emerald-200"
          : "border-white/10 bg-white/[0.03] text-[var(--yl-text-muted)]",
      )}
    >
      {label}
      <span className="ml-1">{active ? "有" : "无"}</span>
    </span>
  );
}

export function SkillStarGraph({
  model,
  onNodeActivate,
  className,
}: {
  model: SkillStarGraphModel | null;
  height?: number;
  onNodeActivate?: (node: SkillStarNode) => void;
  className?: string;
}) {
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const view = useMemo(() => {
    if (!model) return null;
    const hub = model.nodes.find((node) => node.status === "hub") || null;
    const dimensions = model.nodes.filter((node) => node.status === "dimension");
    const skills = model.nodes
      .filter((node) => node.status !== "hub" && node.status !== "dimension")
      .sort(sortSkillNodes);
    const preferred =
      skills.find((node) => node.status === "missing") ||
      skills.find((node) => node.status === "weak") ||
      skills[0] ||
      hub;
    const selected =
      model.nodes.find((node) => node.id === selectedId) || preferred || null;
    return { hub, dimensions, skills, selected };
  }, [model, selectedId]);

  if (!model || !view) return null;

  const { hub, dimensions, skills, selected } = view;
  const missing = statusCount(skills, "missing");
  const weak = statusCount(skills, "weak");
  const covered = statusCount(skills, "covered");

  function selectNode(node: SkillStarNode) {
    setSelectedId(node.id);
    onNodeActivate?.(node);
  }

  return (
    <Card
      className={cn(
        "skill-star-panel animate-fade-up overflow-hidden p-0",
        className,
      )}
    >
      <div className="border-b border-[var(--yl-border)] px-5 py-4">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <p className="pro-label">Skill map</p>
            <h3 className="mt-1 text-base font-semibold text-[var(--yl-text)]">
              岗位技能需求图
            </h3>
            <p className="mt-1 text-xs leading-5 text-[var(--yl-text-muted)]">
              {model.subtitle || "按岗位要求拆解技能，区分已覆盖、弱关联和缺口。"}
            </p>
          </div>
          <div className="grid grid-cols-3 gap-2 text-center sm:flex sm:text-left">
            <SummaryBadge label="缺口" value={missing} tone="missing" />
            <SummaryBadge label="弱关联" value={weak} tone="weak" />
            <SummaryBadge label="已覆盖" value={covered} tone="covered" />
          </div>
        </div>

        {hub ? (
          <div className="mt-4 rounded-xl border border-cyan-400/20 bg-cyan-400/8 px-3 py-3">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <div className="min-w-0">
                <p className="text-[11px] font-semibold uppercase tracking-wide text-cyan-300">
                  Target role
                </p>
                <p className="mt-1 truncate text-sm font-semibold text-[var(--yl-text)]">
                  {hub.label}
                </p>
              </div>
              {hub.score != null ? (
                <div className="shrink-0 text-sm font-semibold tabular-nums text-cyan-200">
                  匹配度 {hub.score}%
                </div>
              ) : null}
            </div>
          </div>
        ) : null}
      </div>

      <div className="grid gap-0 lg:grid-cols-[minmax(0,1fr)_300px]">
        <div className="border-b border-[var(--yl-border)] p-4 lg:border-b-0 lg:border-r">
          {dimensions.length > 0 ? (
            <div className="mb-4 grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
              {dimensions.map((node) => (
                <button
                  key={node.id}
                  type="button"
                  className={cn(
                    "rounded-xl border border-violet-400/20 bg-violet-400/8 px-3 py-2 text-left transition hover:border-violet-400/40",
                    selected?.id === node.id && "ring-2 ring-violet-400/30",
                  )}
                  onClick={() => selectNode(node)}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="truncate text-xs font-medium text-[var(--yl-text-muted)]">
                      {node.label}
                    </span>
                    <span className="text-sm font-semibold tabular-nums text-violet-200">
                      {node.score ?? "-"}
                    </span>
                  </div>
                  <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-white/10">
                    <div
                      className="h-full rounded-full bg-violet-400"
                      style={{ width: `${getNodeScore(node)}%` }}
                    />
                  </div>
                </button>
              ))}
            </div>
          ) : null}

          <div className="space-y-2">
            {skills.map((node) => {
              const meta = STATUS_META[node.status];
              const active = selected?.id === node.id;
              return (
                <button
                  key={node.id}
                  type="button"
                  className={cn(
                    "w-full rounded-xl border px-3 py-3 text-left transition hover:border-cyan-400/30 hover:bg-white/[0.04]",
                    meta.row,
                    active && "ring-2 ring-cyan-400/30",
                  )}
                  onClick={() => selectNode(node)}
                >
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className={cn("h-2 w-2 rounded-full", meta.dot)} />
                        <span className="font-semibold text-[var(--yl-text)]">
                          {node.label}
                        </span>
                        <Badge className={meta.chip}>{meta.label}</Badge>
                      </div>
                      {node.evidence ? (
                        <p className="mt-1 line-clamp-2 text-xs leading-5 text-[var(--yl-text-muted)]">
                          {node.evidence}
                        </p>
                      ) : null}
                    </div>
                    <div className="w-full shrink-0 sm:w-28">
                      <div className="flex items-center justify-between text-[11px] text-[var(--yl-text-muted)]">
                        <span>强度</span>
                        <span className="tabular-nums">{node.score ?? "-"}</span>
                      </div>
                      <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-white/10">
                        <div
                          className={cn("h-full rounded-full", meta.dot)}
                          style={{ width: `${getNodeScore(node)}%` }}
                        />
                      </div>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        <aside className="skill-star-detail p-4">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-[var(--yl-text-muted)]">
            Detail
          </p>
          {selected ? (
            <div className="mt-3 space-y-3">
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <h4 className="text-base font-semibold text-[var(--yl-text)]">
                    {selected.label}
                  </h4>
                  <Badge className={STATUS_META[selected.status].chip}>
                    {STATUS_META[selected.status].label}
                  </Badge>
                </div>
                <p className="mt-2 text-xs leading-5 text-[var(--yl-text-muted)]">
                  {STATUS_META[selected.status].hint}
                </p>
              </div>

              {selected.score != null ? (
                <div>
                  <div className="flex items-center justify-between text-xs text-[var(--yl-text-muted)]">
                    <span>当前强度</span>
                    <span className="font-semibold tabular-nums text-[var(--yl-text)]">
                      {selected.score}
                    </span>
                  </div>
                  <div className="mt-2 h-2 overflow-hidden rounded-full bg-white/10">
                    <div
                      className={cn("h-full rounded-full", STATUS_META[selected.status].dot)}
                      style={{ width: `${getNodeScore(selected)}%` }}
                    />
                  </div>
                </div>
              ) : null}

              <div className="flex flex-wrap gap-1.5">
                {selected.inResume != null ? (
                  <EvidencePill active={selected.inResume} label="简历" />
                ) : null}
                {selected.inJd != null ? (
                  <EvidencePill active={selected.inJd} label="JD" />
                ) : null}
                {selected.inMarket != null ? (
                  <EvidencePill active={selected.inMarket} label="市场" />
                ) : null}
              </div>

              {selected.evidence ? (
                <div className="rounded-lg border border-[var(--yl-border)] bg-white/[0.03] px-3 py-2">
                  <p className="text-[11px] font-semibold uppercase tracking-wide text-[var(--yl-text-muted)]">
                    Evidence
                  </p>
                  <p className="mt-1 text-xs leading-5 text-[var(--yl-text)]">
                    {selected.evidence}
                  </p>
                </div>
              ) : null}

              {selected.actionHint ? (
                <div className="rounded-lg border border-cyan-400/20 bg-cyan-400/8 px-3 py-2">
                  <p className="text-[11px] font-semibold uppercase tracking-wide text-cyan-300">
                    Next action
                  </p>
                  <p className="mt-1 text-xs leading-5 text-[var(--yl-text)]">
                    {selected.actionHint}
                  </p>
                </div>
              ) : null}
            </div>
          ) : (
            <p className="mt-3 text-xs leading-5 text-[var(--yl-text-muted)]">
              点击左侧技能项，查看简历证据、岗位要求和下一步建议。
            </p>
          )}
        </aside>
      </div>
    </Card>
  );
}

function SummaryBadge({
  label,
  value,
  tone,
}: {
  label: string;
  value: number;
  tone: "missing" | "weak" | "covered";
}) {
  const style =
    tone === "missing"
      ? "border-red-400/25 bg-red-400/10 text-red-200"
      : tone === "weak"
        ? "border-amber-400/25 bg-amber-400/10 text-amber-100"
        : "border-emerald-400/25 bg-emerald-400/10 text-emerald-200";

  return (
    <div className={cn("rounded-xl border px-3 py-2", style)}>
      <div className="text-lg font-semibold tabular-nums">{value}</div>
      <div className="text-[11px] font-medium">{label}</div>
    </div>
  );
}
