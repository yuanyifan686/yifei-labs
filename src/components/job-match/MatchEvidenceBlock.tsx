"use client";

import { Badge } from "@/components/ui/Badge";
import { buildRoleEvidence } from "@/lib/matching/roleEvidence";
import { JobMatch, ResumeProfile } from "@/types/jobMatch";

export function MatchEvidenceBlock({
  role,
  profile,
  compact = false,
}: {
  role: JobMatch;
  profile?: ResumeProfile | null;
  compact?: boolean;
}) {
  const evidence = buildRoleEvidence(role, profile);

  return (
    <div className={compact ? "mt-2 space-y-1.5" : "space-y-2"}>
      {evidence.matchedSkills.length > 0 ? (
        <div className="flex flex-wrap gap-1">
          {evidence.matchedSkills.slice(0, compact ? 4 : 8).map((s) => (
            <Badge
              key={`m-${s}`}
              className="border-emerald-400/25 bg-emerald-400/10 text-[10px] text-emerald-200"
            >
              命中 {s}
            </Badge>
          ))}
        </div>
      ) : null}
      {evidence.missingSkills.length > 0 ? (
        <div className="flex flex-wrap gap-1">
          {evidence.missingSkills.slice(0, compact ? 3 : 6).map((s) => (
            <Badge
              key={`g-${s}`}
              className="border-amber-400/25 bg-amber-400/10 text-[10px] text-amber-100"
            >
              缺口 {s}
            </Badge>
          ))}
        </div>
      ) : null}
      {!compact ? (
        <ul className="space-y-1">
          {evidence.evidenceLines.slice(0, 2).map((line) => (
            <li
              key={line}
              className="rounded-md border border-white/10 bg-white/[0.03] px-2 py-1.5 text-[11px] leading-5 text-slate-300"
            >
              {line}
            </li>
          ))}
        </ul>
      ) : evidence.evidenceLines[0] ? (
        <p className="line-clamp-1 text-[11px] text-slate-500">
          证据：{evidence.evidenceLines[0]}
        </p>
      ) : null}
    </div>
  );
}
