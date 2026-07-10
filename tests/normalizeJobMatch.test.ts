import { describe, expect, it } from "vitest";
import { normalizeJobMatch } from "@/lib/ai/normalize/jobMatch";
import type { JobMatchResult } from "@/types/jobMatch";

describe("normalizeJobMatch", () => {
  it("clamps scores and fills defaults", () => {
    const raw = {
      candidateSummary: "ok",
      recommendedRoles: [
        {
          title: "  AI Agent  ",
          matchScore: 150,
          strengths: ["Python", ""],
          gaps: null,
          isSynthetic: true,
        },
      ],
    } as unknown as JobMatchResult;

    const out = normalizeJobMatch(raw);
    expect(out.recommendedRoles).toHaveLength(1);
    expect(out.recommendedRoles[0].title).toBe("AI Agent");
    expect(out.recommendedRoles[0].matchScore).toBe(100);
    expect(out.recommendedRoles[0].scoreDimensions?.overall).toBe(100);
    expect(out.recommendedRoles[0].strengths).toEqual(["Python"]);
    expect(out.recommendedRoles[0].isSynthetic).toBe(true);
  });

  it("throws when no roles", () => {
    expect(() =>
      normalizeJobMatch({ candidateSummary: "x", recommendedRoles: [] }),
    ).toThrow(/未返回有效岗位匹配/);
  });
});
