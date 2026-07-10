import { asStringArray } from "@/lib/ai/normalize/common";
import type {
  LearningPlanResult,
  LearningProjectIdea,
  LearningWeekPlan,
} from "@/types/jobMatch";

export function normalizeLearningPlan(
  raw: LearningPlanResult,
  targetRole: string,
): LearningPlanResult {
  const weeklyPlan: LearningWeekPlan[] = (
    Array.isArray(raw?.weeklyPlan) ? raw.weeklyPlan : []
  )
    .map((week) => ({
      week: Number(week?.week) || 0,
      theme: String(week?.theme || "").trim() || "学习周",
      goals: asStringArray(week?.goals),
      dailyFocus: asStringArray(week?.dailyFocus),
      deliverables: asStringArray(week?.deliverables),
    }))
    .filter((week) => week.week > 0)
    .sort((a, b) => a.week - b.week);

  const projectIdeas: LearningProjectIdea[] = (
    Array.isArray(raw?.projectIdeas) ? raw.projectIdeas : []
  )
    .map((project) => ({
      title: String(project?.title || "").trim(),
      difficulty: String(project?.difficulty || "中级").trim(),
      durationDays: Number(project?.durationDays) || 7,
      skillsCovered: asStringArray(project?.skillsCovered),
      description: String(project?.description || "").trim(),
      resumeBullet: String(project?.resumeBullet || "").trim(),
    }))
    .filter((project) => project.title);

  if (weeklyPlan.length === 0) {
    throw new Error("AI 未返回有效周计划。");
  }

  return {
    targetRole: String(raw?.targetRole || targetRole).trim(),
    horizonDays: Number(raw?.horizonDays) || 30,
    summary: String(raw?.summary || "已生成 30 天学习计划。").trim(),
    weeklyPlan,
    projectIdeas,
    milestones: asStringArray(raw?.milestones),
    resources: asStringArray(raw?.resources),
  };
}
