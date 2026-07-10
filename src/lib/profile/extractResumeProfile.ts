import { createHash } from "crypto";
import {
  extractSkillsFromText,
  normalizeSkillTags,
} from "@/lib/profile/skillOntology";
import { ResumeProfile, ResumeProject, ResumeSkill } from "@/types/jobMatch";

function hashText(text: string) {
  return createHash("sha256").update(text.trim()).digest("hex").slice(0, 16);
}

function estimateYears(text: string): number | undefined {
  const patterns = [
    /(\d+(?:\.\d+)?)\s*\+?\s*年(?:工作)?经验/,
    /(\d+(?:\.\d+)?)\s*\+?\s*years?\s+(?:of\s+)?experience/i,
    /经验[：:]\s*(\d+(?:\.\d+)?)\s*年/,
  ];
  for (const re of patterns) {
    const m = text.match(re);
    if (m) {
      const n = Number(m[1]);
      if (Number.isFinite(n) && n >= 0 && n <= 40) return n;
    }
  }
  return undefined;
}

function extractDomains(text: string): string[] {
  const catalog: Array<[RegExp, string]> = [
    [/大模型|llm|生成式|aigc/i, "大模型应用"],
    [/agent|智能体/i, "AI Agent"],
    [/rag|知识库|向量/i, "RAG / 知识库"],
    [/推荐|搜索|检索/i, "搜索推荐"],
    [/前端|react|vue|next/i, "前端工程"],
    [/后端|服务端|微服务/i, "后端工程"],
    [/全栈|fullstack|full-stack/i, "全栈工程"],
    [/数据工程|spark|flink|数仓|etl/i, "数据工程"],
    [/数据分析|bi|tableau|指标/i, "数据分析"],
    [/算法|机器学习|深度学习|ml\b/i, "算法"],
    [/产品经理|prd|roadmap|需求/i, "产品"],
    [/ui|ux|交互设计|figma/i, "设计"],
    [/运营|增长|社群|内容运营/i, "运营"],
    [/金融|风控|投研/i, "金融科技"],
    [/电商|零售|供应链/i, "电商"],
    [/教育|教学|在线课程/i, "教育科技"],
    [/机器人|具身/i, "具身智能"],
    [/devops|k8s|kubernetes|运维|sre/i, "基础设施"],
    [/测试|qa|质量保障|自动化测试/i, "质量工程"],
    [/项目管理|scrum|敏捷交付/i, "项目管理"],
  ];
  const found: string[] = [];
  for (const [re, label] of catalog) {
    if (re.test(text)) found.push(label);
  }
  return found.slice(0, 8);
}

function extractEducation(text: string): string[] {
  const lines = text.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
  const edu: string[] = [];
  const eduRe =
    /(大学|学院|Bachelor|Master|PhD|本科|硕士|博士|专科|University|College)/i;
  for (const line of lines) {
    if (eduRe.test(line) && line.length <= 80) {
      edu.push(line);
    }
  }
  return edu.slice(0, 4);
}

function extractProjects(text: string): ResumeProject[] {
  const blocks = text.split(
    /\n(?=\s*(?:项目(?:经历|经验)?|实习经历|工作经历|作品集|负责模块|Project|Experience|•|·|\d+[\).、]))/i,
  );
  const projects: ResumeProject[] = [];

  for (const block of blocks) {
    const lines = block
      .split(/\r?\n/)
      .map((l) => l.trim())
      .filter(Boolean);
    if (lines.length === 0) continue;
    const head = lines[0];
    if (
      !/项目|project|系统|平台|引擎|助手|agent|实习|作品|模块|experience/i.test(head) &&
      lines.length < 2
    ) {
      continue;
    }
    if (head.length > 100) continue;
    const body = lines.slice(0, 8).join(" ");
    const tech = extractSkillsFromText(body).slice(0, 8);
    if (
      tech.length === 0 &&
      !/项目|project|实习|作品|系统|平台/i.test(head)
    ) {
      continue;
    }

    projects.push({
      name: head
        .replace(/^(项目(?:经历|经验)?|实习经历|作品集|负责模块|Project|Experience)[:：\s]*/i, "")
        .slice(0, 60),
      impact: lines
        .find((l) => /提升|增长|降低|优化|落地|上线|负责|主导|%|倍|完成/.test(l))
        ?.slice(0, 120),
      tech,
    });
    if (projects.length >= 8) break;
  }

  return projects;
}

