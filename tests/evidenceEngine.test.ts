import { describe, expect, it } from "vitest";
import { ensureEvidenceScores } from "@/lib/evidence/blendScores";
import {
  buildRuleEvidenceScores,
  collectRiskFlags,
  readinessFromEvidenceScores,
} from "@/lib/evidence/ruleEvidenceScores";
import { structuredResumeFromRules } from "@/lib/resume/fromRules";
import { toResumeProfile } from "@/lib/resume/toResumeProfile";
import { fallbackSkillGap } from "@/lib/ai/fallback/skillGap";

const SAMPLE = `
张三 | 北京 | 2年经验
技能：Python、RAG、LangChain、React、Docker
项目经历：
1. 企业知识库问答系统
使用 RAG 与向量检索，提升准确率 30%
2. AI Agent 工作流
Function Calling 与工具编排
https://github.com/example/rag-demo
`.padEnd(120, "。");

describe("evidence engine", () => {
  it("rules structured resume has skills and projects", () => {
    const s = structuredResumeFromRules(SAMPLE, { preferredLocation: "北京" });
    expect(s.source).toBe("rules");
    expect(s.skills.length).toBeGreaterThanOrEqual(3);
    expect(s.projects.length).toBeGreaterThanOrEqual(1);
    const profile = toResumeProfile(s);
    expect(profile.skillNames).toEqual(expect.arrayContaining(["Python", "RAG"]));
  });

  it("rule evidence scores always return 5 categories", () => {
    const structured = structuredResumeFromRules(SAMPLE);
    const scores = buildRuleEvidenceScores({
      structured,
      targetRole: "RAG 工程师",
      targetJobDescription: "Python RAG Embedding 评测",
    });
    expect(scores).toHaveLength(5);
    for (const s of scores) {
      expect(s.score).toBeGreaterThanOrEqual(0);
      expect(s.score).toBeLessThanOrEqual(100);
      expect(s.evidence.length).toBeGreaterThan(0);
    }
    const readiness = readinessFromEvidenceScores(scores, "RAG 工程师");
    expect(readiness).toBeGreaterThan(20);
    expect(collectRiskFlags(scores).length).toBeGreaterThanOrEqual(0);
  });

  it("no project links raises proof / project risks", () => {
    const bare = structuredResumeFromRules(
      "技能 Python Java\n做过一些练习。".padEnd(120, "。"),
    );
    const scores = buildRuleEvidenceScores({
      structured: bare,
      targetRole: "后端工程师",
    });
    const risks = collectRiskFlags(scores);
    expect(risks.some((r) => /链接|项目|证据/i.test(r))).toBe(true);
  });

  it("ensureEvidenceScores fills missing categories", () => {
    const structured = structuredResumeFromRules(SAMPLE);
    const rule = buildRuleEvidenceScores({
      structured,
      targetRole: "AI Agent 开发",
    });
    const blended = ensureEvidenceScores(rule, [
      {
        category: "skill_coverage",
        label: "技能覆盖",
        score: 90,
        max: 100,
        evidence: ["LLM 说命中很多技能"],
        risks: [],
        nextActions: [],
      },
    ]);
    expect(blended).toHaveLength(5);
    expect(blended.find((s) => s.category === "skill_coverage")?.evidence.length).toBeGreaterThan(
      0,
    );
  });

  it("fallback skill gap includes evidenceScores", () => {
    const structured = structuredResumeFromRules(SAMPLE);
    const result = fallbackSkillGap(
      {
        resumeContent: SAMPLE,
        targetRole: "RAG 工程师",
        preferredLanguage: "Chinese",
        targetJobDescription: "需要 Python RAG 评测",
      },
      "missing_key",
      { structured },
    );
    expect(result.evidenceScores?.length).toBe(5);
    expect(result.riskFlags).toBeDefined();
    expect(result.nextActions?.length).toBeGreaterThan(0);
    expect(result.readinessScore).toBeGreaterThan(0);
  });
});
