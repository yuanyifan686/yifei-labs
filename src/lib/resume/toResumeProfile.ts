import type { ResumeProfile, ResumeProject, ResumeSkill } from "@/types/jobMatch";
import type { StructuredResume } from "@/types/resume";

export function toResumeProfile(structured: StructuredResume): ResumeProfile {
  const skills: ResumeSkill[] = structured.skills.map((s) => ({
    name: s.name,
    level: s.level,
    evidence: s.evidence,
  }));
  const skillNames = skills.map((s) => s.name);
  const projects: ResumeProject[] = structured.projects.map((p) => ({
    name: p.name,
    impact: p.impact || p.metrics,
    tech: p.tech || [],
  }));

  const domains = inferDomainsFromStructured(structured);

  return {
    skills,
    skillNames,
    yearsTotal: structured.basics.yearsTotal,
    domains,
    projects,
    education: structured.education
      .map((e) =>
        [e.institution, e.degree, e.field, e.year].filter(Boolean).join(" · "),
      )
      .filter(Boolean)
      .slice(0, 4),
    preferredLocations: structured.basics.locations || [],
    rawTextHash: structured.rawTextHash,
    summaryLine: structured.summaryLine,
  };
}

function inferDomainsFromStructured(s: StructuredResume): string[] {
  const hay = [
    s.basics.summary || "",
    s.basics.headline || "",
    ...s.skills.map((x) => x.name),
    ...s.projects.flatMap((p) => [p.name, ...p.tech]),
    ...s.work.flatMap((w) => [w.title || "", ...(w.tech || [])]),
  ]
    .join(" ")
    .toLowerCase();

  const catalog: Array<[RegExp, string]> = [
    [/llm|大模型|生成式|aigc/, "大模型应用"],
    [/agent|智能体/, "AI Agent"],
    [/rag|知识库|向量|embedding/, "RAG / 知识库"],
    [/react|vue|next|前端/, "前端工程"],
    [/后端|微服务|fastapi|spring/, "后端工程"],
    [/产品|prd|roadmap/, "产品"],
    [/数据工程|spark|flink/, "数据工程"],
    [/算法|机器学习|深度学习/, "算法"],
  ];
  const found: string[] = [];
  for (const [re, label] of catalog) {
    if (re.test(hay)) found.push(label);
  }
  return found.slice(0, 8);
}
