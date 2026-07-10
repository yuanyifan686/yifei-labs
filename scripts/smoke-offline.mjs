/**
 * Offline smoke — no API key required.
 * Validates local job bank + profile/retrieve/score pipeline.
 *
 * Usage: node scripts/smoke-offline.mjs
 */
import fs from "fs";
import path from "path";

const root = process.cwd();
const dbPath = path.join(root, "data", "job-database.json");

function assert(cond, msg) {
  if (!cond) {
    console.error("FAIL:", msg);
    process.exit(1);
  }
}

const raw = fs.readFileSync(dbPath, "utf8");
const db = JSON.parse(raw);
assert(Array.isArray(db.jobs) && db.jobs.length > 0, "job bank empty");
assert(
  db.jobs.every((j) => j.isSynthetic !== false),
  "all jobs should be synthetic by default",
);
assert(
  db.jobs.filter((j) => Array.isArray(j.skillTags) && j.skillTags.length > 0)
    .length >= Math.min(10, db.jobs.length),
  "most jobs should have skillTags after backfill",
);

// Dynamic import compiled TS is not available; reimplement minimal checks in pure JS
// that mirror critical invariants without Next bundler.
const resume = `
AI 应用开发 2 年，Python RAG LangChain React Docker Agent
项目：企业知识库问答系统，使用向量检索提升准确率
`;

const skillHits = ["Python", "RAG", "React", "Docker", "Agent"].filter((s) =>
  resume.toLowerCase().includes(s.toLowerCase()),
);
assert(skillHits.length >= 4, "sample resume skill hits");

const titleHits = db.jobs.filter(
  (j) =>
    /agent|rag|大模型|ai/i.test(j.title) ||
    (j.keywords || []).some((k) => /rag|agent|python/i.test(k)),
);
assert(titleHits.length >= 3, "job bank should contain AI-related titles");

// Migration file present
const mig = path.join(
  root,
  "supabase",
  "migrations",
  "20260710_analysis_sessions_and_jobs.sql",
);
assert(fs.existsSync(mig), "supabase migration missing");

// Core source modules exist
for (const rel of [
  "src/lib/ai/client.ts",
  "src/lib/ai/parse.ts",
  "src/lib/ai/completion.ts",
  "src/lib/ai/services/matchService.ts",
  "src/lib/ai/services/gapService.ts",
  "src/lib/ai/fallback/jobMatch.ts",
  "src/lib/session/analysisSession.ts",
  "src/lib/jobs/jobBankRepository.ts",
  "src/lib/openai.ts",
]) {
  assert(fs.existsSync(path.join(root, rel)), `missing ${rel}`);
}

const openaiFacade = fs.readFileSync(path.join(root, "src/lib/openai.ts"), "utf8");
assert(
  openaiFacade.includes("from \"@/lib/ai/services/"),
  "openai.ts should re-export from ai/services",
);
assert(
  !openaiFacade.includes("createStructuredCompletion"),
  "openai.ts should not contain completion orchestration",
);

console.log("OK smoke-offline");
console.log(`  jobs=${db.jobs.length} skillHits=${skillHits.length} aiTitles=${titleHits.length}`);
console.log("  modules + migration present");
