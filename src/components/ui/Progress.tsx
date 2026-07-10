import { cn } from "@/lib/utils";

export function Progress({ value, className }: { value: number; className?: string }) {
  const score = Math.min(100, Math.max(0, value));
  const tone =
    score >= 80 ? "score-fill-high" : score >= 60 ? "score-fill-mid" : "score-fill-low";

  return (
    <div className={cn("score-track", className)}>
      <div className={cn("score-fill", tone)} style={{ width: `${score}%` }} />
    </div>
  );
}
