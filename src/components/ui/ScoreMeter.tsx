import { AnimatedNumber } from "@/components/ui/AnimatedNumber";
import { scoreBar, scoreHint, scoreText } from "@/lib/scoreUtils";
import { cn } from "@/lib/utils";

export function ScoreMeter({
  title,
  value,
  showHint = true,
  size = "md",
  variant = "bar",
}: {
  title: string;
  value: number;
  showHint?: boolean;
  size?: "sm" | "md";
  variant?: "bar" | "ring";
}) {
  const clamped = Math.min(100, Math.max(0, value));

  if (variant === "ring") {
    const r = size === "sm" ? 28 : 36;
    const c = 2 * Math.PI * r;
    const offset = c * (1 - clamped / 100);
    const stroke =
      clamped >= 80 ? "#34d399" : clamped >= 60 ? "#fbbf24" : "#f87171";
    const dim = (r + 10) * 2;

    return (
      <div className="flex flex-col items-center rounded-xl border border-white/10 bg-white/[0.03] p-4">
        <span className="mb-2 text-xs font-medium text-slate-400">{title}</span>
        <div className="relative" style={{ width: dim, height: dim }}>
          <svg width={dim} height={dim} className="-rotate-90">
            <circle
              cx={dim / 2}
              cy={dim / 2}
              r={r}
              fill="none"
              stroke="rgba(148,163,184,0.15)"
              strokeWidth="6"
            />
            <circle
              cx={dim / 2}
              cy={dim / 2}
              r={r}
              fill="none"
              stroke={stroke}
              strokeWidth="6"
              strokeLinecap="round"
              strokeDasharray={c}
              strokeDashoffset={offset}
              style={{
                filter: `drop-shadow(0 0 6px ${stroke}66)`,
                transition: "stroke-dashoffset 0.55s cubic-bezier(0.22,1,0.36,1)",
              }}
            />
          </svg>
          <div className="absolute inset-0 grid place-items-center">
            <span
              className={cn(
                "font-semibold tabular-nums",
                size === "sm" ? "text-lg" : "text-2xl",
                scoreText(clamped),
              )}
              data-value={clamped}
            >
              <AnimatedNumber value={clamped} />
            </span>
          </div>
        </div>
        {showHint ? (
          <p className="mt-2 text-center text-[11px] text-slate-500">{scoreHint(clamped)}</p>
        ) : null}
      </div>
    );
  }

  if (size === "sm") {
    return (
      <div>
        <div className="mb-2 flex items-center justify-between text-xs font-medium text-slate-400">
          <span>{title}</span>
          <span className={cn("tabular-nums", scoreText(clamped))} data-value={clamped}>
            {clamped}
          </span>
        </div>
        <div className="score-track">
          <div
            className={cn("score-fill", scoreBar(clamped))}
            style={{ width: `${clamped}%` }}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-white/10 bg-gradient-to-br from-white/[0.05] to-transparent p-4 transition hover:border-cyan-400/25 hover:shadow-[0_0_24px_rgba(56,189,248,0.08)]">
      <div className="flex items-end justify-between gap-2">
        <span className="text-xs font-medium text-slate-400">{title}</span>
        <span className={cn("text-3xl font-semibold", scoreText(clamped))} data-value={clamped}>
          <AnimatedNumber value={clamped} />
        </span>
      </div>
      <div className="score-track mt-3">
        <div
          className={cn("score-fill", scoreBar(clamped))}
          style={{ width: `${clamped}%` }}
        />
      </div>
      {showHint ? (
        <p className="mt-2 text-[11px] text-slate-500">{scoreHint(clamped)}</p>
      ) : null}
    </div>
  );
}
