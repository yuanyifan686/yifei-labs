import { createHash } from "crypto";
import { extractResumeProfile } from "@/lib/profile/extractResumeProfile";
import type { StructuredResume } from "@/types/resume";

function hashText(text: string) {
  return createHash("sha256").update(text.trim()).digest("hex").slice(0, 16);
}

function extractUrls(text: string): string[] {
  const matches = text.match(/https?:\/\/[^\s)\]}>'"]+/gi) || [];
  return [...new Set(matches.map((u) => u.replace(/[.,;]+$/, "")))].slice(0, 20);
}

/**
 * Build StructuredResume from rule-based profile extraction (offline fallback).
 */
export function structuredResumeFromRules(
  resumeContent: string,
  options?: { preferredLocation?: string },
): StructuredResume {
  const profile = extractResumeProfile(resumeContent, options);
  const links = extractUrls(resumeContent);
  const text = resumeContent.trim();

  // Heuristic work blocks: lines with 公司/任职/工程师
  const work: StructuredResume["work"] = [];
  const workLines = text
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter((l) => /公司|任职|工程师|实习|工作经历/i.test(l) && l.length < 100);
  for (const line of workLines.slice(0, 4)) {
    work.push({
      title: line.slice(0, 60),
      highlights: [],
      tech: profile.skillNames.slice(0, 4),
    });
  }

  const profiles: StructuredResume["profiles"] = [];
  for (const url of links) {
    if (/github\.com/i.test(url)) {
      profiles.push({ network: "GitHub", url });
    } else if (/linkedin\.com/i.test(url)) {
      profiles.push({ network: "LinkedIn", url });
    }
  }

  return {
    basics: {
      summary: profile.summaryLine,
      yearsTotal: profile.yearsTotal,
      locations: profile.preferredLocations,
      links,
      headline: profile.domains[0],
    },
    work,
    education: profile.education.map((line) => ({ institution: line })),
    skills: profile.skills.map((s) => ({
      name: s.name,
      level: s.level,
      evidence: s.evidence,
    })),
    projects: profile.projects.map((p) => ({
      name: p.name,
      impact: p.impact,
      tech: p.tech,
      url: links.find((u) =>
        p.name.split(/\s+/).some((t) => t.length > 2 && u.toLowerCase().includes(t.toLowerCase())),
      ),
    })),
    awards: [],
    certificates: [],
    profiles,
    rawTextHash: profile.rawTextHash || hashText(text),
    source: "rules",
    summaryLine: profile.summaryLine,
  };
}
