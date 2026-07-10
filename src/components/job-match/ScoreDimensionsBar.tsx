"use client";

import { cn } from "@/lib/utils";
import { MatchScoreDimensions } from "@/types/jobMatch";

const LABELS: Array<{ key: keyof MatchScoreDimensions; label: string }> = [
  { key: "skillCoverage", label: "技能" },
  { key: "directionFit", label: "方向" },
  { key: "experienceFit", label: "经验" },
  { key: "locationFit", label: "地点" },
];

function barColor(value: number) {
  if (value >= 80) return "bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.45)]";
  if (value >= 60) return "bg-amber-300 shadow-[0_0_8px_rgba(251,191,36,0.35)]";
  return "bg-red-400 shadow-[0_0_8px_rgba(248,113,113,0.35)]";
}

export function ScoreDimensionsBar({
  dimensions,
  compact = false,
}: {
  dimensions?: MatchScoreDimensions | null;
  compact?: boolean;
}) {
  if (!dimensions) return null;

  return (
    <div className={cn("grid gap-1.5", compact ? "mt-2" : "mt-3 gap-2")}>
      {LABELS.map(({ key, label }) => {
        if (key === "overall") return null;
        const value = dimensions[key];
        return (
          <div key={key} className="flex items-center gap-2">
            <span
              className={cn(
                "shrink-0 text-slate-400",
                compact ? "w-8 text-[10px]" : "w-10 text-[11px] font-medium",
              )}
            >
              {label}
            </span>
            <div className="h-1.5 min-w-0 flex-1 overflow-hidden rounded-full bg-white/10">
              <div
                className={cn("h-full rounded-full transition-all", barColor(value))}
                style={{ width: `${Math.min(100, Math.max(0, value))}%` }}
              />
            </div>
            <span
              className={cn(
                "w-7 shrink-0 text-right tabular-nums text-slate-300",
                compact ? "text-[10px]" : "text-[11px] font-medium",
              )}
            >
              {value}
            </span>
          </div>
        );
      })}
    </div>
  );
}
