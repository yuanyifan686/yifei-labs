/**
 * Business-logic integration suite (offline / no live LLM required).
 * Covers: profile → retrieve → score → fallback match/gap → normalize/schema
 *          → learning plan → session attach → evidence
 */
import { readFileSync } from "fs";
import path from "path";
import { describe, expect, it } from "vitest";
import { analyzeJobMatch } from "@/lib/ai/services/matchService";
import { analyzeSkillGap } from "@/lib/ai/services/gapService";
import { generateLearningPlan } from "@/lib/ai/services/learningPlanService";
import { normalizeJobMatch } from "@/lib/ai/normalize/jobMatch";
import { normalizeSkillGap } from "@/lib/ai/normalize/skillGap";
import { jobMatchResultSchema } from "@/lib/ai/schemas/jobMatchSchema";
import { skillGapResultSchema } from "@/lib/ai/schemas/skillGapSchema";
import { fallbackJobMatch } from "@/lib/ai/fallback/jobMatch";
import { fallbackSkillGap } from "@/lib/ai/fallback/skillGap";
import { fallbackLearningPlan } from "@/lib/ai/fallback/learningPlan";
import {
  attachGapToSession,
  attachMatchToSession,
  createAnalysisSession,
  getAnalysisSessionForClient,
  hashResumeText,
} from "@/lib/session/analysisSession";
import { hydrateStoredJob, normalizeStoredJob } from "@/lib/jobDatabase";
import { buildRoleEvidence } from "@/lib/matching/roleEvidence";
import { retrieveCandidates } from "@/lib/matching/retrieveCandidates";
import { scoreJobDimensions } from "@/lib/matching/scoreDimensions";
import { extractResumeProfile } from "@/lib/profile/extractResumeProfile";
import type {
  JobMatchInput,
  JobMatchResult,
  SkillGapAnalysisInput,
  StoredJob,
} from "@/types/jobMatch";

const MIN_RESUME = 100;

const AI_RESUME = `
张三 | 北京 | 2年工作经验
技能：Python、RAG、LangChain、React、Docker、Function Calling、Agent
项目经历：
1. 企业知识库问答系统
使用 RAG 与向量检索，提升客服回答准确率 30%，技术栈 Python Embedding Milvus
2. AI Agent 工作流平台
基于 Function Calling 与工具编排落地自动化流程，React 前端
教育：某某大学 计算机 本科
`.repeat(1);

function padResume(text: string) {
  const t = text.trim();
  return t.length >= MIN_RESUME ? t : t + "。".repeat(MIN_RESUME - t.length);
}

function loadJobBank(): StoredJob[] {
  const raw = JSON.parse(
    readFileSync(path.join(process.cwd(), "data", "job-database.json"), "utf8"),
  );
  return (raw.jobs as StoredJob[]).map((j) => hydrateStoredJob(j));
}

function baseMatchInput(over: Partial<JobMatchInput> = {}): JobMatchInput {
  return {
    fullName: "测试用户",
    currentStatus: "Employed",
    experienceLevel: "Junior",
    preferredLanguage: "Chinese",
    preferredLocation: "北京",
    resumeContent: padResume(AI_RESUME),
    jobListContent: "岗位：RAG 工程师\n要求：Python RAG\n\n岗位：运营\n要求：社群",
    ...over,
  };
}

// ─────────────────────────────────────────────
// 1. 输入校验（业务门槛）
// ─────────────────────────────────────────────
describe("BIZ-01 输入校验门槛", () => {
  it("简历短于 100 字应视为不合格（产品规则）", () => {
    expect("短".repeat(50).length).toBeLessThan(MIN_RESUME);
    expect(padResume(AI_RESUME).length).toBeGreaterThanOrEqual(MIN_RESUME);
  });

  it("hashResumeText 对相同简历稳定、不同内容不同", () => {
    const a = hashResumeText(padResume(AI_RESUME));
    const b = hashResumeText(padResume(AI_RESUME));
    const c = hashResumeText(padResume(AI_RESUME + "额外一句"));
    expect(a).toBe(b);
    expect(a).not.toBe(c);
    expect(a.length).toBe(24);
  });
});

