import fs from "node:fs";
import path from "node:path";
import OpenAI from "openai";

const root = process.cwd();
const envFiles = [".env.production", ".env.local", ".env"];

function loadEnvFile(file) {
  const fullPath = path.join(root, file);
  if (!fs.existsSync(fullPath)) return false;

  const lines = fs.readFileSync(fullPath, "utf8").split(/\r?\n/);
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const index = trimmed.indexOf("=");
    if (index <= 0) continue;
    const key = trimmed.slice(0, index).trim();
    const value = trimmed.slice(index + 1).trim();
    if (!process.env[key]) {
      process.env[key] = value.replace(/^["']|["']$/g, "");
    }
  }
  return true;
}

const loaded = envFiles.filter(loadEnvFile);
const apiKey = process.env.MINIMAX_API_KEY || process.env.OPENAI_API_KEY;
const baseURL =
  process.env.MINIMAX_BASE_URL ||
  process.env.OPENAI_BASE_URL ||
  "https://api.minimaxi.com/v1";
const model = process.env.AI_MODEL || "MiniMax-M3";

console.log("AI provider check");
console.log(`cwd=${root}`);
console.log(`envFiles=${loaded.length ? loaded.join(",") : "none"}`);
console.log(`hasKey=${apiKey ? "yes" : "no"}`);
console.log(`baseURL=${baseURL}`);
console.log(`model=${model}`);

if (!apiKey) {
  console.error("FAIL: missing MINIMAX_API_KEY or OPENAI_API_KEY");
  process.exit(1);
}

try {
  const client = new OpenAI({ apiKey, baseURL });
  const started = Date.now();
  const completion = await client.chat.completions.create({
    model,
    messages: [
      {
        role: "system",
        content: "Return JSON only.",
      },
      {
        role: "user",
        content: 'Return exactly {"ok":true,"provider":"minimax"}.',
      },
    ],
    temperature: 0.1,
    thinking: { type: "disabled" },
    response_format: { type: "json_object" },
    max_completion_tokens: 128,
  });

  const content = completion.choices[0]?.message?.content?.trim() || "";
  console.log(`OK: MiniMax responded in ${Date.now() - started}ms`);
  console.log(`sample=${content.slice(0, 120)}`);
} catch (error) {
  const err = error;
  console.error(
    `FAIL: status=${err?.status || "unknown"} message=${String(
      err?.error?.message || err?.message || error,
    ).slice(0, 300)}`,
  );
  process.exit(1);
}
