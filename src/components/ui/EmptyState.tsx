import { ReactNode } from "react";
import { Card } from "@/components/ui/Card";
import { cn } from "@/lib/utils";

export function EmptyState({
  icon,
  title,
  description,
  action,
  className,
}: {
  icon?: ReactNode;
  title: string;
  description?: string;
  action?: ReactNode;
  className?: string;
}) {
  return (
    <Card
      className={cn(
        "border-dashed border-white/15 bg-white/[0.03] p-12 text-center",
        className,
      )}
    >
      {icon ? (
        <div className="mx-auto mb-3 grid h-12 w-12 place-items-center rounded-2xl border border-white/10 bg-white/[0.04] text-xs font-bold text-slate-400">
          {icon}
        </div>
      ) : null}
      <p className="text-sm font-medium text-slate-100">{title}</p>
      {description ? (
        <p className="mt-2 text-sm text-slate-400">{description}</p>
      ) : null}
      {action ? <div className="mt-4 flex justify-center">{action}</div> : null}
    </Card>
  );
}
