/**
 * Lightweight skill ontology for resume/job tagging and retrieval.
 * Not exhaustive — covers common AI/engineering market keywords in this product.
 */

export type SkillEntry = {
  /** Canonical display name */
  name: string;
  /** Lowercase aliases that map to this skill */
  aliases: string[];
};

export const SKILL_ONTOLOGY: SkillEntry[] = [
  { name: "Python", aliases: ["python", "py"] },
  { name: "TypeScript", aliases: ["typescript", "ts"] },
  { name: "JavaScript", aliases: ["javascript", "js", "es6"] },
  { name: "React", aliases: ["react", "react.js", "reactjs"] },
  { name: "Vue", aliases: ["vue", "vue.js", "vuejs", "nuxt"] },
  { name: "Next.js", aliases: ["next.js", "nextjs", "next"] },
  { name: "Node.js", aliases: ["node.js", "nodejs", "node"] },
  { name: "Go", aliases: ["golang", "go语言"] },
  { name: "Java", aliases: ["java", "spring", "spring boot"] },
  { name: "C++", aliases: ["c++", "cpp"] },
  { name: "C#", aliases: ["c#", "csharp", ".net", "dotnet"] },
  { name: "Rust", aliases: ["rust"] },
  { name: "SQL", aliases: ["sql", "mysql", "postgresql", "postgres", "sqlite"] },
  { name: "LLM", aliases: ["llm", "大模型", "large language model", "生成式ai"] },
  { name: "RAG", aliases: ["rag", "检索增强", "retrieval augmented", "知识库问答"] },
  { name: "Agent", aliases: ["agent", "智能体", "ai agent", "multi-agent", "多智能体"] },
  { name: "LangChain", aliases: ["langchain", "langgraph"] },
  { name: "LlamaIndex", aliases: ["llamaindex", "llama index"] },
  { name: "Prompt Engineering", aliases: ["prompt", "prompt engineering", "提示词", "提示工程"] },
  { name: "Fine-tuning", aliases: ["finetune", "fine-tune", "微调", "lora", "sft", "qlora"] },
  { name: "Embedding", aliases: ["embedding", "embeddings", "向量化"] },
  { name: "Vector DB", aliases: ["milvus", "qdrant", "weaviate", "向量数据库", "pgvector", "faiss"] },
  { name: "PyTorch", aliases: ["pytorch", "torch"] },
  { name: "TensorFlow", aliases: ["tensorflow", "tf"] },
  { name: "vLLM", aliases: ["vllm", "tgi", "推理加速", "tensorrt-llm"] },
  { name: "Docker", aliases: ["docker", "容器", "container"] },
  { name: "Kubernetes", aliases: ["kubernetes", "k8s"] },
  { name: "AWS", aliases: ["aws", "amazon web services", "s3", "lambda"] },
  { name: "GCP", aliases: ["gcp", "google cloud"] },
  { name: "Azure", aliases: ["azure"] },
  { name: "FastAPI", aliases: ["fastapi"] },
  { name: "Django", aliases: ["django"] },
  { name: "Flask", aliases: ["flask"] },
  { name: "Express", aliases: ["express", "express.js"] },
  { name: "Redis", aliases: ["redis"] },
  { name: "Kafka", aliases: ["kafka", "消息队列"] },
  { name: "Spark", aliases: ["spark", "pyspark"] },
  { name: "Flink", aliases: ["flink"] },
  { name: "Airflow", aliases: ["airflow", "数据编排"] },
  { name: "NLP", aliases: ["nlp", "自然语言", "文本分类", "命名实体"] },
  { name: "Computer Vision", aliases: ["cv", "computer vision", "计算机视觉", "目标检测"] },
  { name: "MLOps", aliases: ["mlops", "llmops", "模型运维"] },
  { name: "A/B Testing", aliases: ["a/b", "ab test", "ab测试", "实验平台"] },
  { name: "Data Analysis", aliases: ["数据分析", "data analysis", "pandas", "excel", "bi"] },
  { name: "Data Visualization", aliases: ["数据可视化", "tableau", "power bi", "echarts"] },
  { name: "Product Management", aliases: ["产品经理", "prd", "roadmap", "需求文档", "用户研究"] },
  { name: "UI/UX Design", aliases: ["ui", "ux", "交互设计", "figma", "原型"] },
  { name: "System Design", aliases: ["系统设计", "system design", "架构", "高并发"] },
  { name: "Playwright", aliases: ["playwright", "puppeteer", "selenium"] },
  { name: "RPA", aliases: ["rpa", "流程自动化", "ui自动化"] },
  { name: "Dify", aliases: ["dify", "coze", "n8n", "工作流平台"] },
  { name: "ComfyUI", aliases: ["comfyui", "stable diffusion", "扩散模型", "aigc"] },
  { name: "ASR", aliases: ["asr", "语音识别", "whisper", "tts"] },
  { name: "OpenAI API", aliases: ["openai", "gpt", "chatgpt api", "anthropic", "claude"] },
  { name: "Function Calling", aliases: ["function calling", "tool use", "工具调用", "tools api"] },
  { name: "Git", aliases: ["git", "github", "gitlab"] },
  { name: "CI/CD", aliases: ["ci/cd", "cicd", "jenkins", "github actions"] },
  { name: "Linux", aliases: ["linux", "shell", "bash"] },
  { name: "Microservice", aliases: ["微服务", "microservice", "服务治理"] },
  { name: "GraphQL", aliases: ["graphql"] },
  { name: "REST API", aliases: ["rest", "restful", "api 设计", "接口设计"] },
  { name: "Content Operations", aliases: ["内容运营", "社群运营", "用户增长", "growth"] },
  { name: "SEO", aliases: ["seo", "搜索优化"] },
  { name: "Project Management", aliases: ["项目管理", "scrum", "敏捷", "jira"] },
  { name: "Communication", aliases: ["跨部门协作", "客户沟通", "演讲", "presentation"] },
];