function extractLocations(text: string, preferred?: string): string[] {
  const cities = [
    "北京",
    "上海",
    "深圳",
    "杭州",
    "广州",
    "成都",
    "南京",
    "武汉",
    "西安",
    "苏州",
    "远程",
    "Remote",
  ];
  const found = cities.filter((c) => text.includes(c));
  if (preferred?.trim()) found.unshift(preferred.trim());
  return [...new Set(found)].slice(0, 6);
}

/**
 * Rule-based resume profile extraction.
 * Fast, deterministic, no API — used as matching pipeline stage 1.
 */
export function extractResumeProfile(
  resumeContent: string,
  options?: { preferredLocation?: string },
): ResumeProfile {
  const text = resumeContent.trim();
  const skillNames = normalizeSkillTags(extractSkillsFromText(text));
  const skills: ResumeSkill[] = skillNames.map((name) => {
    const idx = text.toLowerCase().indexOf(name.toLowerCase());
    let evidence: string | undefined;
    if (idx >= 0) {
      const start = Math.max(0, idx - 20);
      const end = Math.min(text.length, idx + name.length + 40);
      evidence = text.slice(start, end).replace(/\s+/g, " ").trim();
    }
    return { name, evidence };
  });

  const yearsTotal = estimateYears(text);
  const domains = extractDomains(text);
  const projects = extractProjects(text);
  const education = extractEducation(text);
  const preferredLocations = extractLocations(text, options?.preferredLocation);

  // Weak profile fallback: if skills empty, surface domains/education so matching is not zeroed
  const weakHints: string[] = [];
  if (skillNames.length === 0) {
    if (domains.length) weakHints.push(...domains.slice(0, 3));
    if (education.length) weakHints.push("教育背景可识别");
    if (projects.length) weakHints.push(...projects.flatMap((p) => p.tech).slice(0, 4));
  }

  const summaryParts = [
    skillNames.length > 0 ? `核心技能 ${skillNames.slice(0, 6).join("、")}` : null,
    skillNames.length === 0 && weakHints.length > 0
      ? `弱画像 ${weakHints.slice(0, 4).join("、")}`
      : null,
    yearsTotal != null ? `约 ${yearsTotal} 年经验` : null,
    domains.length > 0 ? `方向 ${domains.slice(0, 3).join(" / ")}` : null,
    projects.length > 0 ? `${projects.length} 个可识别项目` : null,
    education.length > 0 ? `教育 ${education[0].slice(0, 24)}` : null,
  ].filter(Boolean);

  return {
    skills,
    skillNames,
    yearsTotal,
    domains,
    projects,
    education,
    preferredLocations,
    rawTextHash: hashText(text),
    summaryLine:
      summaryParts.length > 0
        ? summaryParts.join(" · ")
        : "已解析简历文本，技能标签较少，建议补充技术栈与项目关键词。",
  };
}

export function profileToPromptBlock(profile: ResumeProfile): string {
  return [
    `技能：${profile.skillNames.join("、") || "（未识别）"}`,
    profile.yearsTotal != null ? `年限估算：${profile.yearsTotal}` : null,
    `方向：${profile.domains.join("、") || "（未识别）"}`,
    `项目：${
      profile.projects
        .map((p) => `${p.name}[${p.tech.join("/")}]`)
        .join("；") || "（未识别）"
    }`,
    `地点信号：${profile.preferredLocations.join("、") || "（未识别）"}`,
  ]
    .filter(Boolean)
    .join("\n");
}
