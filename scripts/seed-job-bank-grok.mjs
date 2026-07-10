/**
 * Seed job bank with Grok-authored market-style AI roles (distinct from MiniMax batch).
 * Usage: node scripts/seed-job-bank-grok.mjs
 */
import fs from "fs";
import path from "path";
import { randomUUID } from "crypto";

const dbPath = path.join(process.cwd(), "data", "job-database.json");
const batchId = randomUUID();
const now = new Date().toISOString();

/** 2025-2026 China / global AI hiring demand — synthetic market templates (not live crawl). */
const grokJobs = [
  {
    title: "多模态大模型应用工程师",
    company: "视界智算",
    location: "北京",
    salary: "25k-45k",
    platformStyle: "boss",
    requirements:
      "熟悉视觉-语言模型或语音多模态链路；有图像/视频理解或 OCR+LLM 落地经验；Python 扎实；了解 vLLM/TensorRT-LLM 优先",
    description:
      "当前企业侧对「看图说话、文档截图理解、语音+文本一体助手」需求快速上升。岗位负责多模态链路接入、评测与业务场景落地，而不是纯论文训练。",
    keywords: ["多模态", "VLM", "OCR", "语音", "Python", "模型推理"],
    relatedDirections: ["多模态应用", "大模型应用"],
  },
  {
    title: "AI Agent 工具调用 / MCP 工程师",
    company: "链枢科技",
    location: "上海",
    salary: "22k-40k",
    platformStyle: "boss",
    requirements:
      "熟悉 Function Calling / Tool Use；了解 MCP 或自建工具协议；有工作流编排经验；熟悉 API 设计与权限边界",
    description:
      "市场从「聊天机器人」转向「可执行 Agent」。需要能把 CRM、工单、数据库、浏览器操作封装成稳定工具，并处理好失败重试与安全策略。",
    keywords: ["AI Agent", "MCP", "Function Calling", "工具编排", "API"],
    relatedDirections: ["AI Agent", "工作流自动化"],
  },
  {
    title: "企业知识库 / GraphRAG 工程师",
    company: "文脉智能",
    location: "杭州",
    salary: "20k-38k",
    platformStyle: "zhilian",
    requirements:
      "熟悉 RAG 全链路；了解图谱/关系增强检索；向量库与 chunk 策略经验；能做召回评测与幻觉控制",
    description:
      "ToB 知识问答已从「简单向量检索」升级到混合检索、权限过滤、图谱关联。岗位聚焦可上线的企业知识中台，而非 demo。",
    keywords: ["GraphRAG", "RAG", "向量数据库", "混合检索", "知识库"],
    relatedDirections: ["RAG 知识库", "企业搜索"],
  },
  {
    title: "MLOps / LLMOps 工程师",
    company: "云澜计算",
    location: "深圳",
    salary: "28k-50k",
    platformStyle: "boss",
    requirements:
      "熟悉模型部署与监控；Docker/K8s；有推理服务化经验；了解 prompt/模型版本管理与成本观测",
    description:
      "企业上线大模型后痛点转向稳定性、延迟、成本与灰度发布。LLMOps 成为 2025-2026 年增长最快的配套岗位之一。",
    keywords: ["LLMOps", "MLOps", "K8s", "推理服务", "可观测性", "成本优化"],
    relatedDirections: ["平台工程", "模型部署"],
  },
  {
    title: "AI 评测与红队工程师",
    company: "衡准实验室",
    location: "远程",
    salary: "18k-35k",
    platformStyle: "market",
    requirements:
      "会设计评测集与指标；了解安全越狱/注入风险；有自动化评测流水线经验；熟悉分类标注与误差分析",
    description:
      "监管与客户都在要求「可证明的质量」。市场大量需要评测工程师：效果、安全、偏见、业务 SLA，而不只是调 prompt。",
    keywords: ["LLM 评测", "红队", "安全评测", "自动化测试", "数据集"],
    relatedDirections: ["AI 质量", "AI 安全"],
  },
  {
    title: "端侧 / 边缘 AI 工程师",
    company: "芯语智能",
    location: "深圳",
    salary: "25k-48k",
    platformStyle: "zhilian",
    requirements:
      "熟悉模型量化与端侧推理；了解 ONNX/CoreML/NPU；有移动端或嵌入式部署经验；C++/Python 至少一项精通",
    description:
      "隐私与离线场景推动端侧小模型需求。岗位连接模型压缩、设备适配与产品体验，适合硬件+算法交叉背景。",
    keywords: ["端侧推理", "量化", "ONNX", "NPU", "边缘计算"],
    relatedDirections: ["边缘 AI", "模型压缩"],
  },
  {
    title: "AI 增长工程师（Growth + LLM）",
    company: "跃迁互动",
    location: "广州",
    salary: "18k-32k",
    platformStyle: "boss",
    requirements:
      "会用 LLM 做内容/线索/客服自动化；懂基础增长指标；能写脚本对接渠道 API；有 A/B 测试意识",
    description:
      "中小团队用 AI 做获客与转化自动化成为刚需：智能外呼文案、线索清洗、个性化落地页。技术栈偏工程落地，不靠大模型论文。",
    keywords: ["Growth", "自动化营销", "LLM 应用", "数据分析", "A/B 测试"],
    relatedDirections: ["AI 运营", "增长工程"],
  },
  {
    title: "对话式 AI / 语音 Agent 工程师",
    company: "声栖科技",
    location: "成都",
    salary: "16k-30k",
    platformStyle: "zhilian",
    requirements:
      "熟悉 ASR/TTS 或实时语音链路；了解打断与延迟控制；有客服/外呼场景经验优先；WebSocket/流式处理",
    description:
      "电话客服、车机助手、门店导购等语音 Agent 招聘量上升。重点是实时性、打断策略与业务话术编排。",
    keywords: ["语音 Agent", "ASR", "TTS", "流式", "实时对话"],
    relatedDirections: ["语音交互", "智能客服"],
  },
  {
    title: "AI 安全与合规工程师",
    company: "守衡数科",
    location: "北京",
    salary: "22k-40k",
    platformStyle: "market",
    requirements:
      "了解内容安全、数据脱敏、提示注入防护；熟悉国内生成式 AI 合规要点；能落地审核策略与日志审计",
    description:
      "随着生成式 AI 进政务、金融、医疗，安全合规岗位从「加分项」变成「门槛项」。需要技术与制度双落地。",
    keywords: ["AI 安全", "内容安全", "合规", "脱敏", "审计"],
    relatedDirections: ["AI 安全", "企业合规"],
  },
  {
    title: "AI 解决方案架构师（ToB）",
    company: "启程咨询科技",
    location: "上海",
    salary: "30k-55k",
    platformStyle: "boss",
    requirements:
      "能做需求拆解与 PoC；熟悉常见大模型产品形态；具备客户沟通能力；有行业解决方案交付经验",
    description:
      "很多客户买的不是模型，而是「可交付方案」。架构师要会选型、算 ROI、设计落地路径并带技术团队打样。",
    keywords: ["解决方案", "ToB", "PoC", "架构设计", "大模型选型"],
    relatedDirections: ["AI 解决方案", "售前架构"],
  },
  {
    title: "Context Engineering / 记忆系统工程师",
    company: "忆启科技",
    location: "远程",
    salary: "20k-36k",
    platformStyle: "market",
    requirements:
      "熟悉长上下文策略、会话记忆、用户画像；了解向量+结构化混合存储；能设计可回滚的记忆更新机制",
    description:
      "行业讨论从 Prompt 工程延伸到 Context Engineering：如何稳定注入业务上下文与长期记忆，是 Agent 产品差异化关键。",
    keywords: ["Context Engineering", "长期记忆", "会话状态", "用户画像"],
    relatedDirections: ["AI Agent", "记忆系统"],
  },
  {
    title: "AI 数据分析师（LLM 增强）",
    company: "数织实验室",
    location: "杭州",
    salary: "15k-28k",
    platformStyle: "zhilian",
    requirements:
      "SQL/Python 扎实；会用 LLM 辅助取数与报告生成；懂基础统计；能把分析结果产品化",
    description:
      "传统数分岗位要求叠加「会用 AI 提效」：自动写查询、生成洞察、搭建分析 Agent。适合业务理解强的人。",
    keywords: ["数据分析", "SQL", "Python", "LLM 提效", "BI"],
    relatedDirections: ["数据分析", "AI 提效"],
  },
  {
    title: "计算机视觉 + 大模型融合工程师",
    company: "鉴微智能",
    location: "苏州",
    salary: "22k-42k",
    platformStyle: "boss",
    requirements:
      "有检测/分割/OCR 项目经验；了解 VLM 在工业或安防中的应用；Python；熟悉模型蒸馏或级联方案",
    description:
      "制造业质检、单据识别正把传统 CV 与大模型结合，提升泛化能力。岗位强调现场落地与精度/速度权衡。",
    keywords: ["计算机视觉", "OCR", "VLM", "工业质检", "模型部署"],
    relatedDirections: ["计算机视觉", "多模态"],
  },
  {
    title: "AI 客户成功经理（技术背景）",
    company: "伴航 AI",
    location: "北京",
    salary: "14k-26k",
    platformStyle: "zhilian",
    requirements:
      "懂 AI 产品基本原理；能做客户培训与效果复盘；协调研发解决落地问题；沟通能力强",
    description:
      "ToB AI 续费率取决于落地效果。技术型 CS 帮助客户用好 Agent/知识库，是 2026 年销售侧配套热招岗位。",
    keywords: ["客户成功", "AI 落地", "培训", "续费", "ToB"],
    relatedDirections: ["客户成功", "AI 解决方案"],
  },
  {
    title: "开源大模型微调工程师",
    company: "砺模科技",
    location: "南京",
    salary: "25k-45k",
    platformStyle: "boss",
    requirements:
      "熟悉 LoRA/QLoRA 等微调方法；有数据清洗与指令集构建经验；了解开源模型生态；能做效果对比评测",
    description:
      "企业常基于开源模型做垂域微调以降本。岗位聚焦数据与训练工程，而不是从零预训练千亿模型。",
    keywords: ["LoRA", "微调", "开源模型", "指令数据", "评测"],
    relatedDirections: ["模型微调", "LLM 工程"],
  },
  {
    title: "AI 硬件产品工程师（AIoT）",
    company: "物语智造",
    location: "深圳",
    salary: "18k-35k",
    platformStyle: "market",
    requirements:
      "懂嵌入式或消费电子产品流程；了解端侧 AI 能力边界；能协同软硬件与供应链；有原型迭代经验",
    description:
      "AI 玩具、会议硬件、智能眼镜等消费侧产品回暖，需要能把模型能力装进可量产设备的复合型工程师。",
    keywords: ["AIoT", "硬件产品", "端侧 AI", "原型", "量产"],
    relatedDirections: ["AIoT", "硬件 AI"],
  },
  {
    title: "检索增强生成（行业垂域）工程师 - 法律/医疗",
    company: "正言智识",
    location: "上海",
    salary: "22k-40k",
    platformStyle: "boss",
    requirements:
      "有垂直领域知识库项目；重视引用与可追溯；熟悉权限与敏感信息处理；能与业务专家协作",
    description:
      "法律文书、医疗问答等强监管场景需要「可引用、可追责」的 RAG。市场需求明确，容错率低于通用聊天。",
    keywords: ["垂域 RAG", "引用溯源", "法律科技", "医疗信息化", "权限"],
    relatedDirections: ["RAG 知识库", "行业 AI"],
  },
  {
    title: "AI 全栈工程师（Copilot 产品）",
    company: "并肩软件",
    location: "远程",
    salary: "20k-38k",
    platformStyle: "boss",
    requirements:
      "React/Next.js + 后端 API；熟悉流式输出与会话状态；会接 OpenAI 兼容 API；有插件/侧边栏产品经验优先",
    description:
      "办公 Copilot、IDE 插件、浏览器助手类产品持续招全栈。要求能独立完成从 UI 到模型调用的闭环。",
    keywords: ["Copilot", "Next.js", "流式输出", "全栈", "OpenAI API"],
    relatedDirections: ["AI 全栈", "Copilot 产品"],
  },
];

