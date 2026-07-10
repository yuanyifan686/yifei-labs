import OpenAI from "openai";

let cachedOpenAI: OpenAI | null = null;
let cachedClientKey = "";

export function getModelName() {
  return (
    process.env.AI_MODEL ||
    (process.env.MINIMAX_API_KEY ? "MiniMax-M3" : "gpt-4.1-mini")
  );
}

export function isMiniMaxProvider() {
  const baseURL = process.env.MINIMAX_BASE_URL || process.env.OPENAI_BASE_URL || "";
  return (
    Boolean(process.env.MINIMAX_API_KEY) ||
    baseURL.toLowerCase().includes("minimax") ||
    getModelName().toLowerCase().includes("minimax")
  );
}

export function getOpenAIClient() {
  const apiKey = process.env.MINIMAX_API_KEY || process.env.OPENAI_API_KEY;
  const baseURL =
    process.env.MINIMAX_BASE_URL ||
    process.env.OPENAI_BASE_URL ||
    (process.env.MINIMAX_API_KEY ? "https://api.minimaxi.com/v1" : undefined);

  if (!apiKey) {
    return null;
  }

  const clientKey = `${baseURL || "openai"}:${apiKey.slice(-8)}`;
  if (!cachedOpenAI || cachedClientKey !== clientKey) {
    cachedOpenAI = new OpenAI({
      apiKey,
      baseURL,
    });
    cachedClientKey = clientKey;
  }

  return cachedOpenAI;
}

/**
 * JSON-stable defaults: low temperature, thinking off on MiniMax.
 * max_completion_tokens is capped to avoid long hanging generations.
 */
export function getChatCreateOptions(maxTokens = 4096, temperature = 0.2) {
  const miniMax = isMiniMaxProvider();
  const capped = Math.min(Math.max(256, maxTokens), 8192);

  return {
    model: getModelName(),
    temperature: typeof temperature === "number" ? temperature : 0.2,
    ...(miniMax ? { thinking: { type: "disabled" as const } } : {}),
    response_format: { type: "json_object" as const },
    max_completion_tokens: capped,
  };
}

export function formatAiError(error: unknown): string {
  if (error && typeof error === "object") {
    const err = error as {
      status?: number;
      message?: string;
      error?: { message?: string; type?: string };
    };
    const status = err.status ? `HTTP ${err.status}` : "";
    const message = err.error?.message || err.message || "未知错误";
    return [status, message].filter(Boolean).join(": ");
  }
  return "未知错误";
}

export function isAiConfigured(): boolean {
  return Boolean(process.env.MINIMAX_API_KEY || process.env.OPENAI_API_KEY);
}