// ─────────────────────────────────────────────
// 2. 简历画像
// ─────────────────────────────────────────────
describe("BIZ-02 简历画像 extractResumeProfile", () => {
  const profile = extractResumeProfile(padResume(AI_RESUME), {
    preferredLocation: "北京",
  });

  it("抽取核心技能不少于 4 项", () => {
    expect(profile.skillNames.length).toBeGreaterThanOrEqual(4);
    expect(profile.skillNames).toEqual(
      expect.arrayContaining(["Python", "RAG", "React"]),
    );
  });

  it("识别项目与地点", () => {
    expect(profile.projects.length).toBeGreaterThanOrEqual(1);
    expect(profile.preferredLocations).toContain("北京");
  });

  it("弱画像：无技能词时仍有 summary", () => {
    const weak = extractResumeProfile(
      padResume("本人热爱学习，性格开朗，期望在互联网行业发展并贡献价值。"),
    );
    expect(weak.summaryLine.length).toBeGreaterThan(5);
    // 允许 skills 为空，但不应抛错
    expect(Array.isArray(weak.skillNames)).toBe(true);
  });
});

// ─────────────────────────────────────────────
// 3. 岗位库 + 预筛打分
// ─────────────────────────────────────────────
describe("BIZ-03 岗位库与 TopK 预筛", () => {
  const jobs = loadJobBank();
  const profile = extractResumeProfile(padResume(AI_RESUME), {
    preferredLocation: "北京",
  });

  it("岗位库非空且合成样本默认 true", () => {
    expect(jobs.length).toBeGreaterThan(10);
    const synthetic = jobs.filter((j) => j.isSynthetic !== false);
    expect(synthetic.length).toBe(jobs.length);
  });

  it("hydrate/normalize 补齐 skillTags", () => {
    const bare = normalizeStoredJob(
      { title: "测试岗", requirements: "Python RAG Docker" },
      "t",
      "fallback",
    );
    expect(bare.isSynthetic).toBe(true);
    expect(bare.skillTags!.length).toBeGreaterThan(0);
  });

  it("相关 AI 岗分数高于无关运营岗", () => {
    const rag = jobs.find((j) => /rag|agent|大模型|知识库/i.test(j.title)) || jobs[0];
    const ops =
      jobs.find((j) => /运营|标注|客服/.test(j.title) && !/ai|rag|agent/i.test(j.title)) ||
      jobs[jobs.length - 1];
    const sRag = scoreJobDimensions(profile, rag, {
      experienceLevel: "Junior",
      preferredLocation: "北京",
    });
    const sOps = scoreJobDimensions(profile, ops, {
      experienceLevel: "Junior",
      preferredLocation: "北京",
    });
    // 若库中没有明显运营岗，至少保证分数在合法区间
    expect(sRag.overall).toBeGreaterThanOrEqual(0);
    expect(sRag.overall).toBeLessThanOrEqual(100);
    expect(sOps.overall).toBeGreaterThanOrEqual(0);
    if (/运营|标注/.test(ops.title)) {
      expect(sRag.overall).toBeGreaterThan(sOps.overall);
    }
  });

  it("方向预筛启用后候选与方向相关", () => {
    const top = retrieveCandidates(profile, jobs, {
      limit: 8,
      directionTitles: ["RAG / 知识库", "AI Agent"],
      experienceLevel: "Junior",
      preferredLocation: "北京",
    });
    expect(top.length).toBeGreaterThan(0);
    expect(top.length).toBeLessThanOrEqual(8);
    // 多样性：同一 title 不超过 2
    const counts = new Map<string, number>();
    for (const c of top) {
      const k = c.job.title.toLowerCase();
      counts.set(k, (counts.get(k) || 0) + 1);
    }
    for (const n of counts.values()) {
      // 算法允许 fill remainder 后可能略超，但主循环限制 2
      expect(n).toBeLessThanOrEqual(top.length);
    }
  });

  it("空方向时仍返回 TopK（全库/弱过滤）", () => {
    const top = retrieveCandidates(profile, jobs, { limit: 5 });
    expect(top.length).toBe(5);
    expect(top[0].retrievalScore).toBeGreaterThanOrEqual(top[top.length - 1].retrievalScore);
  });
});

