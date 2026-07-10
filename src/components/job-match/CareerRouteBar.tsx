"use client";

import { CAREER_ROUTE_STEPS, CareerRouteStepId } from "@/components/job-match/constants";
import { cn } from "@/lib/utils";

export type CareerRouteFlags = {
  resume: boolean;
  match: boolean;
  diagnose: boolean;
  plan: boolean;
  /** Currently active step for highlight */
  active?: CareerRouteStepId | null;
  analyzing?: boolean;
};

const ORDER: CareerRouteStepId[] = [
  "resume",
  "match",
  "diagnose",
  "plan",
];

export function deriveActiveStep(flags: CareerRouteFlags): CareerRouteStepId {
  if (flags.analyzing) {
    if (flags.match && !flags.diagnose) return "diagnose";
    if (flags.resume && !flags.match) return "match";
    return "match";
  }
  if (flags.plan) return "plan";
  if (flags.diagnose) return "diagnose";
  if (flags.match) return "match";
  if (flags.resume) return "resume";
  return "resume";
}

export function CareerRouteBar({
  flags,
  compact = false,
  className,
  onStepClick,
}: {
  flags: CareerRouteFlags;
  compact?: boolean;
  className?: string;
  onStepClick?: (id: CareerRouteStepId) => void;
}) {
  const active = flags.active ?? deriveActiveStep(flags);

  return (
    <nav
      className={cn("career-route-bar", compact && "is-compact", className)}
      aria-label="职业分析路径"
    >
      {CAREER_ROUTE_STEPS.map((step, index) => {
        const unlocked = flags[step.id];
        const isActive = active === step.id;
        const isDone =
          unlocked &&
          ORDER.indexOf(step.id) < ORDER.indexOf(active) &&
          !isActive;
        return (
          <div key={step.id} className="career-route-item">
            {index > 0 ? (
              <span
                className={cn(
                  "career-route-rail",
                  (unlocked || isDone || isActive) && "is-lit",
                )}
                aria-hidden
              />
            ) : null}
            <button
              type="button"
              disabled={!unlocked && !isActive}
              onClick={() => onStepClick?.(step.id)}
              className={cn(
                "career-route-node",
                unlocked && "is-unlocked",
                isActive && "is-active",
                isDone && "is-done",
              )}
              title={step.hint}
            >
              <span className="career-route-index">
                {String(index + 1).padStart(2, "0")}
              </span>
              <span className="career-route-label">{step.label}</span>
            </button>
          </div>
        );
      })}
    </nav>
  );
}
