import {
  ALL_EVIDENCE_CATEGORIES,
  EVIDENCE_CATEGORY_LABELS,
  inferRoleFamily,
  weightedReadiness,
} from "@/lib/evidence/scoreCategories";
import { extractSkillsFromText, skillOverlap } from "@/lib/profile/skillOntology";
import type {
  CandidateEvidenceScore,
  EvidenceCategory,
  ProofCheckResult,
  StructuredResume,
} from "@/types/resume";

export type RuleEvidenceInput = {
  structured: StructuredResume;
  targetRole: string;
  targetJobDescription?: string;
  marketJobContext?: string;
  proofChecks?: ProofCheckResult[];
};

function clamp(n: number) {
  return Math.min(100, Math.max(0, Math.round(n)));
}

/**
 * Deterministic evidence scores — candidate-friendly risks (not HR deductions).
 */
export function buildRuleEvidenceScores(
  input: RuleEvidenceInput,
): CandidateEvidenceScore[] {
  const { structured, targetRole, targetJobDescription, marketJobContext } =
    input;
  const roleHay = `${targetRole}\n${targetJobDescription || ""}\n${marketJobContext || ""}`;
  const roleSkills = extractSkillsFromText(roleHay);
  const resumeSkills = structured.skills.map((s) => s.name);
  const overlap = skillOverlap(
    resumeSkills,
    roleSkills.length > 0 ? roleSkills : resumeSkills.slice(0, 8),
  );

  // ── skill_coverage ──
  const skillCoverage =
    roleSkills.length === 0
      ? clamp(40 + resumeSkills.length * 5)
      : clamp(overlap.coverage);
  const skillEvidence: string[] = [];
  for (const s of structured.skills.slice(0, 6)) {
    if (s.evidence) skillEvidence.push(`「${s.name}」：${s.evidence}`);
    else skillEvidence.push(`简历技能标签：${s.name}`);
  }
  if (overlap.matched.length) {
    skillEvidence.unshift(
      `与目标相关命中：${overlap.matched.slice(0, 6).join("、")}`,
    );
  }
  const skillRisks: string[] = [];
  const skillActions: string[] = [];
  if (overlap.missing.length > 0) {
    skillRisks.push(
      `目标/JD 常见要求中，以下能力在简历证据不足：${overlap.missing.slice(0, 5).join("、")}`,
    );
    skillActions.push(
      `优先补齐或证明：${overlap.missing.slice(0, 3).join("、")}（用真实项目，勿虚构）`,
    );
  }
  // skill keyword without project evidence
  const projectTech = new Set(
    structured.projects.flatMap((p) => p.tech.map((t) => t.toLowerCase())),
  );
  const orphanSkills = resumeSkills.filter(
    (s) => !projectTech.has(s.toLowerCase()) && !structured.work.some((w) =>
      w.tech.some((t) => t.toLowerCase() === s.toLowerCase()),
    ),
  );
  if (orphanSkills.length >= 2) {
    skillRisks.push(
      `部分技能（如 ${orphanSkills.slice(0, 3).join("、")}）出现在技能区，但缺少对应项目/工作证据`,
    );
    skillActions.push("把关键技能写进 1–2 个项目的技术栈与职责描述");
  }

  // ── project_depth ──
  const projects = structured.projects;
  let projectScore = 35;
  const projectEvidence: string[] = [];
  const projectRisks: string[] = [];
  const projectActions: string[] = [];
  if (projects.length === 0) {
    projectRisks.push("简历中可识别的项目较少，难以证明独立交付能力");
    projectActions.push("补充 1–2 个可演示项目，写清目标、方案、结果");
  } else {
    projectScore += Math.min(25, projects.length * 10);
    for (const p of projects.slice(0, 4)) {
      projectEvidence.push(
        `项目「${p.name}」${p.tech.length ? `（${p.tech.slice(0, 4).join("、")}）` : ""}${p.impact ? `：${p.impact}` : ""}`,
      );
    }
    const withMetrics = projects.filter((p) => p.metrics || /%|提升|降低|用户|万|qps/i.test(p.impact || ""));
    if (withMetrics.length === 0) {
      projectScore -= 12;
      projectRisks.push("项目描述偏技术堆叠，缺少业务结果或量化指标");
      projectActions.push("为每个重点项目补充可验证结果（指标、用户、效率、质量）");
    } else {
      projectScore += 12;
      projectEvidence.push(
        `含结果信号的项目：${withMetrics.map((p) => p.name).join("、")}`,
      );
    }
    const withUrl = projects.filter((p) => p.url);
    if (withUrl.length === 0 && projects.length > 0) {
      projectRisks.push("项目没有链接，可信度偏弱，招聘方难以核实");
      projectActions.push("补充 GitHub / Demo / 作品集链接（真实可访问）");
    }
  }
  projectScore = clamp(projectScore);

  // ── production_experience ──
  const work = structured.work;
  let prodScore = 30;
  const prodEvidence: string[] = [];
  const prodRisks: string[] = [];
  const prodActions: string[] = [];
  if (work.length === 0) {
    prodRisks.push(
      "缺少明确在职/实习经历信号，可能被视作课程或练习项目为主",
    );
    prodActions.push("若有正式/实习经历，补充团队角色、协作与线上稳定性描述");
  } else {
    prodScore += Math.min(30, work.length * 12);
    for (const w of work.slice(0, 3)) {
      prodEvidence.push(
        [w.company, w.title, ...(w.highlights || []).slice(0, 1)]
          .filter(Boolean)
          .join(" · "),
      );
    }
  }
  const years = structured.basics.yearsTotal;
  if (years != null) {
    prodScore += Math.min(20, years * 5);
    prodEvidence.push(`简历估算约 ${years} 年经验`);
  }
  const prodSignals = /上线|生产|稳定性|值班|sla|协作|跨部门|客户|交付/i.test(
    `${structured.basics.summary || ""} ${work.flatMap((w) => w.highlights).join(" ")} ${projects.map((p) => p.impact).join(" ")}`,
  );
  if (prodSignals) {
    prodScore += 10;
    prodEvidence.push("文中含上线/协作/交付类信号");
  } else if (projects.length > 0 && work.length === 0) {
    prodRisks.push("JD 若要求生产经验，当前简历更偏个人/课程项目叙事");
    prodActions.push("补充生产环境问题、协作边界或线上运维相关真实经历");
  }
  prodScore = clamp(prodScore);

  // ── proof_assets ──
  const links = [
    ...(structured.basics.links || []),
    ...structured.projects.map((p) => p.url).filter(Boolean) as string[],
    ...structured.profiles.map((p) => p.url),
  ];
  const checks = input.proofChecks || [];
  let proofScore = 25;
  const proofEvidence: string[] = [];
  const proofRisks: string[] = [];
  const proofActions: string[] = [];
  if (links.length === 0 && checks.length === 0) {
    proofRisks.push("未提供 GitHub / Demo / 作品集链接，证明资产偏弱");
    proofActions.push("补充可访问的作品链接，支撑简历卖点");
  } else {
    proofScore += Math.min(30, links.length * 10);
    proofEvidence.push(`简历/表单中发现 ${links.length || checks.length} 个链接线索`);
  }
  const reachable = checks.filter((c) => c.reachable);
  if (checks.length > 0) {
    if (reachable.length > 0) {
      proofScore += Math.min(35, reachable.length * 15);
      proofEvidence.push(
        `可访问链接：${reachable.map((c) => c.kind).join("、")}`,
      );
    }
    const dead = checks.filter((c) => !c.reachable);
    if (dead.length > 0) {
      proofScore -= 10;
      proofRisks.push(`部分链接暂时无法访问：${dead.map((d) => d.url).slice(0, 2).join("、")}`);
      proofActions.push("检查并修复失效链接");
    }
    if (checks.some((c) => c.kind === "github" && c.reachable)) {
      proofScore += 8;
      proofEvidence.push("GitHub 链接可访问（技术岗加分信号）");
    }
  }
  proofScore = clamp(proofScore);

  // ── role_fit ──
  const family = inferRoleFamily(targetRole);
  let fitScore = 40;
  const fitEvidence: string[] = [];
  const fitRisks: string[] = [];
  const fitActions: string[] = [];
  const roleTokens = targetRole
    .toLowerCase()
    .split(/[\s/|，,、+\-]+/)
    .filter((t) => t.length >= 2);
  const narrative = [
    structured.basics.summary || "",
    ...projects.map((p) => p.name),
    ...work.map((w) => w.title || ""),
  ]
    .join(" ")
    .toLowerCase();
  let tokenHits = 0;
  for (const t of roleTokens) {
    if (narrative.includes(t) || resumeSkills.some((s) => s.toLowerCase().includes(t))) {
      tokenHits += 1;
    }
  }
  if (roleTokens.length > 0) {
    fitScore = clamp(35 + (tokenHits / roleTokens.length) * 50);
    fitEvidence.push(
      `目标岗关键词命中 ${tokenHits}/${roleTokens.length}（${targetRole}）`,
    );
  }
  fitScore = clamp(
    fitScore * 0.55 + skillCoverage * 0.25 + projectScore * 0.2,
  );
  if (tokenHits === 0 && targetRole.trim()) {
    fitRisks.push("简历目标叙事与目标岗位名称一致性偏弱");
    fitActions.push("在摘要与项目标题中对齐目标岗位关键词（保持真实）");
  }
  if (overlap.matched.length >= 3) {
    fitEvidence.push(`技能与岗位要求重叠：${overlap.matched.slice(0, 5).join("、")}`);
  }

  const byCat: Record<EvidenceCategory, CandidateEvidenceScore> = {
    skill_coverage: {
      category: "skill_coverage",
      label: EVIDENCE_CATEGORY_LABELS.skill_coverage,
      score: skillCoverage,
      max: 100,
      evidence: skillEvidence.slice(0, 5),
      risks: skillRisks,
      nextActions: skillActions,
    },
    project_depth: {
      category: "project_depth",
      label: EVIDENCE_CATEGORY_LABELS.project_depth,
      score: projectScore,
      max: 100,
      evidence: projectEvidence.slice(0, 5),
      risks: projectRisks,
      nextActions: projectActions,
    },
    production_experience: {
      category: "production_experience",
      label: EVIDENCE_CATEGORY_LABELS.production_experience,
      score: prodScore,
      max: 100,
      evidence: prodEvidence.filter(Boolean).slice(0, 5),
      risks: prodRisks,
      nextActions: prodActions,
    },
    proof_assets: {
      category: "proof_assets",
      label: EVIDENCE_CATEGORY_LABELS.proof_assets,
      score: proofScore,
      max: 100,
      evidence: proofEvidence.slice(0, 5),
      risks: proofRisks,
      nextActions: proofActions,
    },
    role_fit: {
      category: "role_fit",
      label: EVIDENCE_CATEGORY_LABELS.role_fit,
      score: fitScore,
      max: 100,
      evidence: fitEvidence.slice(0, 5),
      risks: fitRisks,
      nextActions: fitActions,
    },
  };

  // Ensure each has at least one evidence line
  for (const cat of ALL_EVIDENCE_CATEGORIES) {
    if (byCat[cat].evidence.length === 0) {
      byCat[cat].evidence.push("基于当前简历结构化结果的规则估算");
    }
  }

  void family;
  return ALL_EVIDENCE_CATEGORIES.map((c) => byCat[c]);
}

export function readinessFromEvidenceScores(
  scores: CandidateEvidenceScore[],
  targetRole: string,
): number {
  const map = Object.fromEntries(
    scores.map((s) => [s.category, s.score]),
  ) as Record<EvidenceCategory, number>;
  return weightedReadiness(map, inferRoleFamily(targetRole));
}

export function collectRiskFlags(scores: CandidateEvidenceScore[]): string[] {
  const risks = scores.flatMap((s) => s.risks);
  return [...new Set(risks)].slice(0, 8);
}

export function collectNextActions(scores: CandidateEvidenceScore[]): string[] {
  const actions = scores.flatMap((s) => s.nextActions);
  return [...new Set(actions)].slice(0, 8);
}
