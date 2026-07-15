const DEFAULT_MAX_CHARS = 14000;

const IMPORTANT_LINE =
  /(项目|经历|工作|实习|技能|技术|教育|证书|作品|链接|github|portfolio|demo|agent|rag|llm|ai|prompt|自动化|数据|产品|运营|增长|负责|完成|搭建|优化|上线|指标|提升|转化|留存|营收|用户|获奖|本科|硕士|博士)/i;

function normalizeText(text: string): string {
  return text
    .replace(/\r\n?/g, "\n")
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n{4,}/g, "\n\n\n")
    .trim();
}

function uniqueLines(lines: string[], maxLines: number): string[] {
  const seen = new Set<string>();
  const result: string[] = [];
  for (const line of lines) {
    const normalized = line.trim().replace(/\s+/g, " ");
    if (!normalized || seen.has(normalized)) continue;
    seen.add(normalized);
    result.push(line);
    if (result.length >= maxLines) break;
  }
  return result;
}

export function compactResumeForAnalysis(
  resumeContent: string,
  maxChars = DEFAULT_MAX_CHARS,
): { content: string; originalLength: number; compacted: boolean } {
  const raw = normalizeText(resumeContent);
  if (raw.length <= maxChars) {
    return { content: raw, originalLength: raw.length, compacted: false };
  }

  const lines = raw
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);
  const important = uniqueLines(
    lines.filter((line) => IMPORTANT_LINE.test(line) && line.length <= 260),
    90,
  ).join("\n");

  const marker = `\n\n[长简历已压缩用于稳定传输：原文 ${raw.length} 字。以下保留开头、关键经历/技能行和结尾。]\n\n`;
  const budget = Math.max(1000, maxChars - marker.length - important.length);
  const head = Math.floor(budget * 0.55);
  const tail = budget - head;

  const content = normalizeText(
    [
      raw.slice(0, head),
      marker,
      important ? `关键片段：\n${important}` : "",
      "\n\n简历结尾：\n",
      raw.slice(-tail),
    ].join(""),
  ).slice(0, maxChars);

  return {
    content,
    originalLength: raw.length,
    compacted: true,
  };
}
