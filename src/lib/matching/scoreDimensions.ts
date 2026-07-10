import {
  extractSkillsFromText,
  normalizeSkillTags,
  skillOverlap,
} from "@/lib/profile/skillOntology";
import {
  ExperienceLevel,
  MatchScoreDimensions,
  ResumeProfile,
  StoredJob,
} from "@/types/jobMatch";

const EXPERIENCE_RANK: Record<ExperienceLevel, number> = {
  Student: 0,
  "Entry Level": 1,
  Junior: 2,
  Intermediate: 3,
  Senior: 4,
};

function jobSeniorityRank(job: StoredJob): number {
  if (job.seniority) {
    const map = { intern: 0, junior: 2, mid: 3, senior: 4, lead: 5 } as const;
    return map[job.seniority];
  }
  const hay = `${job.title} ${job.requirements} ${job.description}`.toLowerCase();
  if (/实习|intern/.test(hay)) return 0;
  if (/初级|junior|应届|校招/.test(hay)) return 1;
  if (/资深|专家|负责人|lead|principal|架构/.test(hay)) return 4;
  if (/高级|senior|主程/.test(hay)) return 4;
  if (/中级|中级工程师/.test(hay)) return 3;
  return 2;
}

function locationFit(
  profile: ResumeProfile,
  job: StoredJob,
  preferredLocation?: string,
): number {
  const jobLoc = (job.location || "").toLowerCase();
  if (!jobLoc) return 70;
  if (/远程|remote|不限/.test(jobLoc)) return 92;

  const prefs = [
    ...(preferredLocation ? [preferredLocation] : []),
    ...profile.preferredLocations,
  ].map((p) => p.toLowerCase());

  if (prefs.length === 0) return 72;
  if (prefs.some((p) => jobLoc.includes(p) || p.includes(jobLoc))) return 95;
  if (prefs.some((p) => /远程|remote/.test(p))) return 78;
  return 48;
}

function directionFit(profile: ResumeProfile, job: StoredJob): number {
  const jobHay = [
    job.title,
    ...job.relatedDirections,
    ...job.keywords,
    job.description,
  ]
    .join(" ")
    .toLowerCase();

  if (profile.domains.length === 0 && profile.projects.length === 0) return 60;

  let hits = 0;
  let total = 0;
  for (const domain of profile.domains) {
    total += 1;
    if (jobHay.includes(domain.toLowerCase()) || domain.split(/\s|\//).some((t) => t.length >= 2 && jobHay.includes(t.toLowerCase()))) {
      hits += 1;
    }
  }
  for (const project of profile.projects.slice(0, 4)) {
    total += 1;
    const techHit = project.tech.some((t) => jobHay.includes(t.toLowerCase()));
    const nameHit = project.name.length >= 2 && jobHay.includes(project.name.slice(0, 8).toLowerCase());
    if (techHit || nameHit) hits += 1;
  }

  if (total === 0) return 60;
  return Math.min(98, Math.max(30, Math.round((hits / total) * 100)));
}

function experienceFit(
  profile: ResumeProfile,
  job: StoredJob,
  experienceLevel: ExperienceLevel,
): number {
  const userRank = EXPERIENCE_RANK[experienceLevel] ?? 2;
  const jobRank = jobSeniorityRank(job);
  const years = profile.yearsTotal;

  let score = 75;
  const delta = Math.abs(userRank - Math.min(jobRank, 4));
  score -= delta * 12;

  if (years != null) {
    if (jobRank >= 4 && years < 3) score -= 18;
    if (jobRank <= 1 && years >= 5) score -= 8;
    if (jobRank >= 3 && years >= 3) score += 8;
  }

  return Math.min(96, Math.max(28, Math.round(score)));
}

export function jobSkillTags(job: StoredJob): string[] {
  if (job.skillTags && job.skillTags.length > 0) return job.skillTags;
  const fromKw = normalizeSkillTags(job.keywords || []);
  if (fromKw.length > 0) return fromKw;
  return extractSkillsFromText(
    `${job.title}\n${job.requirements}\n${job.description}\n${(job.keywords || []).join(" ")}`,
  );
}

/** Deterministic multi-dimension score for a resume profile vs a stored job. */
export function scoreJobDimensions(
  profile: ResumeProfile,
  job: StoredJob,
  options?: {
    experienceLevel?: ExperienceLevel;
    preferredLocation?: string;
  },
): MatchScoreDimensions & { matchedSkills: string[]; missingSkills: string[] } {
  const tags = jobSkillTags(job);
  const overlap = skillOverlap(profile.skillNames, tags.length > 0 ? tags : job.keywords);
  const skillCoverage = tags.length > 0 ? overlap.coverage : Math.min(85, 40 + overlap.matched.length * 8);
  const experience = experienceFit(
    profile,
    job,
    options?.experienceLevel || "Intermediate",
  );
  const direction = directionFit(profile, job);
  const location = locationFit(profile, job, options?.preferredLocation);

  // Weighted overall — skills dominate, then direction, experience, location
  const overall = Math.round(
    skillCoverage * 0.4 + direction * 0.25 + experience * 0.2 + location * 0.15,
  );

  return {
    skillCoverage: Math.min(100, Math.max(0, skillCoverage)),
    experienceFit: Math.min(100, Math.max(0, experience)),
    directionFit: Math.min(100, Math.max(0, direction)),
    locationFit: Math.min(100, Math.max(0, location)),
    overall: Math.min(100, Math.max(0, overall)),
    matchedSkills: overlap.matched,
    missingSkills: overlap.missing,
  };
}

/** Blend rule dimensions with optional LLM overall score. */
export function blendMatchScore(
  dims: MatchScoreDimensions,
  llmScore?: number,
): MatchScoreDimensions {
  if (llmScore == null || !Number.isFinite(llmScore)) return dims;
  const clamped = Math.min(100, Math.max(0, Math.round(llmScore)));
  // Trust rules for structure; pull overall slightly toward LLM
  const overall = Math.round(dims.overall * 0.55 + clamped * 0.45);
  return { ...dims, overall };
}

export function aggregateTopGaps(
  roles: Array<{ gaps?: string[]; scoreDimensions?: MatchScoreDimensions }>,
  limit = 5,
): string[] {
  const counts = new Map<string, number>();
  for (const role of roles.slice(0, 8)) {
    for (const gap of role.gaps || []) {
      const key = gap.replace(/^(岗位可能要求|建议补充或强化|缺失)[:：\s]*/i, "").trim();
      if (!key) continue;
      // Prefer short skill-like gaps
      const short = key.length > 48 ? key.slice(0, 48) : key;
      counts.set(short, (counts.get(short) || 0) + 1);
    }
  }
  return [...counts.entries()]
    .sort((a, b) => b[1] - a[1])
    .map(([g]) => g)
    .slice(0, limit);
}
