import { PROMPT_LIMITS, clipText } from "@/lib/ai/promptBudget";
import type { GenerateJobBankInput } from "@/types/jobMatch";

export function buildJobBankPrompt(input: GenerateJobBankInput) {
  const count = Math.min(20, Math.max(6, input.count || 12));
  const resume = clipText(input.resumeContent, 4000);
  const directionsText =
    input.directions.length > 0
      ? input.directions
          .map(
            (d, i) =>
              `${i + 1}. ${d.title} (match ${d.matchScore}) | keywords: ${d.searchKeywords.join(", ")} | requirements: ${d.typicalRequirements.join(", ")}`,
          )
          .join("\n")
      : "No explicit directions. Infer 3-5 role directions from the resume first, then generate jobs.";

  return `You are a labor-market analyst creating a SYNTHETIC job board database for product testing and resume matching practice.

IMPORTANT DISCLAIMER FOR CONTENT STYLE:
- These jobs are AI-generated market-style templates, NOT real live postings from Boss Zhipin or Zhaopin.
- Use fictional but realistic company names (do not use famous real brand names).
- Do not claim the jobs are currently hiring on any real platform.
- Return JSON object only. No markdown. No trailing commas.

Candidate:
- Name: ${input.fullName || "Candidate"}
- Status: ${input.currentStatus}
- Level: ${input.experienceLevel}
- Preferred location: ${input.preferredLocation || "Not specified"}
- Output language: ${input.preferredLanguage}

Resume:
${resume}

Target role directions:
${directionsText}

Task:
Generate ${count} diverse synthetic job postings that a candidate with this profile might find relevant in the Chinese tech job market.
Cover multiple related titles (not only one), mix locations (preferred city, other cities, remote), and mix seniority slightly around the candidate level.

Return strictly valid JSON:
{
  "jobs": [
    {
      "title": "job title",
      "company": "fictional company name",
      "location": "city or 远程",
      "salary": "e.g. 15k-25k",
      "platformStyle": "boss",
      "requirements": "semicolon-separated key requirements",
      "description": "2-4 sentence job description",
      "keywords": ["skill1", "skill2"],
      "relatedDirections": ["mapped direction title"]
    }
  ]
}

Rules:
1. platformStyle must be one of: boss, zhilian, market
2. keywords: 4-10 concrete skills/tools
3. relatedDirections should map to the provided directions when possible
4. Do not invent that this candidate already works at these companies
5. Keep salaries realistic for China tech market
6. If Output language is Chinese, write Chinese fields
7. If English, write English fields
8. Return JSON only, no markdown`;
}
