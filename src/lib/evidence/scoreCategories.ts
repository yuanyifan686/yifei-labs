import type { EvidenceCategory } from "@/types/resume";

export const EVIDENCE_CATEGORY_LABELS: Record<EvidenceCategory, string> = {
  skill_coverage: "技能覆盖",
  project_depth: "项目深度",
  production_experience: "生产经验",
  proof_assets: "证明资产",
  role_fit: "岗位贴合",
};

export const ALL_EVIDENCE_CATEGORIES: EvidenceCategory[] = [
  "skill_coverage",
  "project_depth",
  "production_experience",
  "proof_assets",
  "role_fit",
];

/** Weights by coarse role family — sum ≈ 1 */
export type RoleFamily = "engineering" | "product" | "design" | "ops" | "general";

export const WEIGHTS_BY_FAMILY: Record<
  RoleFamily,
  Record<EvidenceCategory, number>
> = {
  engineering: {
    skill_coverage: 0.28,
    project_depth: 0.24,
    production_experience: 0.18,
    proof_assets: 0.12,
    role_fit: 0.18,
  },
  product: {
    skill_coverage: 0.18,
    project_depth: 0.22,
    production_experience: 0.2,
    proof_assets: 0.12,
    role_fit: 0.28,
  },
  design: {
    skill_coverage: 0.2,
    project_depth: 0.26,
    production_experience: 0.14,
    proof_assets: 0.22,
    role_fit: 0.18,
  },
  ops: {
    skill_coverage: 0.2,
    project_depth: 0.2,
    production_experience: 0.22,
    proof_assets: 0.1,
    role_fit: 0.28,
  },
  general: {
    skill_coverage: 0.24,
    project_depth: 0.22,
    production_experience: 0.18,
    proof_assets: 0.12,
    role_fit: 0.24,
  },
};

export function inferRoleFamily(targetRole: string): RoleFamily {
  const t = targetRole.toLowerCase();
  if (/产品|pm|product/.test(t)) return "product";
  if (/设计|design|ui|ux/.test(t)) return "design";
  if (/运营|增长|growth|marketing|市场/.test(t)) return "ops";
  if (
    /工程师|开发|engineer|backend|frontend|全栈|算法|rag|agent|数据|devops|sre/.test(
      t,
    )
  ) {
    return "engineering";
  }
  return "general";
}

export function weightedReadiness(
  scores: Record<EvidenceCategory, number>,
  family: RoleFamily,
): number {
  const w = WEIGHTS_BY_FAMILY[family];
  let sum = 0;
  for (const cat of ALL_EVIDENCE_CATEGORIES) {
    sum += (scores[cat] || 0) * w[cat];
  }
  return Math.min(100, Math.max(0, Math.round(sum)));
}
