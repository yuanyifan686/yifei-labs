import type { LearningPlanInput, LearningPlanResult } from "@/types/jobMatch";

export function fallbackLearningPlan(
  input: LearningPlanInput,
): LearningPlanResult {
  const skills = input.missingSkills.slice(0, 4);
  const skillA = skills[0] || "核心业务技能";
  const skillB = skills[1] || "项目表达";
  const skillC = skills[2] || "系统设计";
  const skillD = skills[3] || "面试表达";

  const hours =
    input.hoursPerWeek && input.hoursPerWeek > 0 ? input.hoursPerWeek : 10;
  const dailyHint =
    hours <= 6
      ? "每天约 45–60 分钟轻量练习"
      : hours <= 12
        ? "每天 1–2 小时概念+小练习"
        : "每天 2–3 小时深度学习与项目推进";

  return {
    targetRole: input.targetRole,
    horizonDays: 30,
    summary: `围绕「${input.targetRole}」用 30 天补齐关键缺口（按每周约 ${hours} 小时投入）：先补 ${skillA} 基础，再完成可展示项目，最后打磨简历与面试。`,
    weeklyPlan: [
      {
        week: 1,
        theme: `夯实 ${skillA}`,
        goals: [`掌握 ${skillA} 最小可用知识`, "整理现有项目与技能清单"],
        dailyFocus: [dailyHint, "记录可写进简历的证据点"],
        deliverables: ["技能笔记一页", "个人能力盘点表"],
      },
      {
        week: 2,
        theme: `项目实践：${skillB}`,
        goals: ["启动一个可演示的小项目", `在项目中应用 ${skillA}/${skillB}`],
        dailyFocus: ["每天推进功能点", "同步写项目 README"],
        deliverables: ["项目 MVP v0.1", "README 草稿"],
      },
      {
        week: 3,
        theme: `加深 ${skillC} 与结果量化`,
        goals: ["补齐稳定性/评测/工程化其一", "产出可量化结果"],
        dailyFocus: ["完善核心链路", "补充测试或评测记录"],
        deliverables: ["项目 v1.0 演示", "结果数据记录"],
      },
      {
        week: 4,
        theme: `简历与面试：${skillD}`,
        goals: ["把项目写进简历", "准备 3 个面试故事"],
        dailyFocus: ["改简历表述", "模拟问答"],
        deliverables: ["更新版简历", "面试题卡 10 题"],
      },
    ],
    projectIdeas: [
      {
        title: `${input.targetRole} 向作品：缺口技能实战项目`,
        difficulty: "中级",
        durationDays: 14,
        skillsCovered: skills.length > 0 ? skills : [skillA, skillB],
        description: `用 2 周做一个可演示的小系统，重点覆盖缺失技能中的 2-3 项，并记录问题与结果。`,
        resumeBullet: `独立完成面向${input.targetRole}的实践项目，覆盖${skills.slice(0, 3).join("、") || "核心技能"}，形成可演示交付物。`,
      },
      {
        title: "能力证据包：案例复盘 + Demo",
        difficulty: "初级",
        durationDays: 7,
        skillsCovered: [skillD, skillB],
        description:
          "把已有项目改写成 STAR 案例，并补 1 个短 Demo 视频或图文说明。",
        resumeBullet:
          "梳理 2-3 个可验证项目案例，明确个人贡献、技术选型与业务结果。",
      },
    ],
    milestones: [
      "第 7 天：完成技能盘点与学习笔记",
      "第 14 天：项目 MVP 可演示",
      "第 21 天：项目 v1 与结果记录",
      "第 30 天：简历更新 + 面试题卡",
    ],
    resources: [
      "官方文档 / 入门教程（按缺失技能检索）",
      "GitHub 优质开源示例拆解",
      "每周 1 次模拟面试复盘",
    ],
  };
}
