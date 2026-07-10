import type { ProofLinkInput, StructuredResume } from "@/types/resume";

const URL_RE = /https?:\/\/[^\s)\]}>'"，。]+/gi;

export function extractUrlsFromText(text: string): string[] {
  const matches = text.match(URL_RE) || [];
  return [
    ...new Set(
      matches.map((u) => u.replace(/[.,;:]+$/g, "").trim()).filter(Boolean),
    ),
  ].slice(0, 30);
}

function formProofUrls(proofLinks?: ProofLinkInput): string[] {
  return [
    proofLinks?.github,
    proofLinks?.portfolio,
    proofLinks?.blog,
    proofLinks?.linkedin,
    ...(proofLinks?.demos || []),
  ]
    .filter(Boolean)
    .map((u) => String(u).trim()) as string[];
}

/** Early proof URLs without waiting for structured resume (latency). */
export function collectProofUrlsEarly(
  resumeContent: string,
  proofLinks?: ProofLinkInput,
): string[] {
  return [
    ...new Set([...formProofUrls(proofLinks), ...extractUrlsFromText(resumeContent)]),
  ].slice(0, 12);
}

export function collectProofUrls(
  structured: StructuredResume,
  resumeContent: string,
  proofLinks?: ProofLinkInput,
): string[] {
  const fromForm = formProofUrls(proofLinks);

  const fromResume = [
    ...(structured.basics.links || []),
    ...structured.projects.map((p) => p.url).filter(Boolean),
    ...structured.profiles.map((p) => p.url),
    ...extractUrlsFromText(resumeContent),
  ] as string[];

  return [...new Set([...fromForm, ...fromResume].map((u) => u.trim()))].slice(
    0,
    15,
  );
}
