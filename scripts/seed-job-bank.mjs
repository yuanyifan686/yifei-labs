/**
 * Seed local job bank with MiniMax market-style postings.
 * Usage: node scripts/seed-job-bank.mjs
 */
import OpenAI from "openai";
import fs from "fs";
import path from "path";
import { randomUUID } from "crypto";

const root = process.cwd();
const envPath = path.join(root, ".env.local");
const dbPath = path.join(root, "data", "job-database.json");

const env = Object.fromEntries(
  fs
    .readFileSync(envPath, "utf8")
    .split(/\r?\n/)
    .filter((line) => line && !line.startsWith("#"))
    .map((line) => {
      const i = line.indexOf("=");
      return [line.slice(0, i), line.slice(i + 1)];
    }),
);

const client = new OpenAI({
  apiKey: env.MINIMAX_API_KEY || env.OPENAI_API_KEY,
  baseURL:
    env.MINIMAX_BASE_URL ||
    env.OPENAI_BASE_URL ||
    "https://api.minimaxi.com/v1",
});

const model = env.AI_MODEL || "MiniMax-M3";

const prompt = `你是中国互联网/AI 招聘市场分析师。请根据 2025-2026 年国内真实市场需求趋势，生成一批「合成但贴近市场」的在招风格岗位，用于求职匹配产品数据库。

市场背景（请据此生成，不要编造为真实正在招聘的公司广告）：
- AI Agent / 大模型应用开发需求旺盛
- RAG、知识库、向量数据库、工作流自动化热门
- 全栈（React/Next.js）+ AI 结合岗位增多
- 数据工程、Prompt 工程、AI 产品经理仍有需求
- 地点以北京、上海、深圳、杭州、广州、远程为主
- 薪资贴合国内互联网市场（Junior/中级为主，部分高级）

要求：
1. 生成 16 条岗位
2. 覆盖至少 8 种不同岗位方向
3. 公司名必须虚构，不要用知名大厂真名
4. platformStyle 只能是 boss / zhilian / market
5. 内容用中文
6. 这些是市场风格模板，不是真实爬取数据

只返回合法 JSON（不要 markdown）：
{
  "jobs": [
    {
      "title": "岗位名",
      "company": "虚构公司",
      "location": "城市或远程",
      "salary": "如 18k-30k",
      "platformStyle": "boss",
      "requirements": "分号分隔的关键要求",
      "description": "2-4句岗位描述，体现市场需求",
      "keywords": ["技能1", "技能2"],
      "relatedDirections": ["所属方向"]
    }
  ]
}`;

function normalize(job, batchId) {
  const style =
    job.platformStyle === "boss" || job.platformStyle === "zhilian"
      ? job.platformStyle
      : "market";
  return {
    id: randomUUID(),
    title: String(job.title || "").trim(),
    company: String(job.company || "示例科技").trim(),
    location: String(job.location || "远程").trim(),
    salary: String(job.salary || "面议").trim(),
    platformStyle: style,
    requirements: String(job.requirements || "").trim(),
    description: String(job.description || "").trim(),
    keywords: Array.isArray(job.keywords)
      ? job.keywords.map(String).filter(Boolean).slice(0, 12)
      : [],
    relatedDirections: Array.isArray(job.relatedDirections)
      ? job.relatedDirections.map(String).filter(Boolean).slice(0, 6)
      : [],
    source: "minimax",
    batchId,
    createdAt: new Date().toISOString(),
  };
}

function extractJson(content) {
  let cleaned = content
    .trim()
    .replace(/<think>[\s\S]*?<\/think>/gi, "")
    .replace(/```(?:json)?\s*/gi, "")
    .replace(/```/g, "")
    .trim();
  const first = cleaned.indexOf("{");
  const last = cleaned.lastIndexOf("}");
  if (first !== -1 && last > first) cleaned = cleaned.slice(first, last + 1);
  return JSON.parse(cleaned);
}

function jobKey(job) {
  return `${job.title.trim().toLowerCase()}::${job.company.trim().toLowerCase()}`;
}

console.log(`Calling ${model} to generate market job bank...`);

const completion = await client.chat.completions.create({
  model,
  messages: [
    {
      role: "system",
      content:
        "You are a careful JSON API. Always respond with a single valid JSON object only.",
    },
    { role: "user", content: prompt },
  ],
  temperature: 0.45,
  thinking: { type: "disabled" },
  response_format: { type: "json_object" },
  max_completion_tokens: 8192,
});

const content = completion.choices[0]?.message?.content || "";
if (!content) {
  console.error("Empty response from model");
  process.exit(1);
}

const parsed = extractJson(content);
const batchId = randomUUID();
const incoming = (parsed.jobs || [])
  .filter((j) => j && j.title)
  .map((j) => normalize(j, batchId));

if (incoming.length === 0) {
  console.error("No jobs parsed. Raw:", content.slice(0, 500));
  process.exit(1);
}

let existing = { version: 1, updatedAt: new Date().toISOString(), jobs: [] };
if (fs.existsSync(dbPath)) {
  try {
    existing = JSON.parse(fs.readFileSync(dbPath, "utf8"));
    if (!Array.isArray(existing.jobs)) existing.jobs = [];
  } catch {
    existing.jobs = [];
  }
}

const map = new Map();
for (const job of existing.jobs) map.set(jobKey(job), job);
for (const job of incoming) map.set(jobKey(job), job);

const next = {
  version: 1,
  updatedAt: new Date().toISOString(),
  jobs: [...map.values()].sort((a, b) => b.createdAt.localeCompare(a.createdAt)),
};

fs.mkdirSync(path.dirname(dbPath), { recursive: true });
fs.writeFileSync(dbPath, JSON.stringify(next, null, 2), "utf8");

console.log(`OK: wrote ${incoming.length} new jobs, total ${next.jobs.length}`);
console.log("File:", dbPath);
console.log(
  "Titles:",
  incoming.map((j) => j.title).join(" | "),
);
