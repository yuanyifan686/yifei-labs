import {
  JobBankStats,
  JobDatabaseFile,
  StoredJob,
} from "@/types/jobMatch";

export interface JobBankRepository {
  readonly kind: "file" | "supabase";
  load(): Promise<JobDatabaseFile>;
  save(db: JobDatabaseFile): Promise<void>;
  list(): Promise<StoredJob[]>;
  getStats(): Promise<JobBankStats>;
  upsert(incoming: StoredJob[], mode: "append" | "replace"): Promise<JobDatabaseFile>;
}
