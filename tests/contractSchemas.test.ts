import { readFileSync } from "fs";
import path from "path";
import { describe, expect, it } from "vitest";
import { normalizeJobMatch } from "@/lib/ai/normalize/jobMatch";
import { normalizeSkillGap } from "@/lib/ai/normalize/skillGap";
import { jobMatchResultSchema } from "@/lib/ai/schemas/jobMatchSchema";
import { skillGapResultSchema } from "@/lib/ai/schemas/skillGapSchema";
import type { JobMatchResult, SkillGapAnalysisResult } from "@/types/jobMatch";

const fixtures = path.join(process.cwd(), "tests", "fixtures");

describe("contract fixtures + zod", () => {
  it("accepts golden jobMatch fixture and normalizes", () => {
    const raw = JSON.parse(
      readFileSync(path.join(fixtures, "jobMatch.contract.json"), "utf8"),
    );
    const parsed = jobMatchResultSchema.safeParse(raw);
    expect(parsed.success).toBe(true);
    if (!parsed.success) return;
    const out = normalizeJobMatch(parsed.data as JobMatchResult);
    expect(out.recommendedRoles[0].title).toContain("RAG");
    expect(out.recommendedRoles[0].matchScore).toBeLessThanOrEqual(100);
  });

  it("accepts golden skillGap fixture and normalizes", () => {
    const raw = JSON.parse(
      readFileSync(path.join(fixtures, "skillGap.contract.json"), "utf8"),
    );
    const parsed = skillGapResultSchema.safeParse(raw);
    expect(parsed.success).toBe(true);
    if (!parsed.success) return;
    const out = normalizeSkillGap(
      parsed.data as SkillGapAnalysisResult,
      "RAG 工程师",
      {
        resumeContent: "Python RAG LangChain 项目经验".padEnd(120, "。"),
        targetRole: "RAG 工程师",
        preferredLanguage: "Chinese",
      },
    );
    // LLM readiness blends with evidence chain; must stay in a sensible band
    expect(out.readinessScore).toBeGreaterThanOrEqual(50);
    expect(out.readinessScore).toBeLessThanOrEqual(90);
    expect(out.evidenceScores?.length).toBe(5);
    expect(out.evidenceScores?.[0].evidence.length).toBeGreaterThan(0);
    expect(out.riskFlags?.length).toBeGreaterThan(0);
    expect(out.skillMatrix?.length).toBeGreaterThan(0);
  });

  it("rejects empty roles", () => {
    const bad = jobMatchResultSchema.safeParse({
      candidateSummary: "x",
      recommendedRoles: [],
    });
    expect(bad.success).toBe(false);
  });
});