function jobKey(job) {
  return `${job.title.trim().toLowerCase()}::${job.company.trim().toLowerCase()}`;
}

function toStored(job) {
  return {
    id: randomUUID(),
    title: job.title,
    company: job.company,
    location: job.location,
    salary: job.salary,
    platformStyle: job.platformStyle,
    requirements: job.requirements,
    description: job.description,
    keywords: job.keywords,
    relatedDirections: job.relatedDirections,
    source: "grok",
    batchId,
    createdAt: now,
  };
}

let existing = { version: 1, updatedAt: now, jobs: [] };
if (fs.existsSync(dbPath)) {
  existing = JSON.parse(fs.readFileSync(dbPath, "utf8"));
  if (!Array.isArray(existing.jobs)) existing.jobs = [];
}

const map = new Map();
for (const job of existing.jobs) map.set(jobKey(job), job);

const incoming = grokJobs.map(toStored);
for (const job of incoming) map.set(jobKey(job), job);

const next = {
  version: 1,
  updatedAt: now,
  jobs: [...map.values()].sort((a, b) => b.createdAt.localeCompare(a.createdAt)),
};

fs.mkdirSync(path.dirname(dbPath), { recursive: true });
fs.writeFileSync(dbPath, JSON.stringify(next, null, 2), "utf8");

const bySource = next.jobs.reduce((acc, j) => {
  acc[j.source] = (acc[j.source] || 0) + 1;
  return acc;
}, {});

console.log(`Grok batch: +${incoming.length} jobs`);
console.log(`Total jobs: ${next.jobs.length}`);
console.log("By source:", bySource);
console.log("New titles:");
for (const j of incoming) console.log(`  - ${j.title} @ ${j.company}`);
console.log("File:", dbPath);
