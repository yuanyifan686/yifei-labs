type ClassValue = string | false | null | undefined;

export function cn(...inputs: ClassValue[]) {
  return inputs.filter(Boolean).join(" ");
}

export function formatDate(value: string | Date) {
  return new Intl.DateTimeFormat("zh-CN", {
    year: "numeric",
    month: "short",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

export function slugify(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)+/g, "");
}

export function matchLabel(score: number) {
  if (score >= 90) return "极高匹配";
  if (score >= 80) return "强匹配";
  if (score >= 70) return "良好匹配";
  if (score >= 60) return "可尝试";
  return "弱匹配";
}

export function matchTone(score: number) {
  if (score >= 90) return "bg-emerald-400/10 text-emerald-300 border-emerald-400/30";
  if (score >= 80) return "bg-cyan-400/10 text-cyan-200 border-cyan-400/30";
  if (score >= 70) return "bg-amber-400/10 text-amber-200 border-amber-400/30";
  if (score >= 60) return "bg-orange-400/10 text-orange-200 border-orange-400/30";
  return "bg-white/5 text-slate-300 border-white/10";
}

export function buildOptimizationMarkdown(
  roleTitle: string,
  matchScore: number,
  keyImprovements: string[],
  missingKeywords: string[],
  optimizedResume: string,
) {
  return `# 优化版简历

## 目标岗位
${roleTitle}

## 匹配度
${matchScore}%

## 主要优化点
${keyImprovements.map((item) => `- ${item}`).join("\n")}

## 建议补充关键词
${missingKeywords.map((item) => `- ${item}`).join("\n")}

## 简历正文
${optimizedResume}
`;
}
