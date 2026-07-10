import { AnalysisSession, SessionPatch } from "@/types/jobMatch";

export interface SessionStore {
  readonly kind: "memory" | "supabase";
  create(partial?: Partial<AnalysisSession>): Promise<AnalysisSession>;
  get(id: string): Promise<AnalysisSession | null>;
  /** Get only when clientToken matches (privacy). */
  getForClient(id: string, clientToken: string): Promise<AnalysisSession | null>;
  update(id: string, patch: SessionPatch): Promise<AnalysisSession | null>;
  listByClientToken(clientToken: string, limit?: number): Promise<AnalysisSession[]>;
  delete(id: string, clientToken: string): Promise<boolean>;
}
