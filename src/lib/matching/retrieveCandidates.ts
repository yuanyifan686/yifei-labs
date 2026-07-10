import { scoreJobDimensions } from "@/lib/matching/scoreDimensions";
import {
  ExperienceLevel,
  ResumeProfile,
  StoredJob,
} from "@/types/jobMatch";

export type ScoredCandidate = {
  job: StoredJob;
  retrievalScore: number;
  dimensions: ReturnType<typeof scoreJobDimensions>;
};

/**
 * Stage-2 retrieval: rank full job bank by profile dimensions, return TopK.
 * Purely local/rules — no embedding dependency for MVP.
 */
export function retrieveCandidates(
  profile: ResumeProfile,
  jobs: StoredJob[],
  options?: {
    limit?: number;
    experienceLevel?: ExperienceLevel;
    preferredLocation?: string;
    directionTitles?: string[];
  },
): ScoredCandidate[] {
  const limit = options?.limit ?? 12;
  if (jobs.length === 0) return [];

  let pool = jobs;
  if (options?.directionTitles && options.directionTitles.length > 0) {
    const set = new Set(options.directionTitles.map((t) => t.toLowerCase()));
    const filtered = jobs.filter(
      (job) =>
        set.has(job.title.toLowerCase()) ||
        job.relatedDirections.some((d) => set.has(d.toLowerCase())),
    );
    if (filtered.length >= 3) pool = filtered;
  }

  const scored: ScoredCandidate[] = pool.map((job) => {
    const dimensions = scoreJobDimensions(profile, job, {
      experienceLevel: options?.experienceLevel,
      preferredLocation: options?.preferredLocation,
    });
    // Retrieval score slightly boosts keyword-dense titles
    const titleBoost = profile.skillNames.some((s) =>
      job.title.toLowerCase().includes(s.toLowerCase()),
    )
      ? 6
      : 0;
    return {
      job,
      retrievalScore: Math.min(100, dimensions.overall + titleBoost),
      dimensions,
    };
  });

  scored.sort((a, b) => b.retrievalScore - a.retrievalScore);

  // Diversity: avoid all same title in top slice
  const picked: ScoredCandidate[] = [];
  const titleCount = new Map<string, number>();
  for (const item of scored) {
    const key = item.job.title.toLowerCase();
    const n = titleCount.get(key) || 0;
    if (n >= 2) continue;
    titleCount.set(key, n + 1);
    picked.push(item);
    if (picked.length >= limit) break;
  }

  // Fill remainder if diversity filter was too aggressive
  if (picked.length < Math.min(limit, scored.length)) {
    for (const item of scored) {
      if (picked.includes(item)) continue;
      picked.push(item);
      if (picked.length >= limit) break;
    }
  }

  return picked;
}

export function candidatesToJobListContent(candidates: ScoredCandidate[]): string {
  return candidates
    .map(({ job, retrievalScore, dimensions }) => {
      const tags =
        (job.skillTags && job.skillTags.length > 0
          ? job.skillTags
          : job.keywords
        ).join("、") || "（无）";
      return [
        `岗位：${job.title}`,
        `公司：${job.company}`,
        `地点：${job.location}`,
        `薪资：${job.salary}`,
        `来源：AI岗位库/${job.platformStyle}`,
        `合成样本：是`,
        `预筛分：${retrievalScore}`,
        `维度：技能${dimensions.skillCoverage}/方向${dimensions.directionFit}/经验${dimensions.experienceFit}/地点${dimensions.locationFit}`,
        `要求：${job.requirements || job.description}`,
        job.description && job.description !== job.requirements
          ? `描述：${job.description}`
          : "",
        `关键词：${tags}`,
        `岗位ID：${job.id}`,
      ]
        .filter(Boolean)
        .join("\n");
    })
    .join("\n\n");
}
