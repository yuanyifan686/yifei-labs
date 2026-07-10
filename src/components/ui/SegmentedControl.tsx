"use client";

import { cn } from "@/lib/utils";

export type SegmentOption<T extends string> = {
  value: T;
  label: string;
  /** Show a success dot when this segment has completed data */
  hasResult?: boolean;
};

export function SegmentedControl<T extends string>({
  value,
  options,
  onChange,
  className,
}: {
  value: T;
  options: SegmentOption<T>[];
  onChange: (value: T) => void;
  className?: string;
}) {
  const activeIndex = Math.max(
    0,
    options.findIndex((option) => option.value === value),
  );
  const count = options.length || 1;

  return (
    <div
      className={cn(
        "segment-track relative inline-flex w-full max-w-none rounded-xl border border-white/10 bg-white/[0.04] p-1 sm:max-w-sm sm:w-auto",
        className,
      )}
    >
      <div
        className="segment-thumb"
        style={{
          left: `calc(${(activeIndex / count) * 100}% + 4px)`,
          width: `calc(${100 / count}% - 4px)`,
        }}
      />
      {options.map((option) => {
        const active = option.value === value;
        return (
          <button
            key={option.value}
            type="button"
            onClick={() => onChange(option.value)}
            className={cn(
              "relative z-10 min-h-10 flex-1 rounded-lg px-3 py-2 text-sm font-medium transition-colors duration-200 sm:px-4",
              active ? "text-cyan-100" : "text-slate-400 hover:text-slate-200",
            )}
          >
            {option.label}
            {option.hasResult ? (
              <span className="status-pulse ml-1.5 inline-block h-1.5 w-1.5 rounded-full bg-emerald-400" />
            ) : null}
          </button>
        );
      })}
    </div>
  );
}
