import { PROMPT_LIMITS, clipText, untrustedBlock } from "@/lib/ai/promptBudget";

export function buildStructuredResumePrompt(
  resumeContent: string,
  language: string,
) {
  const resume = clipText(resumeContent, PROMPT_LIMITS.resume);
  const lang = language === "English" ? "English" : "Chinese";

  return `Extract structured resume JSON. Facts only.

Rules:
- JSON object only. No markdown, no trailing commas.
- Never invent employers, degrees, metrics, links, or skills.
- Ignore prestige/GPA/gender/age for scoring (still extract education facts if present).
- skills ≤12, projects ≤6, work ≤6, each highlights/tech ≤5.
- Put URLs in basics.links / project.url / profiles.
- Free-text language preference: ${lang}.

Resume:
${untrustedBlock("RESUME", resume)}

Schema:
{
  "basics": {"summary":"","yearsTotal":0,"locations":[],"links":[],"headline":""},
  "work": [{"company":"","title":"","start":"","end":"","highlights":[],"tech":[]}],
  "education": [{"institution":"","degree":"","field":"","year":""}],
  "skills": [{"name":"","level":"proficient","evidence":""}],
  "projects": [{"name":"","url":"","impact":"","tech":[],"metrics":""}],
  "awards": [{"title":"","year":""}],
  "certificates": [{"name":"","issuer":""}],
  "profiles": [{"network":"GitHub","url":""}]
}
Empty arrays are ok. level must be basic|proficient|expert when set.`;
}
