import { randomUUID } from "crypto";
import { fileJobBankRepository } from "@/lib/jobs/fileJobBankRepository";
import { JobBankRepository } from "@/lib/jobs/jobBankRepository";
import { supabaseJobBankRepository } from "@/lib/jobs/supabaseJobBankRepository";
import {
  extractSkillsFromText,
  normalizeSkillTags,
} from "@/lib/profile/skillOntology";
import { getSupabaseAdmin, isSupabaseConfigured } from "@/lib/supabase/admin";
import {
  JobBankStats,
  JobDatabaseFile,
  StoredJob,
} from "@/types/jobMatch";

let warnedFileMode = false;

/**
 * Prefer Supabase when configured AND table is usable.
 * Falls back to local JSON file for dev / missing env.
 */
export function getJobBankRepository(): JobBankRepository {
  if (isSupabaseConfigured() && getSupabaseAdmin()) {
    // Prefer supabase when env is set; runtime failures fall back per-call.
    if (process.env.JOB_BANK_STORAGE === "file") {
      return fileJobBankRepository;
    }
    return supabaseJobBankRepository;
  }
  if (!warnedFileMode) {
    console.warn(
      "[job-bank] Using file JobBankRepository (data/job-database.json). Not multi-instance safe.",
    );
    warnedFileMode = true;
  }
  return fileJobBankRepository;
}

async function withFileFallback<T>(
  op: (repo: JobBankRepository) => Promise<T>,
): Promise<T> {
  const repo = getJobBankRepository();
  try {
    return await op(repo);
  } catch (error) {
    if (repo.kind === "supabase") {
      console.error("[job-bank] Supabase op failed, falling back to file:", error);
      return op(fileJobBankRepository);
    }
    throw error;
  }
}

export async function loadJobDatabase(): Promise<JobDatabaseFile> {
  return withFileFallback((repo) => repo.load());
}

export async function saveJobDatabase(db: JobDatabaseFile): Promise<void> {
  return withFileFallback((repo) => repo.save(db));
}

export async function getJobBankStats(): Promise<JobBankStats> {
  return withFileFallback((repo) => repo.getStats());
}

export async function listStoredJobs(): Promise<StoredJob[]> {
  return withFileFallback((repo) => repo.list());
}

function inferSeniority(
  title: string,
  requirements: string,
): StoredJob["seniority"] {
  const hay = `${title} ${requirements}`.toLowerCase();
  if (/实习|intern/.test(hay)) return "intern";
  if (/初级|junior|应届|校招/.test(hay)) return "junior";
  if (/负责人|lead|principal|专家|架构/.test(hay)) return "lead";
  if (/高级|senior|资深/.test(hay)) return "senior";
  if (/中级/.test(hay)) return "mid";
  return undefined;
}

export function normalizeStoredJob(
  partial: Partial<StoredJob> & Pick<StoredJob, "title">,
  batchId: string,
  source: StoredJob["source"] = "minimax",
): StoredJob {
  const title = String(partial.title).trim();
  const requirements = String(partial.requirements || "").trim();
  const description = String(partial.description || "").trim();
  const keywords = Array.isArray(partial.keywords)
    ? partial.keywords.map(String).filter(Boolean).slice(0, 12)
    : [];
  const skillTags =
    Array.isArray(partial.skillTags) && partial.skillTags.length > 0
      ? normalizeSkillTags(partial.skillTags.map(String))
      : normalizeSkillTags([
          ...keywords,
          ...extractSkillsFromText(`${title}\n${requirements}\n${description}`),
        ]);

  return {
    id: partial.id || randomUUID(),
    title,
    company: String(partial.company || "示例科技公司").trim(),
    location: String(partial.location || "远程 / 一线城市").trim(),
    salary: String(partial.salary || "面议").trim(),
    platformStyle: partial.platformStyle || "market",
    requirements,
    description,
    keywords,
    skillTags,
    relatedDirections: Array.isArray(partial.relatedDirections)
      ? partial.relatedDirections.map(String).filter(Boolean).slice(0, 6)
      : [],
    source,
    isSynthetic: partial.isSynthetic !== false,
    seniority: partial.seniority || inferSeniority(title, requirements),
    batchId,
    createdAt: partial.createdAt || new Date().toISOString(),
  };
}

/** Merge new jobs into DB. Same title+company replaces older entry. */
export async function upsertJobs(
  incoming: StoredJob[],
  mode: "append" | "replace" = "append",
): Promise<JobDatabaseFile> {
  const normalized = incoming.map((job) =>
    normalizeStoredJob(job, job.batchId || "batch", job.source || "minimax"),
  );
  return withFileFallback((repo) => repo.upsert(normalized, mode));
}

