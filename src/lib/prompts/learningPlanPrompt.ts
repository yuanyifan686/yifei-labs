import { PROMPT_LIMITS, clipText } from "@/lib/ai/promptBudget";
import type { LearningPlanInput } from "@/types/jobMatch";

export function buildLearningPlanPrompt(input: LearningPlanInput) {
  const resume = clipText(input.resumeContent, 3200);
  return `You are a practical career coach and technical mentor for China tech job seekers.

Task:
Create a 30-day learning and project plan so the candidate can improve market fit for the target role.
Base the plan on the skill gap analysis and resume evidence. Do not invent fake experience.
Return JSON object only. No markdown. No trailing commas. Keep weeklyPlan to 4 weeks.

Target Role:
${input.targetRole}

Readiness Score: ${input.readinessScore}
Market Fit Score: ${input.marketFitScore ?? "n/a"}
Available study hours per week: ${input.hoursPerWeek ?? 10}

Matched Strengths:
${input.matchedStrengths.join("\n") || "None listed"}

Missing Skills:
${input.missingSkills.join("\n") || "None listed"}

Learning Priorities:
${input.learningPriorities.join("\n") || "None listed"}

Resume (for context only):
${resume}

Output Language:
${input.preferredLanguage}

Return strictly valid JSON:
{
  "targetRole": "role",
  "horizonDays": 30,
  "summary": "one paragraph plan overview",
  "weeklyPlan": [
    {
      "week": 1,
      "theme": "theme",
      "goals": ["goal"],
      "dailyFocus": ["day-level focus"],
      "deliverables": ["concrete output"]
    }
  ],
  "projectIdeas": [
    {
      "title": "project title",
      "difficulty": "初级|中级|高级",
      "durationDays": 7,
      "skillsCovered": ["skill"],
      "description": "what to build",
      "resumeBullet": "how to write it on resume if completed truthfully"
    }
  ],
  "milestones": ["checkpoint"],
  "resources": ["resource or practice suggestion"]
}

Rules:
1. weeklyPlan must include weeks 1-4 covering 30 days.
2. projectIdeas: 2-4 realistic projects tied to missing skills.
3. Prefer portfolio-ready deliverables over passive courses.
4. Do not claim the candidate already completed these projects.
5. Scale dailyFocus intensity to available weekly hours (e.g. 5h/week vs 15h/week).
6. Mention weekly hour budget once in summary.
7. If Chinese preferred, output Chinese.
8. Return JSON only.`;
}
