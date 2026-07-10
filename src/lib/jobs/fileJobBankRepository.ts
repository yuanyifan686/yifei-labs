import { promises as fs } from "fs";
import path from "path";
import { JobBankRepository } from "@/lib/jobs/jobBankRepository";
import { enqueueWrite } from "@/lib/jobs/writeQueue";
import {
  JobBankStats,
  JobDatabaseFile,
  StoredJob,
} from "@/types/jobMatch";

const DB_VERSION = 1 as const;
const DB_RELATIVE_PATH = path.join("data", "job-database.json");

function getDbPath() {
  return path.join(process.cwd(), DB_RELATIVE_PATH);
}

/** Temp file + replace; Windows-safe when destination exists. */
async function writeJsonAtomic(filePath: string, payload: unknown) {
  const tmp = `${filePath}.${process.pid}.${Date.now()}.tmp`;
  await fs.writeFile(tmp, JSON.stringify(payload, null, 2), "utf8");
  try {
    await fs.rename(tmp, filePath);
  } catch {
    await fs.copyFile(tmp, filePath);
    await fs.unlink(tmp).catch(() => undefined);
  }
}

function emptyDatabase(): JobDatabaseFile {
  return {
    version: DB_VERSION,
    updatedAt: new Date().toISOString(),
    jobs: [],
  };
}

function jobKey(job: Pick<StoredJob, "title" | "company">) {
  return `${job.title.trim().toLowerCase()}::${job.company.trim().toLowerCase()}`;
}

export const fileJobBankRepository: JobBankRepository = {
  kind: "file",

  async load() {
    const filePath = getDbPath();
    try {
      const raw = await fs.readFile(filePath, "utf8");
      const parsed = JSON.parse(raw) as JobDatabaseFile;
      if (!parsed || !Array.isArray(parsed.jobs)) {
        return emptyDatabase();
      }
      return {
        version: DB_VERSION,
        updatedAt: parsed.updatedAt || new Date().toISOString(),
        jobs: parsed.jobs.filter((job) => job && job.title),
      };
    } catch (error) {
      const err = error as NodeJS.ErrnoException;
      if (err.code === "ENOENT") {
        return emptyDatabase();
      }
      console.error("Failed to read job database:", error);
      return emptyDatabase();
    }
  },

  async save(db) {
    return enqueueWrite(async () => {
      const filePath = getDbPath();
      await fs.mkdir(path.dirname(filePath), { recursive: true });
      const payload: JobDatabaseFile = {
        version: DB_VERSION,
        updatedAt: new Date().toISOString(),
        jobs: db.jobs,
      };
      await writeJsonAtomic(filePath, payload);
    });
  },

  async list() {
    const db = await this.load();
    return db.jobs;
  },

  async getStats() {
    const db = await this.load();
    const batches = new Set(db.jobs.map((job) => job.batchId).filter(Boolean));
    const stats: JobBankStats = {
      total: db.jobs.length,
      updatedAt: db.jobs.length > 0 ? db.updatedAt : null,
      titles: [...new Set(db.jobs.map((job) => job.title))].slice(0, 12),
      batches: batches.size,
    };
    return stats;
  },

  async upsert(incoming, mode) {
    // Full read-merge-write under the same queue as save
    return enqueueWrite(async () => {
      const current = mode === "replace" ? emptyDatabase() : await this.load();
      const map = new Map<string, StoredJob>();

      for (const job of current.jobs) {
        map.set(jobKey(job), job);
      }
      for (const job of incoming) {
        map.set(jobKey(job), job);
      }

      const next: JobDatabaseFile = {
        version: DB_VERSION,
        updatedAt: new Date().toISOString(),
        jobs: [...map.values()].sort((a, b) =>
          b.createdAt.localeCompare(a.createdAt),
        ),
      };

      const filePath = getDbPath();
      await fs.mkdir(path.dirname(filePath), { recursive: true });
      await writeJsonAtomic(filePath, next);
      return next;
    });
  },
};
