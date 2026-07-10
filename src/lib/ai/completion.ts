import {
  formatAiError,
  getChatCreateOptions,
  getOpenAIClient,
} from "@/lib/ai/client";
import { parseJsonResponse } from "@/lib/ai/parse";

export { formatAiError };

export type StructuredCompletionOptions<T = unknown> = {
  maxTokens?: number;
  /** Abort the HTTP request after this many ms. Default 55s. */
  timeoutMs?: number;
  /**
   * Extra attempts after the first call when JSON parse / validate fails.
   * Default 1 (total up to 2 calls). Set 0 to disable.
   */
  retries?: number;
  temperature?: number;
  /** Optional post-parse validator (e.g. Zod). Retry on failure. */
  validate?: (data: unknown) =>
    | { ok: true; data: T }
    | { ok: false; error: string };
};

const DEFAULT_TIMEOUT_MS = 55_000;

function withTimeoutSignal(timeoutMs: number): {
  signal: AbortSignal;
  clear: () => void;
} {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  return {
    signal: controller.signal,
    clear: () => clearTimeout(timer),
  };
}

async function onceStructuredCompletion(
  label: string,
  prompt: string,
  maxTokens: number,
  timeoutMs: number,
  temperature?: number,
  repairHint?: string,
): Promise<unknown> {
  const openai = getOpenAIClient();
  if (!openai) {
    throw new Error("NO_API_KEY");
  }

  const userContent = repairHint
    ? `${prompt}\n\n---\nPREVIOUS OUTPUT WAS INVALID (${repairHint}). Return ONE valid JSON object only. No markdown, no comments, no trailing commas.`
    : prompt;

  const { signal, clear } = withTimeoutSignal(timeoutMs);
  try {
    const completion = await openai.chat.completions.create(
      {
        ...getChatCreateOptions(maxTokens, temperature),
        messages: [
          {
            role: "system",
            content:
              "You are a careful JSON API. Respond with a single valid JSON object only. " +
              "Never wrap JSON in markdown fences. Never invent fake experience. " +
              "No trailing commas. Close all braces. Prefer short string arrays (max 6 items each).",
          },
          { role: "user", content: userContent },
        ],
      },
      { signal },
    );

    const message = completion.choices[0]?.message;
    const content = message?.content?.trim();
    if (!content) {
      throw new Error(
        `AI 返回空内容（finish_reason=${completion.choices[0]?.finish_reason || "unknown"}）。`,
      );
    }

    return parseJsonResponse(content, label);
  } catch (error) {
    if (
      error instanceof Error &&
      (error.name === "AbortError" || /aborted|timeout/i.test(error.message))
    ) {
      throw new Error(`AI ${label} 超时（>${Math.round(timeoutMs / 1000)}s）`);
    }
    throw error;
  } finally {
    clear();
  }
}

/**
 * Structured JSON completion with timeout, parse repair, and optional validate retry.
 */
export async function createStructuredCompletion<T>(
  label: string,
  prompt: string,
  maxTokensOrOptions: number | StructuredCompletionOptions<T> = 4096,
): Promise<T> {
  const options: StructuredCompletionOptions<T> =
    typeof maxTokensOrOptions === "number"
      ? { maxTokens: maxTokensOrOptions }
      : maxTokensOrOptions || {};

  const maxTokens = options.maxTokens ?? 4096;
  const timeoutMs = options.timeoutMs ?? DEFAULT_TIMEOUT_MS;
  const retries = options.retries ?? 1;
  const started = Date.now();

  let lastError: unknown;
  let repairHint: string | undefined;

  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const raw = await onceStructuredCompletion(
        label,
        prompt,
        // Slightly fewer tokens on repair to force shorter, closed JSON
        attempt > 0 ? Math.min(maxTokens, 2800) : maxTokens,
        // Tighter timeout on retry so total latency stays bounded
        attempt > 0 ? Math.min(timeoutMs, 35_000) : timeoutMs,
        options.temperature,
        repairHint,
      );

      if (options.validate) {
        const checked = options.validate(raw);
        if (!checked.ok) {
          repairHint = `schema: ${checked.error}`;
          lastError = new Error(`SCHEMA_INVALID: ${checked.error}`);
          continue;
        }
        if (process.env.NODE_ENV !== "production") {
          console.info(
            `[ai] ${label} ok in ${Date.now() - started}ms attempt=${attempt + 1}`,
          );
        }
        return checked.data;
      }

      if (process.env.NODE_ENV !== "production") {
        console.info(
          `[ai] ${label} ok in ${Date.now() - started}ms attempt=${attempt + 1}`,
        );
      }
      return raw as T;
    } catch (error) {
      lastError = error;
      const msg = error instanceof Error ? error.message : String(error);
      // Don't retry hard timeouts on first attempt if already near budget — still try once if retries left
      if (/NO_API_KEY/.test(msg)) throw error;
      repairHint = msg.slice(0, 120);
      if (attempt >= retries) break;
    }
  }

  throw lastError instanceof Error
    ? lastError
    : new Error(`AI ${label} failed: ${formatAiError(lastError)}`);
}
