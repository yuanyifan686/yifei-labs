"use client";

import {
  CareerRouteBar,
  CareerRouteFlags,
} from "@/components/job-match/CareerRouteBar";
import { ModeSwitcher } from "@/components/job-match/ModeSwitcher";
import { AppMode, CareerRouteStepId } from "@/components/job-match/constants";
import { cn } from "@/lib/utils";

export function WorkspaceHeader({
  mode,
  jobBankTotal,
  hasJobBankResult,
  hasMarketFitResult,
  busy,
  routeFlags,
  onModeChange,
  onRouteStep,
}: {
  mode: AppMode;
  jobBankTotal: number;
  hasJobBankResult: boolean;
  hasMarketFitResult: boolean;
  busy: boolean;
  routeFlags: CareerRouteFlags;
  onModeChange: (mode: AppMode) => void;
  onRouteStep?: (id: CareerRouteStepId) => void;
}) {
  return (
    <div className="border-b border-white/10 bg-[color-mix(in_srgb,var(--yl-bg)_84%,transparent)] backdrop-blur-xl">
      <div className="mx-auto max-w-6xl px-4 pb-5 pt-6 sm:px-6 sm:pb-6 sm:pt-8">
        <div className="animate-fade-up flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div className="min-w-0">
            <div className="mb-1.5 inline-flex max-w-full items-center gap-2 rounded-full border border-cyan-400/25 bg-cyan-400/10 px-2.5 py-1 text-[11px] font-semibold text-cyan-200 sm:mb-2">
              <span
                className={cn(
                  "h-1.5 w-1.5 shrink-0 rounded-full bg-cyan-400",
                  busy && "status-pulse",
                )}
              />
              <span className="truncate">Career map · 实时解锁</span>
            </div>
            <h1 className="text-xl font-semibold tracking-tight text-[var(--yl-text)] sm:text-2xl">
              职业路线工作台
            </h1>
            <p className="mt-1 text-xs leading-5 text-[var(--yl-text-muted)] sm:text-sm">
              简历 → 匹配 → 诊断 → 计划 · 样本库{" "}
              <span
                className="font-semibold text-[var(--yl-text)]"
                data-value={jobBankTotal}
              >
                {jobBankTotal}
              </span>{" "}
              条
            </p>
          </div>
          <ModeSwitcher
            mode={mode}
            hasJobBankResult={hasJobBankResult}
            hasMarketFitResult={hasMarketFitResult}
            onChange={onModeChange}
          />
        </div>
        <div className="mt-5 rounded-xl border border-white/10 bg-white/[0.025] p-2 sm:mt-6">
          <CareerRouteBar flags={routeFlags} onStepClick={onRouteStep} />
        </div>
      </div>
    </div>
  );
}
