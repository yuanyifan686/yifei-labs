import { Badge } from "@/components/ui/Badge";
import { cn } from "@/lib/utils";

export type SourceStatus = "ai" | "fallback" | "unconfigured" | "error" | "synthetic" | "real_jd";

const STYLES: Record<
  SourceStatus,
  { dot: string; badge: string; label: string }
> = {
  ai: {
    dot: "bg-cyan-300",
    badge: "border-cyan-400/30 bg-cyan-400/10 text-cyan-100",
    label: "AI 分析",
  },
  fallback: {
    dot: "bg-amber-300",
    badge: "border-amber-400/30 bg-amber-400/10 text-amber-100",
    label: "规则回退",
  },
  unconfigured: {
    dot: "bg-slate-400",
    badge: "border-white/15 bg-white/[0.04] text-slate-300",
    label: "未配置",
  },
  error: {
    dot: "bg-red-400",
    badge: "border-red-400/30 bg-red-400/10 text-red-100",
    label: "错误",
  },
  synthetic: {
    dot: "bg-amber-300",
    badge: "border-amber-400/25 bg-amber-400/10 text-amber-100",
    label: "合成样本",
  },
  real_jd: {
    dot: "bg-emerald-300",
    badge: "border-emerald-400/30 bg-emerald-400/10 text-emerald-100",
    label: "真实 JD",
  },
};

export function SourceStatusBadge({
  status,
  label,
  className,
}: {
  status: SourceStatus;
  label?: string;
  className?: string;
}) {
  const style = STYLES[status];
  return (
    <Badge className={cn("inline-flex items-center gap-1.5", style.badge, className)}>
      <span className={cn("h-1.5 w-1.5 shrink-0 rounded-full", style.dot)} />
      <span>{label || style.label}</span>
    </Badge>
  );
}
