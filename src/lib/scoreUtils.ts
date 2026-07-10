export function scoreText(score: number) {
  if (score >= 80) return "text-emerald-400";
  if (score >= 60) return "text-amber-300";
  return "text-red-400";
}

export function scoreBar(score: number) {
  if (score >= 80) return "score-fill-high";
  if (score >= 60) return "score-fill-mid";
  return "score-fill-low";
}

export function scoreHint(score: number) {
  if (score >= 80) return "竞争力较强";
  if (score >= 60) return "具备冲刺基础";
  return "建议优先补齐关键能力";
}
