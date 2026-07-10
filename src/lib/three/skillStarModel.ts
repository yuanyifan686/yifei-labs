import {
  JobMatch,
  MatchScoreDimensions,
  ResumeProfile,
  SkillCoverageCell,
  SkillGapAnalysisResult,
} from "@/types/jobMatch";

export type SkillNodeStatus =
  | "hub"
  | "covered"
  | "weak"
  | "missing"
  | "dimension";

export type SkillStarNode = {
  id: string;
  label: string;
  status: SkillNodeStatus;
  /** 0–100 influences sphere radius */
  score?: number;
  evidence?: string;
  inResume?: boolean;
  inJd?: boolean;
  inMarket?: boolean;
  actionHint?: string;
};

export type SkillStarLink = {
  source: string;
  target: string;
};

export type SkillStarGraphModel = {
  nodes: SkillStarNode[];
  links: SkillStarLink[];
  title: string;
  subtitle?: string;
};

const MAX_SKILL_NODES = 16;

function cleanLabel(raw: string) {
  return raw
    .replace(/^(简历中已体现|建议补充或强化|岗位要求|岗位可能要求|市场常见要求)[:：\s]*/i, "")
    .replace(/，简历证据不足|，简历中体现不足/g, "")
    .trim()
    .slice(0, 28);
}

function nodeId(prefix: string, label: string) {
  return `${prefix}:${label.toLowerCase()}`;
}

function uniqByLabel(nodes: SkillStarNode[]) {
  const map = new Map<string, SkillStarNode>();
  for (const n of nodes) {
    const key = n.label.toLowerCase();
    const prev = map.get(key);
    if (!prev) {
      map.set(key, n);
      continue;
    }
    // Prefer stronger status: missing > weak > covered for visibility of gaps
    const rank = { missing: 3, weak: 2, covered: 1, hub: 0, dimension: 0 };
    if ((rank[n.status] || 0) > (rank[prev.status] || 0)) {
      map.set(key, n);
    }
  }
  return [...map.values()];
}

function dimensionNodes(dims?: MatchScoreDimensions): SkillStarNode[] {
  if (!dims) return [];
  return [
    { id: "dim:skill", label: "技能覆盖", status: "dimension", score: dims.skillCoverage },
    { id: "dim:direction", label: "方向契合", status: "dimension", score: dims.directionFit },
    { id: "dim:exp", label: "经验匹配", status: "dimension", score: dims.experienceFit },
    { id: "dim:loc", label: "地点匹配", status: "dimension", score: dims.locationFit },
  ];
}

function matrixNodes(matrix: SkillCoverageCell[]): SkillStarNode[] {
  return matrix.slice(0, MAX_SKILL_NODES).map((cell) => ({
    id: nodeId("skill", cell.skill),
    label: cell.skill,
    status: cell.status,
    score:
      cell.status === "covered" ? 86 : cell.status === "weak" ? 62 : 40,
    inResume: cell.inResume,
    inJd: cell.inTargetJd,
    inMarket: cell.inMarket,
    evidence: [
      cell.inResume ? "简历有信号" : "简历未见",
      cell.inTargetJd ? "目标 JD 要求" : null,
      cell.inMarket ? "市场样本常见" : null,
    ]
      .filter(Boolean)
      .join(" · "),
    actionHint:
      cell.status === "missing"
        ? "建议优先补齐项目证据或学习该技能"
        : cell.status === "weak"
          ? "可在简历中强化表述与量化结果"
          : "保持并在面试中准备案例",
  }));
}

/** Build star graph for job-bank match mode around selected role. */
export function buildMatchSkillStar(
  role: JobMatch | null | undefined,
  profile?: ResumeProfile | null,
  aggregateGaps?: string[] | null,
): SkillStarGraphModel | null {
  if (!role) return null;

  const hub: SkillStarNode = {
    id: "hub",
    label: role.title.slice(0, 18),
    status: "hub",
    score: role.matchScore,
    evidence: role.reason,
    actionHint: "当前选中岗位 · 可作为投递优先级参考",
  };

  const covered = (role.matchedKeywords || []).map((k) => {
    const label = cleanLabel(k);
    return {
      id: nodeId("skill", label),
      label,
      status: "covered" as const,
      score: 82,
      inResume: true,
      evidence: "简历与岗位关键词重合",
      actionHint: "面试时准备对应项目故事",
    };
  });

  const missingFromGaps = (role.gaps || []).map((g) => {
    const label = cleanLabel(g);
    return {
      id: nodeId("skill", label),
      label,
      status: "missing" as const,
      score: 38,
      inResume: false,
      evidence: g,
      actionHint: "可一键能力诊断，生成补齐路径",
    };
  });

  const missingFromAgg = (aggregateGaps || []).map((g) => {
    const label = cleanLabel(g);
    return {
      id: nodeId("skill", label),
      label,
      status: "missing" as const,
      score: 36,
      evidence: "跨岗高频短板",
      actionHint: "优先在学习计划中覆盖",
    };
  });

  const weakFromProfile = (profile?.skillNames || [])
    .filter(
      (s) =>
        !(role.matchedKeywords || []).some(
          (m) => m.toLowerCase() === s.toLowerCase(),
        ),
    )
    .slice(0, 6)
    .map((s) => ({
      id: nodeId("skill", s),
      label: s,
      status: "weak" as const,
      score: 58,
      inResume: true,
      evidence: "简历具备，与该岗位关联偏弱",
      actionHint: "可在项目描述中主动对齐岗位要求",
    }));

  const fromTags = (role.skillTags || []).slice(0, 8).map((s) => {
    const hit = (role.matchedKeywords || []).some(
      (m) => m.toLowerCase() === s.toLowerCase(),
    );
    return {
      id: nodeId("skill", s),
      label: s,
      status: (hit ? "covered" : "weak") as SkillNodeStatus,
      score: hit ? 80 : 55,
      inResume: hit,
      evidence: hit ? "技能标签命中" : "岗位技能标签",
    };
  });

  let skills = uniqByLabel([
    ...covered,
    ...missingFromGaps,
    ...missingFromAgg,
    ...fromTags,
    ...weakFromProfile,
  ]).slice(0, MAX_SKILL_NODES);

  if (skills.length === 0) {
    skills = [
      {
        id: "skill:placeholder",
        label: "补充技能关键词",
        status: "weak",
        score: 50,
        evidence: "当前岗位关键词较少",
      },
    ];
  }

  const dims = dimensionNodes(role.scoreDimensions);
  const nodes = [hub, ...skills, ...dims];
  const links: SkillStarLink[] = [
    ...skills.map((s) => ({ source: "hub", target: s.id })),
    ...dims.map((d) => ({ source: "hub", target: d.id })),
  ];

  return {
    nodes,
    links,
    title: "技能星图 · 岗位匹配",
    subtitle: `${role.title} · 匹配度 ${role.matchScore}%`,
  };
}

