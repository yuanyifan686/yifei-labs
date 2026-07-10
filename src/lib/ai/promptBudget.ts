/**
 * Keep prompts short and stable: long resumes/JD contexts cause
 * truncation mid-JSON and higher latency.
 */

export const PROMPT_LIMITS = {
  resume: 5500,
  marketContext: 2200,
  jobList: 7000,
  jd: 2800,
  structuredSummary: 900,
  evidenceSeed: 1600,
} as const;

/** Head + tail preserve skills/header and recent projects. */
export function clipText(
  text: string | undefined | null,
  maxChars: number,
): string {
  const raw = (text || "").trim();
  if (!raw) return "";
  if (raw.length <= maxChars) return raw;

  const marker = `\n\n…[已截断 ${raw.length - maxChars} 字]…\n\n`;
  const budget = Math.max(32, maxChars - marker.length);
  const head = Math.max(16, Math.floor(budget * 0.62));
  const tail = Math.max(8, budget - head);
  return raw.slice(0, head) + marker + raw.slice(-tail);
}

export function clipLines(
  text: string | undefined | null,
  maxChars: number,
  maxLines = 80,
): string {
  const clipped = clipText(text, maxChars);
  const lines = clipped.split(/\r?\n/);
  if (lines.length <= maxLines) return clipped;
  return lines.slice(0, maxLines).join("\n") + "\n…[行数已截断]";
}
