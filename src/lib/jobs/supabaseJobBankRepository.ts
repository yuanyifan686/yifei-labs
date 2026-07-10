import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { JobBankRepository } from "@/lib/jobs/jobBankRepository";
import {
  JobBankStats,
  JobDatabaseFile,
  StoredJob,
} from "@/types/jobMatch";

const DB_VERSION = 1 as const;

type JobRow = {
  id: string;
  title: string;
  company: string | null;
  location: string | null;
  salary: string | null;
  description: string | null;
  requirements: string | null;
  keywords: string[] | null;
  skill_tags: string[] | null;
  source: string | null;
  batch_id: string | null;
  is_synthetic: boolean | null;
  platform_style: string | null;
  related_directions: string[] | null;
  seniority: string | null;
  created_at: string | null;
  updated_at: string | null;
  payload: Partial<StoredJob> | null;
};

function emptyDatabase(): JobDatabaseFile {
  return {
    version: DB_VERSION,
    updatedAt: new Date().toISOString(),
    jobs: [],
  };
}

function rowToJob(row: JobRow): StoredJob {
  const fromPayload = row.payload || {};
  return {
    id: row.id,
    title: row.title,
    company: row.company || fromPayload.company || "示例科技公司",
    location: row.location || fromPayload.location || "远程 / 一线城市",
    salary: row.salary || fromPayload.salary || "面议",
    platformStyle:
      (row.platform_style as StoredJob["platformStyle"]) ||
      fromPayload.platformStyle ||
      "market",
    requirements: row.requirements || fromPayload.requirements || "",
    description: row.description || fromPayload.description || "",
    keywords: row.keywords || fromPayload.keywords || [],
    skillTags: row.skill_tags || fromPayload.skillTags || [],
    relatedDirections:
      row.related_directions || fromPayload.relatedDirections || [],
    source: (row.source as StoredJob["source"]) || fromPayload.source || "minimax",
    isSynthetic: row.is_synthetic !== false,
    seniority:
      (row.seniority as StoredJob["seniority"]) || fromPayload.seniority,
    batchId: row.batch_id || fromPayload.batchId || "legacy",
    createdAt: row.created_at || fromPayload.createdAt || new Date().toISOString(),
  };
}

function jobToRow(job: StoredJob) {
  return {
    id: job.id,
    title: job.title,
    company: job.company,
    location: job.location,
    salary: job.salary,
    description: job.description,
    requirements: job.requirements,
    keywords: job.keywords,
    skill_tags: job.skillTags || [],
    source: job.source,
    batch_id: job.batchId,
    is_synthetic: job.isSynthetic !== false,
    platform_style: job.platformStyle,
    related_directions: job.relatedDirections,
    seniority: job.seniority || null,
    created_at: job.createdAt,
    updated_at: new Date().toISOString(),
    payload: job,
  };
}

function jobKey(job: Pick<StoredJob, "title" | "company">) {
  return `${job.title.trim().toLowerCase()}::${job.company.trim().toLowerCase()}`;
}

export const supabaseJobBankRepository: JobBankRepository = {
  kind: "supabase",

  async load() {
    const jobs = await this.list();
    return {
      version: DB_VERSION,
      updatedAt:
        jobs.reduce((max, j) => (j.createdAt > max ? j.createdAt : max), "") ||
        new Date().toISOString(),
      jobs,
    };
  },

  async save(db) {
    const supabase = getSupabaseAdmin();
    if (!supabase) throw new Error("SUPABASE_UNAVAILABLE");

    // Full replace of bank contents via upsert + delete orphans would be heavy;
    // callers should prefer upsert(). This save overwrites by id set.
    if (db.jobs.length === 0) {
      await supabase.from("stored_jobs").delete().neq("id", "");
      return;
    }

    const rows = db.jobs.map(jobToRow);
    const { error } = await supabase.from("stored_jobs").upsert(rows, {
      onConflict: "id",
    });
    if (error) {
      console.error("[job-bank] save failed:", error.message);
      throw new Error(error.message);
    }
  },

  async list() {
    const supabase = getSupabaseAdmin();
    if (!supabase) return [];

    const { data, error } = await supabase
      .from("stored_jobs")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(2000);

    if (error) {
      console.error("[job-bank] list failed:", error.message);
      return [];
    }

    return (data || []).map((row) => rowToJob(row as JobRow));
  },

  async getStats() {
    const jobs = await this.list();
    const batches = new Set(jobs.map((job) => job.batchId).filter(Boolean));
    const stats: JobBankStats = {
      total: jobs.length,
      updatedAt: jobs.length > 0 ? jobs[0].createdAt : null,
      titles: [...new Set(jobs.map((job) => job.title))].slice(0, 12),
      batches: batches.size,
    };
    return stats;
  },

  async upsert(incoming, mode) {
    const supabase = getSupabaseAdmin();
    if (!supabase) throw new Error("SUPABASE_UNAVAILABLE");

    if (mode === "replace") {
      await supabase.from("stored_jobs").delete().neq("id", "");
      if (incoming.length === 0) return emptyDatabase();
      const { error } = await supabase.from("stored_jobs").insert(incoming.map(jobToRow));
      if (error) {
        console.error("[job-bank] replace insert failed:", error.message);
        throw new Error(error.message);
      }
      return {
        version: DB_VERSION,
        updatedAt: new Date().toISOString(),
        jobs: incoming,
      };
    }

    const current = await this.list();
    const map = new Map<string, StoredJob>();
    for (const job of current) map.set(jobKey(job), job);
    for (const job of incoming) map.set(jobKey(job), job);
    const merged = [...map.values()];

    // Upsert only incoming rows for efficiency
    const { error } = await supabase
      .from("stored_jobs")
      .upsert(incoming.map(jobToRow), { onConflict: "id" });
    if (error) {
      console.error("[job-bank] upsert failed:", error.message);
      throw new Error(error.message);
    }

    return {
      version: DB_VERSION,
      updatedAt: new Date().toISOString(),
      jobs: merged.sort((a, b) => b.createdAt.localeCompare(a.createdAt)),
    };
  },
};
