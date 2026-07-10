import { createHash } from "crypto";
import { getOpenAIClient } from "@/lib/ai/client";
import { createStructuredCompletion, formatAiError } from "@/lib/ai/completion";
import { structuredResumeSchema } from "@/lib/ai/schemas/structuredResumeSchema";
import { buildStructuredResumePrompt } from "@/lib/prompts/structuredResumePrompt";
import { structuredResumeFromRules } from "@/lib/resume/fromRules";
import {
  getCachedStructuredResume,
  setCachedStructuredResume,
} from "@/lib/resume/structuredResumeCache";
import type { PreferredLanguage } from "@/types/jobMatch";
import type { StructuredResume } from "@/types/resume";

function hashText(text: string) {
  return createHash("sha256").update(text.trim()).digest("hex").slice(0, 16);
}

function buildSummaryLine(s: Omit<StructuredResume, "summaryLine">): string {
  const skills = s.skills
    .map((x) => x.name)
    .slice(0, 6)
    .join("、");
  const parts = [
    skills ? `核心技能 ${skills}` : null,
    s.basics.yearsTotal != null ? `约 ${s.basics.yearsTotal} 年经验` : null,
    s.projects.length > 0 ? `${s.projects.length} 个项目` : null,
    s.work.length > 0 ? `${s.work.length} 段经历` : null,
  ].filter(Boolean);
  return parts.length > 0
    ? parts.join(" · ")
    : s.basics.summary || "已解析简历文本。";
}

function mergeAiWithRules(
  data: ReturnType<typeof structuredResumeSchema.parse>,
  rules: StructuredResume,
  resumeContent: string,
): StructuredResume {
  const partial = {
    basics: {
      summary: data.basics?.summary,
      yearsTotal: data.basics?.yearsTotal ?? rules.basics.yearsTotal,
      locations:
        data.basics?.locations?.length
          ? data.basics.locations
          : rules.basics.locations,
      links: [
        ...new Set([
          ...(data.basics?.links || []),
          ...(rules.basics.links || []),
        ]),
      ].slice(0, 20),
      headline: data.basics?.headline,
    },
    work: (data.work || []).map((w) => ({
      company: w.company,
      title: w.title,
      start: w.start,
      end: w.end,
      highlights: (w.highlights || []).slice(0, 6),
      tech: (w.tech || []).slice(0, 8),
    })),
    education: (data.education || []).map((e) => ({
      institution: e.institution,
      degree: e.degree,
      field: e.field,
      year: e.year,
    })),
    skills:
      (data.skills || []).length > 0
        ? data.skills.slice(0, 16).map((s) => ({
            name: s.name,
            level: s.level,
            evidence: s.evidence,
          }))
        : rules.skills,
    projects:
      (data.projects || []).length > 0
        ? data.projects.slice(0, 8).map((p) => ({
            name: p.name,
            url: p.url,
            impact: p.impact,
            tech: (p.tech || []).slice(0, 8),
            metrics: p.metrics,
          }))
        : rules.projects,
    awards: (data.awards || []).map((a) => ({
      title: a.title,
      year: a.year,
    })),
    certificates: (data.certificates || []).map((c) => ({
      name: c.name,
      issuer: c.issuer,
    })),
    profiles:
      (data.profiles || []).length > 0
        ? data.profiles.map((p) => ({
            network: p.network,
            url: p.url,
          }))
        : rules.profiles,
    rawTextHash: hashText(resumeContent),
    source: "ai" as const,
  };

  return {
    ...partial,
    summaryLine: buildSummaryLine(partial),
  };
}

/**
 * Parse resume into StructuredResume. AI when available; always has rules fallback.
 * In-memory cache by content hash avoids double AI parse on match → gap flow.
 */
export async function parseStructuredResume(
  resumeContent: string,
  options?: {
    preferredLanguage?: PreferredLanguage;
    preferredLocation?: string;
    /** Prefer rules only (fast path / offline). */
    rulesOnly?: boolean;
  },
): Promise<StructuredResume> {
  const hash = hashText(resumeContent);
  const cached = getCachedStructuredResume(hash);
  if (cached) return cached;

  const rules = structuredResumeFromRules(resumeContent, {
    preferredLocation: options?.preferredLocation,
  });

  if (options?.rulesOnly || !getOpenAIClient()) {
    setCachedStructuredResume(hash, rules);
    return rules;
  }

  try {
    const raw = await createStructuredCompletion("structured-resume", 
      buildStructuredResumePrompt(
        resumeContent,
        options?.preferredLanguage || "Chinese",
      ),
      {
        maxTokens: 2800,
        timeoutMs: 40_000,
        retries: 1,
        temperature: 0.1,
        validate: (data) => {
          const parsed = structuredResumeSchema.safeParse(data);
          if (!parsed.success) {
            return {
              ok: false,
              error: parsed.error.issues
                .slice(0, 3)
                .map((i) => i.message)
                .join("; "),
            };
          }
          return { ok: true, data: parsed.data };
        },
      },
    );

    const result = mergeAiWithRules(
      raw as ReturnType<typeof structuredResumeSchema.parse>,
      rules,
      resumeContent,
    );
    setCachedStructuredResume(hash, result);
    return result;
  } catch (error) {
    console.warn(
      "[resume] structured AI parse failed, using rules:",
      formatAiError(error),
    );
    setCachedStructuredResume(hash, rules);
    return rules;
  }
}
