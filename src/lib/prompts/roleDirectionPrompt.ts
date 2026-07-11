import { PROMPT_LIMITS, clipText, untrustedBlock } from "@/lib/ai/promptBudget";
import type { RoleDirectionInput } from "@/types/jobMatch";

export function buildRoleDirectionPrompt(input: RoleDirectionInput) {
  const resume = clipText(input.resumeContent, PROMPT_LIMITS.resume);
  return `You are an expert technical recruiter and career coach for the Chinese and global job market.

Task:
Based ONLY on the candidate resume (no job list provided), recommend the most suitable job role directions.
Also prepare platform search queries for Boss Zhipin (Boss直聘) and Zhaopin (智联招聘).
Return JSON object only. No markdown. No trailing commas.

User Information:
- Full Name: ${input.fullName || "Not specified"}
- Current Status: ${input.currentStatus}
- Experience Level: ${input.experienceLevel}
- Preferred Language: ${input.preferredLanguage}
- Preferred Location: ${input.preferredLocation || "Not specified"}

Resume:
${untrustedBlock("RESUME", resume)}

Return strictly valid JSON in this format:
{
  "candidateSummary": "short profile summary",
  "directions": [
    {
      "title": "recommended job title",
      "matchScore": 88,
      "reason": "why this direction fits the resume",
      "levelHint": "Junior / 1-3年",
      "searchKeywords": ["keyword1", "keyword2"],
      "bossQuery": "search query for Boss Zhipin",
      "zhilianQuery": "search query for Zhaopin",
      "typicalRequirements": ["common requirement 1", "common requirement 2"]
    }
  ],
  "platformSearchTips": [
    "practical tip for searching on Boss/Zhaopin"
  ]
}

Rules:
1. Recommend 4 to 6 realistic role directions grounded in the resume.
2. Do not invent fake experience, companies, degrees, or metrics.
3. Rank by matchScore descending (0-100).
4. bossQuery / zhilianQuery should be short, searchable Chinese phrases (job title + 1-2 core skills).
5. searchKeywords should help filter real openings on job boards.
6. typicalRequirements should reflect common market requirements for that title, not fake personal experience.
7. If Preferred Language is Chinese, output Chinese.
8. If Preferred Language is Bilingual, use Chinese explanations and keep technical terms in English when natural.
9. If Preferred Language is English, output English.
10. Return JSON only. Do not include markdown.`;
}
