/**
 * Extract + repair JSON from model text (fences / think tags / truncation).
 */

export function extractJsonPayload(content: string): string {
  let cleaned = content
    .trim()
    .replace(/<think>[\s\S]*?<\/think>/gi, "")
    .replace(/```(?:json)?\s*/gi, "")
    .replace(/```/g, "")
    .trim();

  // Drop leading prose before first object/array
  const firstObj = cleaned.search(/[\[{]/);
  if (firstObj > 0) cleaned = cleaned.slice(firstObj);

  const firstBrace = cleaned.indexOf("{");
  const firstBracket = cleaned.indexOf("[");
  let start = -1;
  if (firstBrace === -1) start = firstBracket;
  else if (firstBracket === -1) start = firstBrace;
  else start = Math.min(firstBrace, firstBracket);

  if (start > 0) cleaned = cleaned.slice(start);

  // Prefer object payload for our APIs
  if (cleaned.startsWith("{")) {
    const lastBrace = cleaned.lastIndexOf("}");
    if (lastBrace > 0) {
      // keep through last brace; repair may still add closers if truncated inside
      cleaned = cleaned.slice(0, lastBrace + 1);
    }
  }

  return cleaned.trim();
}

/** Remove trailing commas before } or ] (common model failure). */
export function stripTrailingCommas(jsonLike: string): string {
  return jsonLike.replace(/,\s*([}\]])/g, "$1");
}

/** Normalize smart quotes that break JSON.parse. */
export function normalizeQuotes(jsonLike: string): string {
  return jsonLike
    .replace(/[\u201c\u201d\u201e\u201f]/g, '"')
    .replace(/[\u2018\u2019\u201a\u201b]/g, "'");
}

/**
 * If generation was cut off mid-object, close open strings/braces/brackets.
 * Best-effort — only used after strict parse fails.
 */
export function balanceJsonClosers(jsonLike: string): string {
  let s = jsonLike;
  let inString = false;
  let escape = false;
  const stack: Array<"{" | "["> = [];

  for (let i = 0; i < s.length; i++) {
    const ch = s[i];
    if (inString) {
      if (escape) {
        escape = false;
      } else if (ch === "\\") {
        escape = true;
      } else if (ch === '"') {
        inString = false;
      }
      continue;
    }
    if (ch === '"') {
      inString = true;
      continue;
    }
    if (ch === "{") stack.push("{");
    else if (ch === "[") stack.push("[");
    else if (ch === "}" || ch === "]") {
      if (stack.length) stack.pop();
    }
  }

  if (inString) s += '"';
  while (stack.length) {
    const open = stack.pop();
    s += open === "{" ? "}" : "]";
  }
  return s;
}

/**
 * Light repairs for common MiniMax/LLM JSON glitches.
 */
export function repairJsonText(jsonLike: string): string {
  let s = normalizeQuotes(jsonLike.trim());
  s = stripTrailingCommas(s);
  // Remove JS-style comments (rare but seen)
  s = s.replace(/^\s*\/\/.*$/gm, "");
  s = s.replace(/\/\*[\s\S]*?\*\//g, "");
  s = stripTrailingCommas(s);
  return balanceJsonClosers(s);
}

function tryParse(text: string): unknown {
  return JSON.parse(text);
}

/**
 * Parse model JSON with progressive repair. Production logs avoid dumping payloads.
 */
export function parseJsonResponse<T>(content: string, label: string): T {
  const extracted = extractJsonPayload(content);
  const attempts = [
    extracted,
    stripTrailingCommas(extracted),
    repairJsonText(extracted),
    repairJsonText(extractJsonPayload(content + "\n}")),
  ];

  let lastError: unknown;
  const seen = new Set<string>();
  for (const attempt of attempts) {
    if (!attempt || seen.has(attempt)) continue;
    seen.add(attempt);
    try {
      return tryParse(attempt) as T;
    } catch (e) {
      lastError = e;
    }
  }

  const preview =
    process.env.NODE_ENV === "production"
      ? `[redacted length=${content.length}]`
      : content.slice(0, 400);
  console.error(`Failed to parse ${label} response:`, preview, lastError);
  throw new Error(`Failed to parse AI ${label} response.`);
}
