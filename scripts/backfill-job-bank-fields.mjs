/**
 * Backfill isSynthetic + skillTags on local data/job-database.json
 * Usage: node scripts/backfill-job-bank-fields.mjs
 */
import { readFileSync, writeFileSync } from "fs";
import { dirname, join } from "path";
import { fileURLToPath } from "url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const dbPath = join(root, "data", "job-database.json");

const SKILL_PATTERNS = [
  [/python/i, "Python"],
  [/typescript|\bts\b/i, "TypeScript"],
  [/javascript|\bjs\b/i, "JavaScript"],
  [/react/i, "React"],
  [/next\.?js/i, "Next.js"],
  [/node\.?js/i, "Node.js"],
  [/\bgo(?:lang)?\b/i, "Go"],
  [/\bjava\b/i, "Java"],
  [/\bsql\b|postgres|mysql/i, "SQL"],
  [/llm|大模型/i, "LLM"],
  [/rag|检索增强/i, "RAG"],
  [/agent|智能体/i, "Agent"],
  [/langchain/i, "LangChain"],
  [/pytorch|torch/i, "PyTorch"],
  [/docker/i, "Docker"],
  [/kubernetes|\bk8s\b/i, "Kubernetes"],
  [/fastapi/i, "FastAPI"],
  [/embedding|向量/i, "Embedding"],
  [/milvus|qdrant|weaviate/i, "Vector DB"],
  [/prompt/i, "Prompt Engineering"],
];

function extractSkills(text) {
  const found = [];
  for (const [re, name] of SKILL_PATTERNS) {
    if (re.test(text) && !found.includes(name)) found.push(name);
  }
  return found.slice(0, 16);
}

const raw = readFileSync(dbPath, "utf8");
const db = JSON.parse(raw);
let updated = 0;

db.jobs = (db.jobs || []).map((job) => {
  const hay = [
    job.title,
    job.requirements,
    job.description,
    ...(job.keywords || []),
  ].join("\n");
  const skillTags =
    Array.isArray(job.skillTags) && job.skillTags.length > 0
      ? job.skillTags
      : [
          ...new Set([
            ...(job.keywords || []).slice(0, 8),
            ...extractSkills(hay),
          ]),
        ].slice(0, 16);

  const next = {
    ...job,
    isSynthetic: job.isSynthetic !== false,
    skillTags,
  };
  if (
    job.isSynthetic !== true ||
    !Array.isArray(job.skillTags) ||
    job.skillTags.length === 0
  ) {
    updated += 1;
  }
  return next;
});

db.updatedAt = new Date().toISOString();
writeFileSync(dbPath, JSON.stringify(db, null, 2), "utf8");
console.log(`Backfilled ${updated} jobs → ${db.jobs.length} total at ${dbPath}`);