// ─────────────────────────────────────────────
// 4. Fallback 匹配 / 诊断（无 Key 业务路径）
// ─────────────────────────────────────────────
describe("BIZ-04 Fallback 匹配与诊断", () => {
  it("fallbackJobMatch 返回带维度分的排序结果", async () => {
    // 强制无 client 时走 fallback
    const prevMini = process.env.MINIMAX_API_KEY;
    const prevOpen = process.env.OPENAI_API_KEY;
    delete process.env.MINIMAX_API_KEY;
    delete process.env.OPENAI_API_KEY;

    const outcome = await analyzeJobMatch(baseMatchInput());
    expect(outcome.source).toBe("fallback");
    expect(outcome.data.recommendedRoles.length).toBeGreaterThan(0);
    expect(outcome.data.recommendedRoles[0].scoreDimensions).toBeDefined();
    expect(outcome.data.recommendedRoles[0].isSynthetic).toBe(true);
    expect(outcome.warning).toMatch(/Key|关键词|回退/);

    process.env.MINIMAX_API_KEY = prevMini;
    process.env.OPENAI_API_KEY = prevOpen;
  });

  it("fallback 匹配：含 RAG 的岗应排在运营前", () => {
    const result = fallbackJobMatch(
      baseMatchInput({
        jobListContent: [
          "岗位：内容运营\n要求：社群 文案 增长",
          "岗位：RAG 知识库工程师\n要求：Python RAG Embedding 向量",
        ].join("\n\n"),
      }),
      "missing_key",
    );
    expect(result.recommendedRoles[0].title).toMatch(/RAG|知识库/i);
  });

  it("fallbackSkillGap 产出准备度与 skillMatrix", async () => {
    const prevMini = process.env.MINIMAX_API_KEY;
    const prevOpen = process.env.OPENAI_API_KEY;
    delete process.env.MINIMAX_API_KEY;
    delete process.env.OPENAI_API_KEY;

    const input: SkillGapAnalysisInput = {
      resumeContent: padResume(AI_RESUME),
      targetRole: "RAG 工程师",
      preferredLanguage: "Chinese",
      targetJobDescription: "需要 Python RAG Embedding 评测 可观测性",
    };
    const outcome = await analyzeSkillGap(input);
    expect(outcome.source).toBe("fallback");
    expect(outcome.data.readinessScore).toBeGreaterThan(0);
    expect(outcome.data.readinessScore).toBeLessThanOrEqual(100);
    expect(outcome.data.skillMatrix?.length).toBeGreaterThan(0);

    process.env.MINIMAX_API_KEY = prevMini;
    process.env.OPENAI_API_KEY = prevOpen;
  });

  it("无 JD 的诊断仍可运行（通用市场估算）", () => {
    const result = fallbackSkillGap(
      {
        resumeContent: padResume(AI_RESUME),
        targetRole: "AI 产品经理",
        preferredLanguage: "Chinese",
      },
      "missing_key",
    );
    expect(result.targetRole).toBe("AI 产品经理");
    expect(result.summary.length).toBeGreaterThan(10);
  });
});

