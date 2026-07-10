import { JobMatch, ResumeProfile } from "@/types/jobMatch";

export type RoleEvidence = {
  matchedSkills: string[];
  missingSkills: string[];
  evidenceLines: string[];
  dimensionHints: string[];
};

/**
 * Deterministic evidence strings for match cards (no LLM).
 */
export function buildRoleEvidence(
  role: JobMatch,
  profile?: ResumeProfile | null,
): RoleEvidence {
  const matchedSkills = (role.matchedKeywords || []).slice(0, 8);
  const missingSkills = (role.gaps || [])
    .map((g) =>
      g
        .replace(/^(岗位可能要求|岗位要求|建议补充或强化|缺失|May need)[:：\s]*/i, "")
        .replace(/，简历证据不足$/i, "")
        .trim(),
    )
    .filter(Boolean)
    .slice(0, 8);

  const evidenceLines: string[] = [];
  if (profile?.skills?.length) {
    for (const skill of profile.skills) {
      if (!skill.evidence) continue;
      const hit = matchedSkills.some(
        (m) =>
          m.toLowerCase() === skill.name.toLowerCase() ||
          skill.name.toLowerCase().includes(m.toLowerCase()) ||
          m.toLowerCase().includes(skill.name.toLowerCase()),
      );
      if (hit) {
        evidenceLines.push(`「${skill.name}」：${skill.evidence}`);
      }
      if (evidenceLines.length >= 2) break;
    }
  }

  if (evidenceLines.length === 0 && matchedSkills.length > 0) {
    evidenceLines.push(
      `简历中可对齐技能：${matchedSkills.slice(0, 4).join("、")}`,
    );
  }

  if (evidenceLines.length === 0 && profile?.projects?.[0]) {
    const p = profile.projects[0];
    evidenceLines.push(
      `相关项目线索：${p.name}${p.tech.length ? `（${p.tech.slice(0, 3).join("、")}）` : ""}`,
    );
  }

  if (evidenceLines.length === 0) {
    evidenceLines.push("当前缺少可引用的简历证据句，建议补充项目与技能关键词。");
  }

  const dims = role.scoreDimensions;
  const dimensionHints: string[] = [];
  if (dims) {
    dimensionHints.push(`技能覆盖 ${dims.skillCoverage}`);
    dimensionHints.push(`方向契合 ${dims.directionFit}`);
    dimensionHints.push(`经验匹配 ${dims.experienceFit}`);
    dimensionHints.push(`地点匹配 ${dims.locationFit}`);
  }

  return {
    matchedSkills,
    missingSkills: missingSkills.length
      ? missingSkills
      : (role.suggestedResumeKeywords || []).slice(0, 6),
    evidenceLines,
    dimensionHints,
  };
}
