import { describe, expect, it } from "vitest";
import { buildRoleEvidence } from "@/lib/matching/roleEvidence";
import { scoreJobDimensions } from "@/lib/matching/scoreDimensions";
import { retrieveCandidates } from "@/lib/matching/retrieveCandidates";
import { extractResumeProfile } from "@/lib/profile/extractResumeProfile";
import type { StoredJob } from "@/types/jobMatch";

const sampleResume = `
张三 | 北京 | 2年经验
技能：Python、RAG、LangChain、React、Docker
项目经历：
1. 企业知识库问答系统
使用 RAG 与向量检索，提升客服回答准确率 30%
2. AI Agent 工作流平台
基于 Function Calling 与工具编排落地自动化流程
教育：某某大学 计算机 本科
`;

function fakeJob(partial: Partial<StoredJob> & { title: string }): StoredJob {
  return {
    id: partial.id || "j1",
    title: partial.title,
    company: partial.company || "示例公司",
    location: partial.location || "北京",
    salary: "20k-40k",
    platformStyle: "market",
    requirements: partial.requirements || "Python RAG Agent",
    description: partial.description || "AI 应用开发",
    keywords: partial.keywords || ["Python", "RAG", "Agent"],
    skillTags: partial.skillTags || ["Python", "RAG", "Agent"],
    relatedDirections: partial.relatedDirections || ["RAG / 知识库", "AI Agent"],
    source: "fallback",
    isSynthetic: true,
    batchId: "b1",
    createdAt: new Date().toISOString(),
  };
}

describe("extractResumeProfile", () => {
  it("extracts skills and projects from Chinese resume", () => {
    const profile = extractResumeProfile(sampleResume, {
      preferredLocation: "北京",
    });
    expect(profile.skillNames.length).toBeGreaterThanOrEqual(4);
    expect(profile.skillNames).toEqual(
      expect.arrayContaining(["Python", "RAG", "React"]),
    );
    expect(profile.projects.length).toBeGreaterThanOrEqual(1);
    expect(profile.preferredLocations).toContain("北京");
    expect(profile.rawTextHash).toHaveLength(16);
  });
});

describe("score + retrieve", () => {
  it("ranks related jobs higher", () => {
    const profile = extractResumeProfile(sampleResume);
    const jobs = [
      fakeJob({
        id: "rag",
        title: "RAG 知识库工程师",
        skillTags: ["Python", "RAG", "Embedding"],
        relatedDirections: ["RAG / 知识库"],
      }),
      fakeJob({
        id: "ops",
        title: "运营专员",
        requirements: "内容运营 社群",
        skillTags: ["Content Operations"],
        keywords: ["运营"],
        relatedDirections: ["运营"],
      }),
    ];

    const scored = jobs.map((job) => ({
      job,
      dims: scoreJobDimensions(profile, job, {
        experienceLevel: "Junior",
        preferredLocation: "北京",
      }),
    }));
    expect(scored[0].dims.overall).toBeGreaterThan(scored[1].dims.overall);

    const top = retrieveCandidates(profile, jobs, {
      limit: 2,
      directionTitles: ["RAG / 知识库"],
      experienceLevel: "Junior",
      preferredLocation: "北京",
    });
    expect(top[0].job.title).toMatch(/RAG|知识库/);
  });
});

describe("buildRoleEvidence", () => {
  it("returns matched skills and evidence lines", () => {
    const profile = extractResumeProfile(sampleResume);
    const evidence = buildRoleEvidence(
      {
        title: "RAG 工程师",
        matchScore: 82,
        recommendedLevel: "良好匹配",
        reason: "技能接近",
        strengths: [],
        gaps: ["岗位要求 评测，简历证据不足"],
        suggestedResumeKeywords: ["评测"],
        matchedKeywords: ["Python", "RAG"],
        resumeTips: [],
        isSynthetic: true,
        scoreDimensions: {
          skillCoverage: 80,
          experienceFit: 70,
          directionFit: 85,
          locationFit: 90,
          overall: 82,
        },
      },
      profile,
    );
    expect(evidence.matchedSkills).toContain("Python");
    expect(evidence.evidenceLines.length).toBeGreaterThan(0);
    expect(evidence.missingSkills.some((s) => s.includes("评测"))).toBe(true);
  });
});
