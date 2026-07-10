import { tokenize } from "@/lib/ai/fallback/textUtils";
import type {
  RoleDirection,
  RoleDirectionInput,
  RoleDirectionResult,
} from "@/types/jobMatch";

export function fallbackRoleDirections(
  input: RoleDirectionInput,
): RoleDirectionResult {
  const keywords = Array.from(tokenize(input.resumeContent)).slice(0, 12);
  const seedTitles = [
    keywords.find((k) => /agent|智能体/i.test(k))
      ? "AI Agent 开发工程师"
      : "AI 应用开发工程师",
    keywords.find((k) => /react|next/i.test(k))
      ? "全栈开发工程师"
      : "后端开发工程师",
    "大模型应用工程师",
    "自动化开发工程师",
  ];

  const directions: RoleDirection[] = seedTitles.map((title, index) => {
    const related = keywords.slice(index, index + 5);
    const query = [title, ...related.slice(0, 2)].join(" ");
    return {
      title,
      matchScore: Math.max(55, 90 - index * 8),
      reason: "基于简历关键词的本地规则推荐（未调用大模型）。",
      levelHint: input.experienceLevel,
      searchKeywords: related.length > 0 ? related : [title],
      bossQuery: query,
      zhilianQuery: query,
      typicalRequirements: related.length > 0 ? related : [title],
    };
  });

  return {
    candidateSummary:
      "当前使用本地规则生成岗位方向。配置 MiniMax/OpenAI 后可获得更准确的语义推荐。",
    directions,
    platformSearchTips: [
      "优先用「岗位名 + 1-2 个核心技能」在 Boss/智联搜索。",
      "把地点过滤设为期望城市或远程，再复制 3-8 条在招 JD 回来匹配。",
      "同一方向多搜 2-3 个近义词岗位名，覆盖面更全。",
    ],
  };
}
