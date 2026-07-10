import { HTMLAttributes } from "react";
import { cn } from "@/lib/utils";

export function Badge({ className, ...props }: HTMLAttributes<HTMLSpanElement>) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-md border border-cyan-400/25 bg-cyan-400/10 px-2 py-0.5 text-xs font-medium text-cyan-100",
        className,
      )}
      {...props}
    />
  );
}