/** Convert stored jobs into the plain-text job list format used by matching. */
export function jobsToListContent(jobs: StoredJob[]): string {
  return jobs
    .map((job) => {
      const keywords =
        job.keywords.length > 0 ? job.keywords.join("、") : "（无）";
      const tags =
        job.skillTags && job.skillTags.length > 0
          ? job.skillTags.join("、")
          : keywords;
      return [
        `岗位：${job.title}`,
        `公司：${job.company}`,
        `地点：${job.location}`,
        `薪资：${job.salary}`,
        `来源：AI岗位库/${job.platformStyle}`,
        `合成样本：${job.isSynthetic === false ? "否" : "是"}`,
        job.seniority ? `级别：${job.seniority}` : "",
        `要求：${job.requirements || job.description}`,
        job.description && job.description !== job.requirements
          ? `描述：${job.description}`
          : "",
        `关键词：${keywords}`,
        `技能标签：${tags}`,
        `岗位ID：${job.id}`,
      ]
        .filter(Boolean)
        .join("\n");
    })
    .join("\n\n");
}

export async function getJobListContentFromDatabase(options?: {
  limit?: number;
  directionTitles?: string[];
}): Promise<{ content: string; count: number; jobs: StoredJob[] }> {
  const db = await loadJobDatabase();
  let jobs = db.jobs;

  if (options?.directionTitles && options.directionTitles.length > 0) {
    const set = new Set(options.directionTitles.map((t) => t.toLowerCase()));
    const filtered = jobs.filter(
      (job) =>
        set.has(job.title.toLowerCase()) ||
        job.relatedDirections.some((d) => set.has(d.toLowerCase())),
    );
    if (filtered.length >= 3) {
      jobs = filtered;
    }
  }

  const limit = options?.limit ?? 30;
  jobs = jobs.slice(0, limit);

  return {
    content: jobsToListContent(jobs),
    count: jobs.length,
    jobs,
  };
}

/** Find market-style jobs related to a free-text target role for gap analysis. */
export async function findRelatedMarketJobs(
  targetRole: string,
  limit = 6,
): Promise<StoredJob[]> {
  const db = await loadJobDatabase();
  const query = targetRole.trim().toLowerCase();
  if (!query || db.jobs.length === 0) return [];

  const tokens = query
    .split(/[\s/|，,、+\-]+/)
    .map((t) => t.trim())
    .filter((t) => t.length >= 2);

  const scored = db.jobs
    .map((job) => {
      const hay = [
        job.title,
        job.requirements,
        job.description,
        ...job.keywords,
        ...(job.skillTags || []),
        ...job.relatedDirections,
      ]
        .join(" ")
        .toLowerCase();

      let score = 0;
      if (
        job.title.toLowerCase().includes(query) ||
        query.includes(job.title.toLowerCase())
      ) {
        score += 12;
      }
      for (const token of tokens) {
        if (hay.includes(token)) score += 3;
        if (job.title.toLowerCase().includes(token)) score += 4;
        if (job.keywords.some((k) => k.toLowerCase().includes(token))) score += 2;
      }
      return { job, score };
    })
    .filter((item) => item.score > 0)
    .sort((a, b) => b.score - a.score);

  if (scored.length > 0) {
    return scored.slice(0, limit).map((item) => item.job);
  }

  return db.jobs.slice(0, Math.min(limit, db.jobs.length));
}

export function jobsToMarketContext(jobs: StoredJob[]): string {
  if (jobs.length === 0) return "";
  return jobs
    .map((job, index) => {
      const tags =
        job.skillTags && job.skillTags.length > 0
          ? job.skillTags.join("、")
          : job.keywords.join("、");
      return [
        `【市场岗位 ${index + 1}】${job.title}`,
        `地点：${job.location} | 薪资参考：${job.salary}`,
        `合成样本：${job.isSynthetic === false ? "否" : "是"}`,
        `要求：${job.requirements}`,
        `描述：${job.description}`,
        `关键词：${job.keywords.join("、")}`,
        `技能标签：${tags}`,
      ].join("\n");
    })
    .join("\n\n");
}

/** Ensure legacy JSON rows get skillTags / isSynthetic without rewriting file. */
export function hydrateStoredJob(job: StoredJob): StoredJob {
  return normalizeStoredJob(job, job.batchId || "legacy", job.source || "minimax");
}

export function getJobBankStorageKind(): "file" | "supabase" {
  return getJobBankRepository().kind;
}
