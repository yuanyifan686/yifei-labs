import { randomUUID } from "crypto";
import { getOpenAIClient } from "@/lib/ai/client";
import { createStructuredCompletion, formatAiError } from "@/lib/ai/completion";
import { fallbackRoleDirections } from "@/lib/ai/fallback/roleDirections";
import { asStringArray } from "@/lib/ai/normalize/common";
import type { AnalysisOutcome } from "@/lib/ai/types";
import { normalizeStoredJob } from "@/lib/jobDatabase";
import { buildJobBankPrompt } from "@/lib/prompts/jobBankPrompt";
import type {
  GenerateJobBankInput,
  StoredJob,
} from "@/types/jobMatch";

type RawJobBankResponse = {
  jobs?: Array<Partial<StoredJob> & { title?: string }>;
};

function normalizeGeneratedJobs(
  raw: RawJobBankResponse,
  input: GenerateJobBankInput,
  source: StoredJob["source"],
): StoredJob[] {
  const batchId = randomUUID();
  const jobs = (Array.isArray(raw?.jobs) ? raw.jobs : [])
    .filter((job) => job?.title)
    .map((job) =>
      normalizeStoredJob(
        {
          title: String(job.title),
          company: job.company,
          location: job.location || input.preferredLocation || "远程 / 一线城市",
          salary: job.salary,
          platformStyle:
            job.platformStyle === "boss" || job.platformStyle === "zhilian"
              ? job.platformStyle
              : "market",
          requirements: job.requirements,
          description: job.description,
          keywords: asStringArray(job.keywords),
          relatedDirections: asStringArray(job.relatedDirections),
        },
        batchId,
        source,
      ),
    );

  if (jobs.length === 0) {
    throw new Error("AI 未返回有效岗位数据。");
  }

  return jobs;
}

function fallbackJobBank(input: GenerateJobBankInput): StoredJob[] {
  const batchId = randomUUID();
  const seeds =
    input.directions.length > 0
      ? input.directions
      : fallbackRoleDirections(input).directions;

  const companies = [
    "星云智能",
    "流形科技",
    "青矩数据",
    "启航软件",
    "砺行网络",
    "云栈实验室",
  ];
  const locations = [
    input.preferredLocation || "北京",
    "上海",
    "深圳",
    "杭州",
    "远程",
  ];

  const jobs: StoredJob[] = [];
  seeds.slice(0, 4).forEach((direction, dIndex) => {
    for (let i = 0; i < 2; i++) {
      const keywords =
        direction.searchKeywords.length > 0
          ? direction.searchKeywords
          : direction.typicalRequirements;
      jobs.push(
        normalizeStoredJob(
          {
            title: direction.title,
            company: companies[(dIndex * 2 + i) % companies.length],
            location: locations[(dIndex + i) % locations.length],
            salary: `${15 + dIndex * 2 + i}k-${25 + dIndex * 2 + i}k`,
            platformStyle: i % 2 === 0 ? "boss" : "zhilian",
            requirements:
              direction.typicalRequirements.join("、") ||
              keywords.join("、") ||
              direction.title,
            description: `面向${direction.title}方向的合成岗位模板，用于简历匹配演练。核心能力：${keywords.slice(0, 5).join("、") || direction.title}。`,
            keywords: keywords.slice(0, 8),
            relatedDirections: [direction.title],
          },
          batchId,
          "fallback",
        ),
      );
    }
  });

  return jobs;
}

export async function generateJobBank(
  input: GenerateJobBankInput,
): Promise<AnalysisOutcome<StoredJob[]>> {
  if (!getOpenAIClient()) {
    return {
      data: fallbackJobBank(input),
      source: "fallback",
      warning: "未配置 MiniMax/OpenAI API Key，已使用本地规则生成合成岗位库。",
    };
  }

  try {
    const raw = await createStructuredCompletion<RawJobBankResponse>(
      "job bank",
      buildJobBankPrompt(input),
      { maxTokens: 6000, timeoutMs: 70_000, retries: 1, temperature: 0.35 },
    );
    return {
      data: normalizeGeneratedJobs(raw, input, "minimax"),
      source: "ai",
    };
  } catch (error) {
    const detail = formatAiError(error);
    console.error("AI job bank generation failed, using local fallback:", error);
    return {
      data: fallbackJobBank(input),
      source: "fallback",
      warning: `大模型生成岗位库失败，已回退本地合成岗位。原因：${detail}`,
    };
  }
}
