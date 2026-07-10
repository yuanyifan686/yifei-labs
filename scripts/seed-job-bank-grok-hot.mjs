/**
 * Additional hot-market AI roles (distinct from existing batches).
 * Usage: node scripts/seed-job-bank-grok-hot.mjs
 */
import fs from "fs";
import path from "path";
import { randomUUID } from "crypto";

const dbPath = path.join(process.cwd(), "data", "job-database.json");
const batchId = randomUUID();
const now = new Date().toISOString();

/** 当前市场需求旺盛、且与库内已有岗位方向尽量不重复的合成岗位 */
const hotJobs = [
  {
    title: "AI 视频生成 / 数字人工程师",
    company: "光幕智影",
    location: "北京",
    salary: "25k-48k",
    platformStyle: "boss",
    requirements:
      "熟悉扩散模型/视频生成链路或数字人驱动；了解 ComfyUI/推理服务化；有短视频或直播场景落地经验优先；Python",
    description:
      "营销、教育、直播带货对 AI 视频与数字人内容产能需求激增。岗位负责生成链路优化、角色一致性与批量生产工具，而非纯算法研究。",
    keywords: ["AI 视频", "数字人", "扩散模型", "ComfyUI", "内容生成"],
    relatedDirections: ["生成式媒体", "AIGC"],
  },
  {
    title: "AI Coding Agent / 代码智能工程师",
    company: "码栈智能",
    location: "上海",
    salary: "28k-55k",
    platformStyle: "boss",
    requirements:
      "熟悉代码大模型应用；有仓库级检索、补全或自动化改码经验；了解 AST/静态分析；熟悉 VS Code/插件体系优先",
    description:
      "研发效能工具成为刚需：代码补全、单测生成、Code Review Agent、自动修 bug。需要工程能力强、能接真实 monorepo 场景。",
    keywords: ["Coding Agent", "代码补全", "RAG for Code", "IDE 插件", "工程效能"],
    relatedDirections: ["研发效能", "AI 编程助手"],
  },
  {
    title: "搜索推荐算法工程师（生成式搜索）",
    company: "索元科技",
    location: "杭州",
    salary: "30k-60k",
    platformStyle: "zhilian",
    requirements:
      "熟悉召回/排序；了解 Query 理解与 LLM 重排；有电商或内容搜索经验；Python；熟悉在线实验",
    description:
      "传统搜索正在升级为「生成式答案 + 商品/内容分发」。岗位连接检索系统与大模型重排，要求对延迟和商业指标敏感。",
    keywords: ["搜索", "推荐", "LLM 重排", "Query 理解", "A/B 测试"],
    relatedDirections: ["搜索推荐", "生成式搜索"],
  },
  {
    title: "电商 AI 应用工程师",
    company: "货智云",
    location: "广州",
    salary: "18k-35k",
    platformStyle: "boss",
    requirements:
      "熟悉电商业务链路；会做商品文案/主图/客服自动化；了解推荐或搜索接口；能独立交付运营工具",
    description:
      "中小商家用 AI 做详情页、直播脚本、智能客服与选品分析，招聘量大、落地周期短，偏业务工程而非论文。",
    keywords: ["电商 AI", "智能客服", "商品内容生成", "运营自动化"],
    relatedDirections: ["电商数字化", "AI 应用"],
  },
  {
    title: "金融大模型应用工程师",
    company: "衡信智投",
    location: "上海",
    salary: "28k-50k",
    platformStyle: "zhilian",
    requirements:
      "有金融/风控/投研任一领域经验优先；熟悉 RAG 与权限审计；重视幻觉与合规；Python/SQL 扎实",
    description:
      "银行、券商、互金推进投研助手、合同审核、风控报告生成。岗位强调可审计、可追溯与业务正确性。",
    keywords: ["金融 AI", "风控", "投研助手", "合规", "RAG"],
    relatedDirections: ["金融科技", "行业大模型"],
  },
  {
    title: "教育 AI 产品工程师",
    company: "启学空间",
    location: "深圳",
    salary: "16k-30k",
    platformStyle: "market",
    requirements:
      "有题库/批改/个性化学习项目经验优先；熟悉对话式教学交互；能做内容安全过滤；前后端至少一项熟练",
    description:
      "AI 伴学、作文批改、口语陪练等需求稳定。需要把模型能力做成可续费的学习产品，关注准确率与家长信任。",
    keywords: ["教育 AI", "智能批改", "个性化学习", "内容安全"],
    relatedDirections: ["教育科技", "AI 产品工程"],
  },
  {
    title: "具身智能 / 机器人大模型工程师",
    company: "行远机器人",
    location: "北京",
    salary: "30k-60k",
    platformStyle: "boss",
    requirements:
      "了解机器人感知-规划-控制链路；有仿真或真机实验经验；熟悉视觉-语言-动作模型者优先；C++/Python",
    description:
      "具身智能融资与招聘双热：家用/工业机器人需要「能听懂指令并执行」。岗位偏系统集成与模型落地。",
    keywords: ["具身智能", "机器人", "VLA", "仿真", "运动规划"],
    relatedDirections: ["具身智能", "机器人 AI"],
  },
  {
    title: "合成数据工程师",
    company: "摹因数据",
    location: "远程",
    salary: "20k-38k",
    platformStyle: "market",
    requirements:
      "会用生成模型/规则引擎构造训练数据；懂数据清洗与去污染；熟悉隐私脱敏；有指令数据或对话数据项目经验",
    description:
      "高质量标注贵且慢，合成数据成为微调与评测的重要供给。岗位负责数据管线、质量控制与合规。",
    keywords: ["合成数据", "指令数据", "数据清洗", "隐私", "数据管线"],
    relatedDirections: ["数据工程", "模型微调数据"],
  },
  {
    title: "模型网关 / AI 中台工程师",
    company: "枢衡云",
    location: "成都",
    salary: "22k-42k",
    platformStyle: "boss",
    requirements:
      "熟悉 API 网关与限流；多模型路由与 fallback；token 计费与配额；Go/Java/Node 任一；了解可观测性",
    description:
      "企业接入多家模型后需要统一网关：鉴权、路由、缓存、审计、成本看板。平台型岗位，市场需求持续上升。",
    keywords: ["模型网关", "AI 中台", "多模型路由", "计费", "可观测性"],
    relatedDirections: ["平台工程", "LLMOps"],
  },
  {
    title: "AI 数据标注与质检负责人",
    company: "标准智能",
    location: "武汉",
    salary: "14k-26k",
    platformStyle: "zhilian",
    requirements:
      "有大规模标注项目管理经验；会写标注规范与抽检策略；了解 RLHF/偏好数据；能带小团队",
    description:
      "模型效果依赖数据质量。市场大量需要能管标注产线、做一致性检验与偏好数据的人，管理+专业并重。",
    keywords: ["数据标注", "质检", "RLHF", "标注规范", "项目管理"],
    relatedDirections: ["数据运营", "模型对齐数据"],
  },
  {
    title: "AI UX / 对话体验设计师",
    company: "语感设计",
    location: "上海",
    salary: "15k-28k",
    platformStyle: "market",
    requirements:
      "有对话/智能产品设计经验；会写交互流程与失败兜底；懂基础 prompt 约束；能与研发共创原型",
    description:
      "AI 产品成败很大程度在体验：何时打断、如何澄清、如何展示不确定性。复合型设计岗位缺口明显。",
    keywords: ["AI UX", "对话设计", "交互流程", "原型", "可用性"],
    relatedDirections: ["产品设计", "对话式产品"],
  },
  {
    title: "Browser Agent / RPA+LLM 工程师",
    company: "捷径自动化",
    location: "深圳",
    salary: "18k-34k",
    platformStyle: "boss",
    requirements:
      "熟悉浏览器自动化（Playwright/Puppeteer）；了解 Agent 规划与页面理解；会处理登录态与反爬边界；注重稳定性",
    description:
      "企业想用 Agent 完成填表、比价、后台操作。岗位把 RPA 与 LLM 结合，交付可监控的自动化流程。",
    keywords: ["Browser Agent", "RPA", "Playwright", "流程自动化", "LLM"],
    relatedDirections: ["工作流自动化", "AI Agent"],
  },
  {
    title: "实时协作 AI 工程师（会议/文档）",
    company: "同席科技",
    location: "北京",
    salary: "22k-40k",
    platformStyle: "zhilian",
    requirements:
      "熟悉流式 ASR/摘要；有会议纪要或协同文档产品经验；了解实时通信；全栈或后端强",
    description:
      "会议转写、行动项提取、文档共创助手成为办公套件标配能力，招聘聚焦低延迟与多人场景。",
    keywords: ["会议 AI", "实时摘要", "协同文档", "流式处理", "办公 AI"],
    relatedDirections: ["办公协作", "语音与文档 AI"],
  },
  {
    title: "地理空间 AI 工程师",
    company: "图知智能",
    location: "西安",
    salary: "16k-32k",
    platformStyle: "market",
    requirements:
      "了解遥感/GIS 或轨迹数据；有视觉或时空模型应用经验；Python；熟悉地图服务 API 优先",
    description:
      "智慧城市、物流、保险勘察等场景需要「看懂地图与影像」。岗位连接空间数据与多模态模型。",
    keywords: ["地理空间", "GIS", "遥感", "时空数据", "多模态"],
    relatedDirections: ["行业 AI", "计算机视觉"],
  },
  {
    title: "HR Tech / 智能招聘工程师",
    company: "才鉴科技",
    location: "杭州",
    salary: "15k-28k",
    platformStyle: "boss",
    requirements:
      "熟悉简历解析与人岗匹配；了解信息抽取；能做偏见与合规控制；有 SaaS 交付经验优先",
    description:
      "企业用 AI 做简历筛选、面试助手、人岗匹配。岗位需平衡效率与公平，避免简单关键词硬筛。",
    keywords: ["智能招聘", "人岗匹配", "简历解析", "信息抽取", "SaaS"],
    relatedDirections: ["HR Tech", "NLP 应用"],
  },
  {
    title: "供应链 / 物流 AI 工程师",
    company: "链行数智",
    location: "苏州",
    salary: "18k-33k",
    platformStyle: "zhilian",
    requirements:
      "了解预测、调度或路径优化；会用机器学习或运筹方法；SQL 强；能与业务运营协作",
    description:
      "需求预测、库存、运力调度是明确 ROI 场景。市场需要能把模型和规则系统嵌进现有 WMS/TMS 的人。",
    keywords: ["供应链", "需求预测", "调度优化", "运筹", "机器学习"],
    relatedDirections: ["产业互联网", "预测优化"],
  },
  {
    title: "游戏 NPC / 生成式玩法工程师",
    company: "玩境互动",
    location: "上海",
    salary: "20k-40k",
    platformStyle: "boss",
    requirements:
      "有游戏服务端或 AI 玩法经验；了解对话 NPC、程序化内容；注重延迟与成本；C#/C++/Python 任一",
    description:
      "开放世界与 UGC 游戏尝试 LLM NPC 与动态任务。岗位要在可玩性、成本和安全之间做工程权衡。",
    keywords: ["游戏 AI", "NPC", "程序化内容", "LLM", "实时性"],
    relatedDirections: ["游戏研发", "生成式玩法"],
  },
  {
    title: "智能运维 / AIOps 工程师",
    company: "哨塔云",
    location: "深圳",
    salary: "22k-42k",
    platformStyle: "zhilian",
    requirements:
      "熟悉日志/指标/链路；有异常检测或根因分析项目；了解告警降噪；会用 LLM 做运维助手优先",
    description:
      "云原生环境告警爆炸，AIOps 与运维 Agent 需求旺盛。岗位把可观测数据变成可执行诊断建议。",
    keywords: ["AIOps", "可观测性", "根因分析", "告警降噪", "运维 Agent"],
    relatedDirections: ["智能运维", "SRE"],
  },
  {
    title: "广告创意与投放 AI 工程师",
    company: "亮点媒介科技",
    location: "广州",
    salary: "16k-30k",
    platformStyle: "boss",
    requirements:
      "了解信息流广告业务；会做素材生成与多版本测试；能对接投放平台 API；关注转化指标",
    description:
      "广告素材产能与投放优化高度依赖 AI。岗位交付从创意生成到效果反馈的闭环工具。",
    keywords: ["广告 AI", "素材生成", "投放优化", "A/B 测试", "转化"],
    relatedDirections: ["营销科技", "AIGC"],
  },
  {
    title: "医疗影像 AI 工程师",
    company: "映川医疗科技",
    location: "北京",
    salary: "25k-48k",
    platformStyle: "market",
    requirements:
      "有医学影像或检测分割项目经验；了解医疗器械/数据合规基础；Python；重视可解释与临床流程嵌入",
    description:
      "辅助诊断与影像质控持续投入。岗位强调临床可用性与合规，不只要刷榜精度。",
    keywords: ["医疗影像", "辅助诊断", "分割检测", "医疗合规", "深度学习"],
    relatedDirections: ["医疗 AI", "计算机视觉"],
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

const incoming = hotJobs.map(toStored);
let added = 0;
for (const job of incoming) {
  const key = jobKey(job);
  if (!map.has(key)) added += 1;
  map.set(key, job);
}

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

console.log(`Hot batch: +${added} new / ${incoming.length} written`);
console.log(`Total jobs: ${next.jobs.length}`);
console.log("By source:", bySource);
console.log("New titles:");
for (const j of incoming) console.log(`  - ${j.title} | ${j.location} | ${j.salary}`);
console.log("File:", dbPath);
