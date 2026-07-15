/** Structured error codes for Server Actions (frontend can branch recovery UX). */
export type ActionErrorCode =
  | "VALIDATION_ERROR"
  | "AI_UNAVAILABLE"
  | "ACTION_REQUEST_FAILED"
  | "PARSE_FAILED"
  | "JOB_BANK_EMPTY"
  | "PERSIST_FAILED"
  | "UNKNOWN";

export type ActionState<T> =
  | {
      ok: true;
      data: T;
      projectId?: string | null;
      source?: "ai" | "fallback";
      warning?: string;
    }
  | {
      ok: false;
      error: string;
      code: ActionErrorCode;
    };

export function actionError(
  error: string,
  code: ActionErrorCode = "UNKNOWN",
): Extract<ActionState<never>, { ok: false }> {
  return { ok: false, error, code };
}