const aliasToCanonical = new Map<string, string>();
for (const entry of SKILL_ONTOLOGY) {
  aliasToCanonical.set(entry.name.toLowerCase(), entry.name);
  for (const alias of entry.aliases) {
    aliasToCanonical.set(alias.toLowerCase(), entry.name);
  }
}

/** Resolve free text to a canonical skill name when possible. */
export function canonicalizeSkill(raw: string): string | null {
  const key = raw.trim().toLowerCase();
  if (!key) return null;
  if (aliasToCanonical.has(key)) return aliasToCanonical.get(key)!;

  // Substring match for multi-word phrases inside longer tokens
  for (const [alias, name] of aliasToCanonical) {
    if (alias.length >= 3 && (key.includes(alias) || alias.includes(key))) {
      return name;
    }
  }
  return null;
}

/** Extract known skills from free text (resume or JD). */
export function extractSkillsFromText(text: string): string[] {
  const lower = text.toLowerCase();
  const found = new Set<string>();

  for (const entry of SKILL_ONTOLOGY) {
    for (const alias of [entry.name, ...entry.aliases]) {
      const a = alias.toLowerCase();
      if (a.length < 2) continue;
      // Word-ish boundary: avoid matching "go" inside random words via length/check
      if (a.length <= 2) {
        const re = new RegExp(`(?:^|[^a-z0-9])${escapeReg(a)}(?:[^a-z0-9]|$)`, "i");
        if (re.test(text)) found.add(entry.name);
      } else if (lower.includes(a)) {
        found.add(entry.name);
      }
    }
  }

  return [...found];
}

function escapeReg(s: string) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/** Normalize a keyword list into skill tags (canonical + original keepers). */
export function normalizeSkillTags(keywords: string[]): string[] {
  const out = new Set<string>();
  for (const kw of keywords) {
    const trimmed = String(kw || "").trim();
    if (!trimmed) continue;
    const canonical = canonicalizeSkill(trimmed);
    if (canonical) out.add(canonical);
    else if (trimmed.length >= 2 && trimmed.length <= 40) out.add(trimmed);
  }
  return [...out].slice(0, 16);
}

export function skillOverlap(a: string[], b: string[]): {
  matched: string[];
  missing: string[];
  coverage: number;
} {
  const setA = new Set(a.map((s) => s.toLowerCase()));
  const matched: string[] = [];
  const missing: string[] = [];
  for (const skill of b) {
    const hit = setA.has(skill.toLowerCase()) ||
      a.some((x) => x.toLowerCase().includes(skill.toLowerCase()) || skill.toLowerCase().includes(x.toLowerCase()));
    if (hit) matched.push(skill);
    else missing.push(skill);
  }
  const coverage =
    b.length === 0 ? 50 : Math.round((matched.length / b.length) * 100);
  return { matched, missing, coverage };
}
