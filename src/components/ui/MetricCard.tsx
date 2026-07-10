import { ReactNode } from "react";
import { AnimatedNumber } from "@/components/ui/AnimatedNumber";
import { cn } from "@/lib/utils";

export function MetricCard({
  label,
  value,
  hint,
  className,
  animated = false,
}: {
  label: string;
  value: ReactNode;
  hint?: string;
  className?: string;
  animated?: boolean;
}) {
  return (
    <div
      className={cn(
        "rounded-lg border border-white/10 bg-gradient-to-br from-white/[0.05] to-transparent px-3 py-3 transition hover:border-cyan-400/30",
        className,
      )}
    >
      <p className="text-[11px] font-medium text-slate-400">{label}</p>
      <p
        className="mt-1 text-xl font-semibold tabular-nums text-slate-50"
        data-value={typeof value === "number" ? value : undefined}
      >
        {animated && typeof value === "number" ? (
          <AnimatedNumber value={value} />
        ) : (
          value
        )}
      </p>
      {hint ? <p className="mt-1 text-[11px] text-slate-500">{hint}</p> : null}
    </div>
  );
}
