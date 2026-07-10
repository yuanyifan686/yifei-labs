import {
  extractSkillsFromText,
  normalizeSkillTags,
} from "@/lib/profile/skillOntology";
import { ResumeProfile, SkillCoverageCell } from "@/types/jobMatch";

function hasSkill(haystack: string[], skill: string): boolean {
  const s = skill.toLowerCase();
  return haystack.some(
    (h) =>
      h.toLowerCase() === s ||
      h.toLowerCase().includes(s) ||
      s.includes(h.toLowerCase()),
  );
}

/**
 * Build a compact skill coverage matrix for gap diagnosis UI.
 */
export function buildSkillMatrix(options: {
  profile: ResumeProfile;
  targetRole: string;
  targetJobDescription?: string;
  marketJobContext?: string;
  limit?: number;
}): SkillCoverageCell[] {
  const { profile, targetRole, targetJobDescription, marketJobContext } = options;
  const limit = options.limit ?? 12;

  const resumeSkills = profile.skillNames;
  const jdSkills = normalizeSkillTags(
    extractSkillsFromText(`${targetRole}\n${targetJobDescription || ""}`),
  );
  const marketSkills = normalizeSkillTags(
    extractSkillsFromText(marketJobContext || ""),
  );

  const universe = [
    ...new Set([...jdSkills, ...marketSkills, ...resumeSkills]),
  ].slice(0, limit + 4);

  // Prefer skills that appear in JD or market
  const prioritized = [
    ...universe.filter((s) => hasSkill(jdSkills, s) || hasSkill(marketSkills, s)),
    ...universe.filter((s) => !hasSkill(jdSkills, s) && !hasSkill(marketSkills, s)),
  ].slice(0, limit);

  return prioritized.map((skill) => {
    const inResume = hasSkill(resumeSkills, skill);
    const inTargetJd = hasSkill(jdSkills, skill);
    const inMarket = hasSkill(marketSkills, skill);

    let status: SkillCoverageCell["status"] = "missing";
    if (inResume && (inTargetJd || inMarket || (!inTargetJd && !inMarket))) {
      status = inTargetJd || inMarket ? "covered" : "covered";
    } else if (inResume) {
      status = "weak";
    } else if (inTargetJd || inMarket) {
      status = "missing";
    } else {
      status = "weak";
    }

    // Refine: resume only without market demand → weak signal
    if (inResume && !inTargetJd && !inMarket) status = "weak";
    if (inResume && (inTargetJd || inMarket)) status = "covered";
    if (!inResume && (inTargetJd || inMarket)) status = "missing";

    return { skill, inResume, inTargetJd, inMarket, status };
  });
}
