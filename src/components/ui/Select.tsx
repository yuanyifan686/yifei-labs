import { SelectHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

export function Select({
  className,
  ...props
}: SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      className={cn(
        "min-h-10 w-full rounded-lg border border-white/12 bg-[#0c1220] px-3 py-2 text-sm text-slate-100 outline-none transition-all duration-200 hover:border-white/20 focus:border-cyan-400/50 focus:ring-4 focus:ring-cyan-400/15",
        className,
      )}
      {...props}
    />
  );
}