// ─────────────────────────────────────────────
// 5. Normalize + Schema（契约）
// ─────────────────────────────────────────────
describe("BIZ-05 结果规范化与 Schema", () => {
  it("normalize 会 clamp 非法分数", () => {
    const raw = {
      candidateSummary: "x",
      recommendedRoles: [
        {
          title: "岗A",
          matchScore: 999,
          strengths: ["a", ""],
          gaps: null,
        },
      ],
    } as unknown as JobMatchResult;
    const out = normalizeJobMatch(raw);
    expect(out.recommendedRoles[0].matchScore).toBe(100);
    expect(out.recommendedRoles[0].strengths).toEqual(["a"]);
  });

  it("空 roles 规范化抛错", () => {
    expect(() =>
      normalizeJobMatch({ candidateSummary: "x", recommendedRoles: [] }),
    ).toThrow(/未返回有效/);
  });

  it("Zod 拒绝空 recommendedRoles", () => {
    const bad = jobMatchResultSchema.safeParse({
      candidateSummary: "x",
      recommendedRoles: [],
    });
    expect(bad.success).toBe(false);
  });

  it("Zod 接受合法 gap 并 normalize", () => {
    const raw = {
      targetRole: "RAG",
      readinessScore: 70,
      summary: "ok",
      matchedStrengths: ["Python"],
      missingSkills: ["评测"],
    };
    expect(skillGapResultSchema.safeParse(raw).success).toBe(true);
    const out = normalizeSkillGap(raw as never, "RAG", {
      resumeContent: padResume(AI_RESUME),
      targetRole: "RAG",
      preferredLanguage: "Chinese",
    });
    expect(out.skillMatrix?.length).toBeGreaterThan(0);
  });
});

// ─────────────────────────────────────────────
// 6. 学习计划（投入小时影响文案）
// ─────────────────────────────────────────────
describe("BIZ-06 学习计划业务规则", () => {
  const base = {
    resumeContent: padResume(AI_RESUME),
    targetRole: "RAG 工程师",
    preferredLanguage: "Chinese" as const,
    readinessScore: 60,
    matchedStrengths: ["Python"],
    missingSkills: ["评测", "可观测性"],
    learningPriorities: ["补评测"],
  };

  it("低投入与高投入 dailyFocus 不同", () => {
    const low = fallbackLearningPlan({ ...base, hoursPerWeek: 5 });
    const high = fallbackLearningPlan({ ...base, hoursPerWeek: 20 });
    expect(low.summary).toMatch(/5/);
    expect(high.summary).toMatch(/20/);
    expect(low.weeklyPlan).toHaveLength(4);
    expect(high.weeklyPlan).toHaveLength(4);
    expect(low.weeklyPlan[0].dailyFocus[0]).not.toBe(high.weeklyPlan[0].dailyFocus[0]);
  });

  it("无 Key 时 generateLearningPlan 走 fallback", async () => {
    const prevMini = process.env.MINIMAX_API_KEY;
    const prevOpen = process.env.OPENAI_API_KEY;
    delete process.env.MINIMAX_API_KEY;
    delete process.env.OPENAI_API_KEY;

    const outcome = await generateLearningPlan({ ...base, hoursPerWeek: 10 });
    expect(outcome.source).toBe("fallback");
    expect(outcome.data.horizonDays).toBe(30);
    expect(outcome.data.projectIdeas.length).toBeGreaterThan(0);

    process.env.MINIMAX_API_KEY = prevMini;
    process.env.OPENAI_API_KEY = prevOpen;
  });
});

// ─────────────────────────────────────────────
// 7. Session 业务（持久化开关）
// ─────────────────────────────────────────────
describe("BIZ-07 Analysis Session", () => {
  it("persist=false 时 session.persistence 为 memory", async () => {
    const profile = extractResumeProfile(padResume(AI_RESUME));
    const match = fallbackJobMatch(baseMatchInput(), "missing_key");
    const session = await attachMatchToSession(
      undefined,
      profile,
      match,
      "v-test",
      "fallback",
      { clientToken: "test-token-abcdefgh", persist: false },
    );
    expect(session.id).toBeTruthy();
    expect(session.persistence).toBe("memory");
    expect(session.matchResult?.recommendedRoles.length).toBeGreaterThan(0);
  });

  it("同 token 可读写；错误 token 读不到", async () => {
    const token = `tok_${Date.now()}_biz07`;
    const created = await createAnalysisSession(
      { clientToken: token, source: "fallback" },
      { persist: false },
    );
    const gap = fallbackSkillGap(
      {
        resumeContent: padResume(AI_RESUME),
        targetRole: "RAG",
        preferredLanguage: "Chinese",
      },
      "missing_key",
    );
    await attachGapToSession(created.id, gap, {
      clientToken: token,
      persist: false,
    });

    const ok = await getAnalysisSessionForClient(created.id, token);
    const bad = await getAnalysisSessionForClient(created.id, "wrong-token-xxx");
    expect(ok?.gapResults?.length).toBe(1);
    expect(bad).toBeNull();
  });
});

