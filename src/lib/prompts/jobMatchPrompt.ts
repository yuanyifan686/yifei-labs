import { PROMPT_LIMITS, clipText } from "@/lib/ai/promptBudget";
import type { JobMatchInput } from "@/types/jobMatch";

export function buildJobMatchPrompt(input: JobMatchInput) {
  const resume = clipText(input.resumeContent, PROMPT_LIMITS.resume);
  const jobs = clipText(input.jobListContent, PROMPT_LIMITS.jobList);
  const lang =
    input.preferredLanguage === "English" ? "English" : "Chinese";

  return `Recruiter + ATS analyst. Rank jobs from the provided list only.

User:
- Status: ${input.currentStatus}
- Level: ${input.experienceLevel}
- Location: ${input.preferredLocation || "N/A"}
- Language: ${lang}

Resume:
${resume}

Job list (may include 预筛分 priors — refine, do not invent jobs):
${jobs}

Rules:
- JSON object only. No markdown.
- Rank 8-12 jobs (or all if fewer). matchScore 0-100 descending.
- scoreDimensions numbers 0-100; overall === matchScore.
- Never invent experience. Strengths grounded in resume.
- Copy 岗位ID → jobId when present. isSynthetic true if 合成样本.
- aggregateGaps: 3-5 items. Arrays ≤5 each.
- Output language: ${lang} (keep job titles as given when bilingual).

Schema:
{
  "candidateSummary": "",
  "aggregateGaps": [],
  "recommendedRoles": [
    {
      "title": "",
      "company": "",
      "location": "",
      "sourceText": "",
      "jobId": "",
      "matchScore": 0,
      "scoreDimensions": {
        "skillCoverage": 0,
        "experienceFit": 0,
        "directionFit": 0,
        "locationFit": 0,
        "overall": 0
      },
      "recommendedLevel": "",
      "reason": "",
      "strengths": [],
      "gaps": [],
      "suggestedResumeKeywords": [],
      "matchedKeywords": [],
      "resumeTips": [],
      "isSynthetic": true
    }
  ]
}`;
}
