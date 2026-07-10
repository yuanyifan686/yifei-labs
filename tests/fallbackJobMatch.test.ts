import { describe, expect, it } from "vitest";
import { fallbackJobMatch } from "@/lib/ai/fallback/jobMatch";
import { fallbackSkillGap } from "@/lib/ai/fallback/skillGap";

describe("fallbackJobMatch", () => {
  it("returns ranked roles with dimensions from keyword overlap", () => {
    const result = fallbackJobMatch(
      {
        fullName: "测试",
        currentStatus: "Employed",
        experienceLevel: "Junior",
        preferredLanguage: "Chinese",
        resumeContent:
          "熟悉 Python RAG LangChain React，做过知识库问答与 Agent 项目。" +
          "x".repeat(80),
        jobListContent: [
          "岗位：RAG 工程师\n公司：A\n要求：Python RAG 向量检索",
          "岗位：运营专员\n公司：B\n要求：内容运营 社群",
        ].join("\n\n"),
      },
      "missing_key",
    );

    expect(result.recommendedRoles.length).toBeGreaterThanOrEqual(1);
    expect(result.recommendedRoles[0].scoreDimensions).toBeDefined();
    expect(result.recommendedRoles[0].isSynthetic).toBe(true);
    expect(result.candidateSummary).toMatch(/API Key|关键词/);
  });
});

describe("fallbackSkillGap", () => {
  it("produces readiness and matrix without API", () => {
    const result = fallbackSkillGap(
      {
        resumeContent:
          "Python RAG Agent 开发两年，熟悉 LangChain 与向量数据库。" +
          "x".repeat(80),
        targetRole: "RAG 工程师",
        preferredLanguage: "Chinese",
        targetJobDescription: "需要 Python RAG Embedding 评测",
      },
      "missing_key",
    );
    expect(result.readinessScore).toBeGreaterThan(0);
    expect(result.skillMatrix?.length).toBeGreaterThan(0);
    expect(result.targetRole).toBe("RAG 工程师");
  });
});
