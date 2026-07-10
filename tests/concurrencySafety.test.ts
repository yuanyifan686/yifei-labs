import { describe, expect, it } from "vitest";
import { enqueueWrite } from "@/lib/jobs/writeQueue";
import {
  attachGapToSession,
  attachMatchToSession,
  getAnalysisSessionForClient,
  mergeJobPools,
} from "@/lib/session/analysisSession";
import type { ResumeProfile, StoredJob } from "@/types/jobMatch";

const sampleProfile: ResumeProfile = {
  skillNames: ["Python", "RAG"],
  domains: ["AI"],
  projectHints: [],
  experienceYearsHint: 2,
  locations: ["北京"],
  rawTextHash: "abc",
  summaryLine: "test",
};

function job(id: string, title: string, company = "Co"): StoredJob {
  return {
    id,
    title,
    company,
    location: "远程",
    salary: "面议",
    platformStyle: "market",
    requirements: "Python",
    description: "desc",
    keywords: ["Python"],
    skillTags: ["Python"],
    relatedDirections: [],
    source: "fallback",
    isSynthetic: true,
    batchId: "t",
    createdAt: new Date().toISOString(),
  };
}

describe("concurrency safety", () => {
  it("mergeJobPools prefers personal overlay without dropping shared ids", () => {
    const personal = [job("p1", "RAG 工程师", "P")];
    const shared = [job("s1", "后端工程师", "S"), job("p1", "旧标题", "P")];
    const merged = mergeJobPools(personal, shared);
    expect(merged.some((j) => j.id === "p1" && j.title === "RAG 工程师")).toBe(
      true,
    );
    expect(merged.some((j) => j.id === "s1")).toBe(true);
  });

  it("write queue runs tasks serially", async () => {
    const order: number[] = [];
    await Promise.all([
      enqueueWrite(async () => {
        await new Promise((r) => setTimeout(r, 30));
        order.push(1);
      }),
      enqueueWrite(async () => {
        order.push(2);
      }),
    ]);
    expect(order).toEqual([1, 2]);
  });

  it("session attach refuses cross-client overwrite", async () => {
    const owner = await attachMatchToSession(
      undefined,
      sampleProfile,
      {
        candidateSummary: "owner",
        recommendedRoles: [
          {
            title: "RAG",
            matchScore: 80,
            strengths: [],
            gaps: [],
          },
        ],
      },
      new Date().toISOString(),
      "fallback",
      { clientToken: "token-owner-aaaa", persist: false },
    );

    const hijack = await attachMatchToSession(
      owner.id,
      sampleProfile,
      {
        candidateSummary: "hijacker",
        recommendedRoles: [
          {
            title: "运营",
            matchScore: 10,
            strengths: [],
            gaps: [],
          },
        ],
      },
      new Date().toISOString(),
      "fallback",
      { clientToken: "token-other-bbbb", persist: false },
    );

    // Hijacker gets a NEW session, does not mutate owner's
    expect(hijack.id).not.toBe(owner.id);
    const stillOwner = await getAnalysisSessionForClient(
      owner.id,
      "token-owner-aaaa",
    );
    expect(stillOwner?.matchResult?.candidateSummary).toBe("owner");
    expect(stillOwner?.matchResult?.recommendedRoles[0].title).toBe("RAG");
  });

  it("gap attach merges by role for same client", async () => {
    const s = await attachMatchToSession(
      undefined,
      sampleProfile,
      {
        candidateSummary: "x",
        recommendedRoles: [{ title: "A", matchScore: 50, strengths: [], gaps: [] }],
      },
      new Date().toISOString(),
      "fallback",
      { clientToken: "token-gap-cccccc", persist: false },
    );

    await attachGapToSession(
      s.id,
      {
        targetRole: "RAG 工程师",
        readinessScore: 60,
        matchedStrengths: [],
        missingSkills: [],
        learningPriorities: [],
        resumeImprovements: [],
        interviewPrepTips: [],
        suggestedKeywords: [],
        summary: "v1",
      },
      { clientToken: "token-gap-cccccc", persist: false },
    );

    const s2 = await attachGapToSession(
      s.id,
      {
        targetRole: "RAG 工程师",
        readinessScore: 70,
        matchedStrengths: [],
        missingSkills: [],
        learningPriorities: [],
        resumeImprovements: [],
        interviewPrepTips: [],
        suggestedKeywords: [],
        summary: "v2",
      },
      { clientToken: "token-gap-cccccc", persist: false },
    );

    expect(s2.id).toBe(s.id);
    expect(s2.gapResults?.length).toBe(1);
    expect(s2.gapResults?.[0].readinessScore).toBe(70);
    expect(s2.gapResults?.[0].summary).toBe("v2");
  });
});