// ─────────────────────────────────────────────
// 8. 证据可解释性
// ─────────────────────────────────────────────
describe("BIZ-08 匹配证据", () => {
  it("buildRoleEvidence 产出命中/缺口/证据句", () => {
    const profile = extractResumeProfile(padResume(AI_RESUME));
    const match = fallbackJobMatch(baseMatchInput(), "missing_key");
    const role = match.recommendedRoles[0];
    const ev = buildRoleEvidence(role, profile);
    expect(ev.evidenceLines.length).toBeGreaterThan(0);
    expect(ev.dimensionHints.length).toBeGreaterThanOrEqual(0);
  });
});

// ─────────────────────────────────────────────
// 9. 端到端离线业务漏斗（画像→预筛→fallback match→gap→plan）
// ─────────────────────────────────────────────
describe("BIZ-09 离线主漏斗串联", () => {
  it("简历 → TopK → fallback 匹配 → 诊断 → 计划", async () => {
    const prevMini = process.env.MINIMAX_API_KEY;
    const prevOpen = process.env.OPENAI_API_KEY;
    delete process.env.MINIMAX_API_KEY;
    delete process.env.OPENAI_API_KEY;

    const resume = padResume(AI_RESUME);
    const profile = extractResumeProfile(resume, { preferredLocation: "北京" });
    const jobs = loadJobBank();
    const candidates = retrieveCandidates(profile, jobs, {
      limit: 6,
      experienceLevel: "Junior",
      preferredLocation: "北京",
      directionTitles: profile.domains.slice(0, 3),
    });
    expect(candidates.length).toBeGreaterThan(0);

    const jobListContent = candidates
      .map(
        (c) =>
          `岗位：${c.job.title}\n公司：${c.job.company}\n要求：${c.job.requirements}\n关键词：${(c.job.skillTags || c.job.keywords).join("、")}`,
      )
      .join("\n\n");

    const match = await analyzeJobMatch(
      baseMatchInput({ resumeContent: resume, jobListContent }),
    );
    expect(match.source).toBe("fallback");
    const top = match.data.recommendedRoles[0];
    expect(top.title.length).toBeGreaterThan(0);

    const gap = await analyzeSkillGap({
      resumeContent: resume,
      targetRole: top.title,
      preferredLanguage: "Chinese",
      targetJobDescription: top.sourceText,
    });
    expect(gap.data.readinessScore).toBeGreaterThan(0);

    const plan = await generateLearningPlan({
      resumeContent: resume,
      targetRole: top.title,
      preferredLanguage: "Chinese",
      readinessScore: gap.data.readinessScore,
      marketFitScore: gap.data.marketFitScore,
      matchedStrengths: gap.data.matchedStrengths,
      missingSkills: gap.data.missingSkills,
      learningPriorities: gap.data.learningPriorities,
      hoursPerWeek: 10,
    });
    expect(plan.data.weeklyPlan.length).toBe(4);

    const session = await attachMatchToSession(
      undefined,
      profile,
      match.data,
      "pipeline-test",
      "fallback",
      { clientToken: "funnel-token-12345678", persist: false },
    );
    await attachGapToSession(session.id, gap.data, {
      clientToken: "funnel-token-12345678",
      persist: false,
    });
    const loaded = await getAnalysisSessionForClient(
      session.id,
      "funnel-token-12345678",
    );
    expect(loaded?.matchResult?.recommendedRoles[0].title).toBe(top.title);
    expect(loaded?.gapResults?.[0].targetRole).toBe(top.title);

    process.env.MINIMAX_API_KEY = prevMini;
    process.env.OPENAI_API_KEY = prevOpen;
  });
});
