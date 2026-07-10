import { PROMPT_LIMITS, clipText } from "@/lib/ai/promptBudget";
import type { ResumeOptimizationInput } from "@/types/jobMatch";

export function buildResumeOptimizePrompt(input: ResumeOptimizationInput) {
  const resume = clipText(input.originalResume, PROMPT_LIMITS.resume);
  const jd = clipText(input.optionalJobDescription, PROMPT_LIMITS.jd);
  return `You are an expert resume writer, ATS optimization specialist, and technical recruiter.

Your task is to optimize the user's resume for the selected target role.
Return JSON object only. No markdown. No trailing commas. Never invent fake metrics.

Selected Target Role:
${input.selectedRole.title}

Role Match Reason:
${input.selectedRole.reason}

Strengths:
${input.selectedRole.strengths.join(", ")}

Gaps:
${input.selectedRole.gaps.join(", ")}

Suggested Resume Keywords:
${input.selectedRole.suggestedResumeKeywords.join(", ")}

Optional Job Description:
${jd || "No specific job description provided. Optimize based on the selected role direction."}

Original Resume:
${resume}

Output Language:
${input.preferredLanguage}

Return strictly valid JSON in the following format:
{
  "score": {
    "overall": 85,
    "roleMatch": 88,
    "keywordMatch": 82,
    "clarity": 86,
    "atsFriendliness": 84
  },
  "keyImprovements": ["improvement 1", "improvement 2"],
  "missingKeywords": ["keyword 1", "keyword 2"],
  "diffs": [
    {
      "original": "short original sentence or bullet from resume",
      "revised": "improved sentence",
      "reason": "why this change helps the target role"
    }
  ],
  "optimizedResume": "full optimized resume text"
}

Rules:
1. Do not invent fake experience, fake degrees, fake companies, fake metrics, or fake certifications.
2. You may improve wording, structure, clarity, ATS keywords, and impact.
3. If metrics are missing, suggest stronger phrasing but do not create fake numbers.
4. Align the resume with the selected target role.
5. Keep the resume realistic and truthful.
6. If a real job description is provided, prioritize its requirements.
7. Provide 3-8 diffs that quote real original snippets when possible; if a full rewrite, still give representative diffs.
8. If Output Language is Chinese, output Chinese.
9. If Output Language is Bilingual, provide a professional English resume and Chinese improvement notes if needed.
10. Return JSON only. Do not include markdown.`;
}
