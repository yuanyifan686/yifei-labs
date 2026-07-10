"use client";

import {
  SkillNodeStatus,
  SkillStarGraphModel,
  SkillStarNode,
} from "@/lib/three/skillStarModel";
import { cn } from "@/lib/utils";

const STATUS_STYLE: Record<
  SkillNodeStatus,
  { chip: string; label: string }
> = {
  hub: {
    chip: "border-cyan-400/40 bg-cyan-400/15 text-cyan-100",
    label: "中心",
  },
  covered: {
    chip: "border-emerald-400/35 bg-emerald-400/12 text-emerald-200",
    label: "覆盖",
  },
  weak: {
    chip: "border-amber-400/35 bg-amber-400/12 text-amber-100",
    label: "弱",
  },
  missing: {
    chip: "border-red-400/35 bg-red-400/12 text-red-200",
    label: "缺失",
  },
  dimension: {
    chip: "border-violet-400/35 bg-violet-400/12 text-violet-200",
    label: "维度",
  },
};

export function SkillStarFallback({
  model,
  selectedId,
  onSelect,
}: {
  model: SkillStarGraphModel;
  selectedId?: string | null;
  onSelect?: (node: SkillStarNode) => void;
}) {
  const skills = model.nodes.filter((n) => n.status !== "hub");
  const hub = model.nodes.find((n) => n.status === "hub");

  return (
    <div className="skill-star-fallback">
      {hub ? (
        <button
          type="button"
          className={cn(
            "mb-3 rounded-xl border px-3 py-2 text-left text-sm font-semibold transition",
            STATUS_STYLE.hub.chip,
            selectedId === hub.id && "ring-2 ring-cyan-400/40",
          )}
          onClick={() => onSelect?.(hub)}
        >
          {hub.label}
          {hub.score != null ? (
            <span className="ml-2 text-xs font-medium opacity-80">
              {hub.score}%
            </span>
          ) : null}
        </button>
      ) : null}
      <div className="flex flex-wrap gap-2">
        {skills.map((node) => (
          <button
            key={node.id}
            type="button"
            className={cn(
              "rounded-full border px-2.5 py-1 text-xs font-medium transition hover:scale-[1.03]",
              STATUS_STYLE[node.status].chip,
              selectedId === node.id && "ring-2 ring-white/30",
            )}
            onClick={() => onSelect?.(node)}
            title={node.evidence}
          >
            <span className="opacity-70">{STATUS_STYLE[node.status].label}</span>
            <span className="ml-1.5">{node.label}</span>
            {node.score != null && node.status === "dimension" ? (
              <span className="ml-1 tabular-nums opacity-70">{node.score}</span>
            ) : null}
          </button>
        ))}
      </div>
    </div>
  );
}
