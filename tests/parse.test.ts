import { describe, expect, it } from "vitest";
import {
  balanceJsonClosers,
  extractJsonPayload,
  parseJsonResponse,
  repairJsonText,
  stripTrailingCommas,
} from "@/lib/ai/parse";
import { clipText } from "@/lib/ai/promptBudget";
import { skillGapResultSchema } from "@/lib/ai/schemas/skillGapSchema";

describe("extractJsonPayload", () => {
  it("strips markdown fences and think tags", () => {
    const raw = `<think>secret</think>\n\`\`\`json\n{"a":1}\n\`\`\``;
    expect(extractJsonPayload(raw)).toBe('{"a":1}');
  });

  it("slices first to last brace", () => {
    const raw = 'noise {"ok":true,"n":2} trailing';
    expect(JSON.parse(extractJsonPayload(raw))).toEqual({ ok: true, n: 2 });
  });
});

describe("JSON repair", () => {
  it("strips trailing commas", () => {
    const fixed = stripTrailingCommas('{"a":1,"b":[2,],}');
    expect(JSON.parse(fixed)).toEqual({ a: 1, b: [2] });
  });

  it("balances truncated object", () => {
    const fixed = balanceJsonClosers('{"a":1,"b":{"c":2');
    expect(JSON.parse(fixed)).toEqual({ a: 1, b: { c: 2 } });
  });

  it("repairs smart quotes + trailing comma", () => {
    const raw = `{“score”: 72, “items”: [“a”,],}`;
    const fixed = repairJsonText(raw);
    expect(JSON.parse(fixed)).toEqual({ score: 72, items: ["a"] });
  });
});

describe("parseJsonResponse", () => {
  it("parses valid JSON object", () => {
    const data = parseJsonResponse<{ title: string }>(
      '```json\n{"title":"RAG 工程师"}\n```',
      "test",
    );
    expect(data.title).toBe("RAG 工程师");
  });

  it("recovers truncated JSON with open braces", () => {
    const data = parseJsonResponse<{ a: number; nested: { b: string } }>(
      '{"a":1,"nested":{"b":"ok"',
      "trunc",
    );
    expect(data.a).toBe(1);
    expect(data.nested.b).toBe("ok");
  });

  it("throws on irreparable JSON", () => {
    expect(() => parseJsonResponse("{not json", "test")).toThrow(
      /Failed to parse AI test response/,
    );
  });
});

describe("prompt budget + schema coerce", () => {
  it("clipText keeps head and tail", () => {
    const long = "A".repeat(100) + "MID" + "B".repeat(100);
    const out = clipText(long, 80);
    expect(out.length).toBeLessThanOrEqual(80 + 40); // marker overhead small
    expect(out.length).toBeLessThan(long.length);
    expect(out.startsWith("A")).toBe(true);
    expect(out.endsWith("B")).toBe(true);
    expect(out).toContain("截断");
  });

  it("skillGap schema coerces string scores", () => {
    const parsed = skillGapResultSchema.safeParse({
      targetRole: "RAG",
      readinessScore: "72",
      marketFitScore: "68.5",
      evidenceScores: [
        {
          category: "skill_coverage",
          score: "80",
          evidence: "Python",
        },
      ],
    });
    expect(parsed.success).toBe(true);
    if (!parsed.success) return;
    expect(parsed.data.readinessScore).toBe(72);
    expect(parsed.data.evidenceScores?.[0].score).toBe(80);
    expect(parsed.data.evidenceScores?.[0].evidence).toEqual(["Python"]);
  });
});
