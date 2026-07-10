import {
  CurrentStatus,
  ExperienceLevel,
  JobMatchInput,
  PreferredLanguage,
} from "@/types/jobMatch";

export type AppMode = "job-bank" | "market-fit";
export type DetailPanel = "overview" | "gap" | "plan" | "resume";

export const STATUSES: Array<{ value: CurrentStatus; label: string }> = [
  { value: "Student", label: "学生" },
  { value: "New Graduate", label: "应届毕业生" },
  { value: "Employed", label: "在职" },
  { value: "Career Switcher", label: "转行求职者" },
  { value: "Freelancer", label: "自由职业者" },
];

export const LEVELS: Array<{ value: ExperienceLevel; label: string }> = [
  { value: "Student", label: "学生" },
  { value: "Entry Level", label: "0-1年" },
  { value: "Junior", label: "2-3年" },
  { value: "Intermediate", label: "3-5年" },
  { value: "Senior", label: "5年以上" },
];

export const LANGUAGES: Array<{ value: PreferredLanguage; label: string }> = [
  { value: "English", label: "English" },
  { value: "Chinese", label: "中文" },
  { value: "Bilingual", label: "中英双语" },
];

export const SAMPLE_RESUME =
  "拥有 2 年 AI 应用开发经验，专注于 AI Agent、工作流自动化和大模型应用落地。熟悉 OpenAI API、Prompt Engineering、工作流设计、知识库构建和前端开发。独立完成多个从 0 到 1 的 AI 项目，并成功部署上线。\n\n项目经验：\n- AI 智能体应用平台：基于工作流的多智能体协作系统\n- 企业知识库问答系统：RAG 检索增强生成\n- 自动化数据分析助手：结合 LLM 与数据可视化\n- 内部工具平台：提升团队效率 40%+";

export const ESTIMATED_MS = 18000;

export const EMPTY_INPUT: JobMatchInput = {
  fullName: "",
  currentStatus: "Employed",
  experienceLevel: "Junior",
  preferredLanguage: "Chinese",
  preferredLocation: "",
  resumeContent: "",
  jobListContent: "",
};

/** Aligned with current MVP: 简历→匹配→诊断→计划 */
export type CareerRouteStepId =
  | "resume"
  | "match"
  | "diagnose"
  | "plan";

export const CAREER_ROUTE_STEPS: Array<{
  id: CareerRouteStepId;
  label: string;
  hint: string;
}> = [
  { id: "resume", label: "简历", hint: "上传或粘贴简历，形成画像起点" },
  { id: "match", label: "匹配", hint: "对照岗位库完成排序" },
  { id: "diagnose", label: "诊断", hint: "目标岗准备度与能力缺口" },
  { id: "plan", label: "计划", hint: "30 天学习路径与项目" },
];