/** Build star graph for market-fit / skill-gap diagnosis. */
export function buildGapSkillStar(
  gap: SkillGapAnalysisResult | null | undefined,
  profile?: ResumeProfile | null,
): SkillStarGraphModel | null {
  if (!gap) return null;

  const hub: SkillStarNode = {
    id: "hub",
    label: gap.targetRole.slice(0, 18),
    status: "hub",
    score: gap.readinessScore,
    evidence: gap.summary,
    actionHint: "目标岗位诊断中心",
  };

  let skills: SkillStarNode[] = [];

  if (gap.skillMatrix && gap.skillMatrix.length > 0) {
    skills = matrixNodes(gap.skillMatrix);
  } else {
    const covered = (gap.matchedStrengths || []).map((s) => {
      const label = cleanLabel(s);
      return {
        id: nodeId("skill", label),
        label,
        status: "covered" as const,
        score: 84,
        inResume: true,
        evidence: s,
      };
    });
    const missing = (gap.missingSkills || []).map((s) => {
      const label = cleanLabel(s);
      return {
        id: nodeId("skill", label),
        label,
        status: "missing" as const,
        score: 40,
        inResume: false,
        evidence: s,
        actionHint: "可生成 30 天计划优先补齐",
      };
    });
    const weak = (profile?.skillNames || [])
      .filter(
        (n) =>
          !covered.some((c) => c.label.toLowerCase() === n.toLowerCase()) &&
          !missing.some((m) => m.label.toLowerCase() === n.toLowerCase()),
      )
      .slice(0, 5)
      .map((n) => ({
        id: nodeId("skill", n),
        label: n,
        status: "weak" as const,
        score: 60,
        inResume: true,
        evidence: "简历技能 · 目标关联待强化",
      }));
    skills = uniqByLabel([...covered, ...missing, ...weak]).slice(
      0,
      MAX_SKILL_NODES,
    );
  }

  const dims = dimensionNodes({
    skillCoverage: gap.readinessScore,
    experienceFit: gap.readinessScore,
    directionFit: gap.marketFitScore ?? gap.readinessScore,
    locationFit: 70,
    overall: gap.readinessScore,
  }).map((d) => {
    if (d.id === "dim:skill") return { ...d, score: gap.readinessScore, label: "准备度" };
    if (d.id === "dim:direction")
      return { ...d, score: gap.marketFitScore ?? gap.readinessScore, label: "市场匹配" };
    return d;
  });

  const nodes = [hub, ...skills, ...dims];
  const links: SkillStarLink[] = [
    ...skills.map((s) => ({ source: "hub", target: s.id })),
    ...dims.map((d) => ({ source: "hub", target: d.id })),
  ];

  return {
    nodes,
    links,
    title: "技能星图 · 能力诊断",
    subtitle: `${gap.targetRole} · 准备度 ${gap.readinessScore}%`,
  };
}

/** Layout positions for nodes: hub center, skills on disk, dimensions outer ring. */
export function layoutSkillStar(model: SkillStarGraphModel): Map<
  string,
  { x: number; y: number; z: number }
> {
  const pos = new Map<string, { x: number; y: number; z: number }>();
  pos.set("hub", { x: 0, y: 0, z: 0 });

  const skills = model.nodes.filter(
    (n) => n.status !== "hub" && n.status !== "dimension",
  );
  const dims = model.nodes.filter((n) => n.status === "dimension");

  const skillR = 2.4;
  skills.forEach((n, i) => {
    const t = (i / Math.max(skills.length, 1)) * Math.PI * 2;
    const wobble = ((i % 3) - 1) * 0.22;
    pos.set(n.id, {
      x: Math.cos(t) * skillR,
      y: Math.sin(t * 1.3) * 0.35 + wobble,
      z: Math.sin(t) * skillR,
    });
  });

  const dimR = 3.6;
  dims.forEach((n, i) => {
    const t = (i / Math.max(dims.length, 1)) * Math.PI * 2 + Math.PI / 4;
    pos.set(n.id, {
      x: Math.cos(t) * dimR,
      y: Math.sin(t) * 0.25,
      z: Math.sin(t) * dimR,
    });
  });

  return pos;
}
