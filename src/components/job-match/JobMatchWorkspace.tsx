"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { WorkspaceAmbient } from "@/components/effects/WorkspaceAmbient";
import { AnalysisStatusCard } from "@/components/job-match/AnalysisStatusCard";
import { CandidateInputPanel } from "@/components/job-match/CandidateInputPanel";
import {
  CareerRouteBar,
  CareerRouteFlags,
  deriveActiveStep,
} from "@/components/job-match/CareerRouteBar";
import { CorpusStatusCard } from "@/components/job-match/CorpusStatusCard";
import { JdBoardCard } from "@/components/job-match/JdBoardCard";
import { JobBankMatchView } from "@/components/job-match/JobBankMatchView";
import { MarketFitView } from "@/components/job-match/MarketFitView";
import { WorkspaceHeader } from "@/components/job-match/WorkspaceHeader";
import { upsertJdBoardItem } from "@/lib/jdBoard";
import {
  AppMode,
  CareerRouteStepId,
  DetailPanel,
} from "@/components/job-match/constants";
import { DismissibleBanner } from "@/components/job-match/workspace/DismissibleBanner";
import { Button } from "@/components/ui/Button";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { useToast } from "@/components/ui/Toast";
import {
  useAnalysisProgress,
  useClientIdentity,
  useJobBankStats,
  useJobMatchAnalysis,
  useLearningPlan,
  useMarketFitAnalysis,
  useResumeInput,
  useResumeOptimization,
} from "@/hooks";
import { useAnalysisLoadPulse } from "@/hooks/useAnalysisLoadPulse";
import { runRoleDirectionAction } from "@/app/apps/job-match/actions";
import { feedback } from "@/lib/fx/feedback";
import { ReportBundle } from "@/lib/reportExport";
import { ActionErrorCode } from "@/lib/actionState";
import { RoleDirection } from "@/types/jobMatch";

function recoveryHint(code?: ActionErrorCode) {
  switch (code) {
    case "VALIDATION_ERROR":
      return "请检查简历字数；目标岗位、真实 JD 或推荐方向任选其一即可。";
    case "PARSE_FAILED":
      return "可改用纯文本粘贴，或上传 PDF / DOCX。";
    case "JOB_BANK_EMPTY":
      return "岗位库为空时会尝试自动生成；也可运行 npm run seed:jobs。";
    case "AI_UNAVAILABLE":
      return "模型暂不可用时会尝试规则回退；也可稍后重试。";
    case "PERSIST_FAILED":
      return "历史记录保存失败不影响本次分析展示。";
    default:
      return null;
  }
}

export function JobMatchWorkspace() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { toast } = useToast();
  const mode: AppMode =
    searchParams.get("mode") === "market-fit" ? "market-fit" : "job-bank";
  const roleParam = searchParams.get("role") || "";
  const jdParam = searchParams.get("jd") || "";

  const [targetRole, setTargetRole] = useState(roleParam);
  const [roleParamSeen, setRoleParamSeen] = useState(roleParam);
  const [optionalJd, setOptionalJd] = useState(jdParam);
  const [jdParamSeen, setJdParamSeen] = useState(jdParam);
  const [activePanel, setActivePanel] = useState<DetailPanel>("overview");
  const [error, setError] = useState("");
  const [errorCode, setErrorCode] = useState<ActionErrorCode | undefined>();
  const [warning, setWarning] = useState("");
  const [copied, setCopied] = useState("");
  const [selectedDirections, setSelectedDirections] = useState<string[]>([]);
  const [suggestedDirections, setSuggestedDirections] = useState<RoleDirection[]>(
    [],
  );
  const [isSuggestingDirections, setIsSuggestingDirections] = useState(false);
  const [hoursPerWeek, setHoursPerWeek] = useState(10);
  const [editingResumeStep, setEditingResumeStep] = useState(false);
  const [proofGithub, setProofGithub] = useState("");
  const [proofPortfolio, setProofPortfolio] = useState("");
  const [proofDemo, setProofDemo] = useState("");
  const resultsRef = useRef<HTMLDivElement | null>(null);

  if (roleParam !== roleParamSeen) {
    setRoleParamSeen(roleParam);
    if (roleParam) setTargetRole(roleParam);
  }
  if (jdParam !== jdParamSeen) {
    setJdParamSeen(jdParam);
    if (jdParam) setOptionalJd(jdParam);
  }

  const resume = useResumeInput();
  const identity = useClientIdentity();
  const { jobBankStats, setJobBankStats } = useJobBankStats();
  const jobMatch = useJobMatchAnalysis();
  const marketFit = useMarketFitAnalysis();
  const learning = useLearningPlan();
  const optimization = useResumeOptimization();

  // Extension short import: ?importId=xxx → sessionStorage (no long URL JD)
  useEffect(() => {
    const importId = searchParams.get("importId");
    if (!importId) return;
    let cancelled = false;
    queueMicrotask(() => {
      if (cancelled) return;
      try {
        const raw = window.sessionStorage.getItem(`yl-jd-import:${importId}`);
        if (!raw) return;
        const data = JSON.parse(raw) as { title?: string; body?: string };
        if (data.title) setTargetRole(data.title);
        if (data.body) setOptionalJd(data.body);
        window.sessionStorage.removeItem(`yl-jd-import:${importId}`);
        const next = new URLSearchParams(searchParams.toString());
        next.delete("importId");
        router.replace(`/apps/job-match?${next.toString()}`, { scroll: false });
      } catch {
        /* ignore */
      }
    });
    return () => {
      cancelled = true;
    };
  }, [searchParams, router]);

  const busy = jobMatch.isAnalyzing || marketFit.isGapAnalyzing;
  const progress = useAnalysisProgress(busy, mode);
  const load = useAnalysisLoadPulse(busy, identity.clientToken);
  const analysisSource =
    mode === "job-bank" ? jobMatch.analysisSource : marketFit.analysisSource;
  const hasJobBankResult = Boolean(jobMatch.result);
  const hasMarketFitResult = Boolean(marketFit.gapResult);
  const resumeReady = resume.input.resumeContent.trim().length >= 100;

  const reportBundle: ReportBundle | null = useMemo(() => {
    if (!jobMatch.result && !marketFit.gapResult && !learning.learningPlan) {
      return null;
    }
    return {
      generatedAt: new Date().toLocaleString("zh-CN"),
      fullName: resume.input.fullName || undefined,
      mode:
        jobMatch.result && marketFit.gapResult
          ? "combined"
          : jobMatch.result
            ? "job-bank"
            : "market-fit",
      jobMatch: jobMatch.result,
      marketFit: marketFit.gapResult,
      learningPlan: learning.learningPlan,
      language: resume.input.preferredLanguage,
    };
  }, [
    jobMatch.result,
    marketFit.gapResult,
    learning.learningPlan,
    resume.input.fullName,
    resume.input.preferredLanguage,
  ]);

  function switchMode(next: AppMode) {
    const params = new URLSearchParams();
    params.set("mode", next);
    if (next === "market-fit" && targetRole.trim()) {
      params.set("role", targetRole.trim());
    }
    router.replace(`/apps/job-match?${params.toString()}`, { scroll: false });
  }

  function scrollToResults() {
    window.setTimeout(() => {
      resultsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 80);
  }

  function beginRun() {
    progress.beginLoading();
    setError("");
    setErrorCode(undefined);
    setWarning("");
    resume.setFieldError("");
  }

  function applyFailure(result: {
    error?: string;
    code?: ActionErrorCode;
  }) {
    if (result.error) {
      setError(result.error);
      setErrorCode(result.code);
      feedback("error");
      if (result.code === "VALIDATION_ERROR" || result.code === "PARSE_FAILED") {
        resume.setFieldError(result.error);
      }
    }
  }

  const routeFlags: CareerRouteFlags = useMemo(() => {
    const resumeReady = resume.input.resumeContent.trim().length >= 100;
    const marketFitTargetReady =
      mode === "market-fit" &&
      resumeReady &&
      (targetRole.trim() || optionalJd.trim().length >= 40 || selectedDirections.length > 0);
    const flags: CareerRouteFlags = {
      resume: resumeReady,
      match: hasJobBankResult || jobMatch.isAnalyzing || Boolean(marketFitTargetReady),
      diagnose: hasMarketFitResult || marketFit.isGapAnalyzing,
      plan: Boolean(learning.learningPlan),
      analyzing: busy,
    };
    flags.active = deriveActiveStep(flags);
    return flags;
  }, [
    resume.input.resumeContent,
    mode,
    targetRole,
    optionalJd,
    selectedDirections.length,
    hasJobBankResult,
    jobMatch.isAnalyzing,
    hasMarketFitResult,
    marketFit.isGapAnalyzing,
    learning.learningPlan,
    busy,
  ]);

  function handleRouteStep(id: CareerRouteStepId) {
    if (id === "match") {
      switchMode("job-bank");
      scrollToResults();
      return;
    }
    if (id === "diagnose") {
      switchMode("market-fit");
      scrollToResults();
      return;
    }
    if (id === "plan") {
      scrollToResults();
    }
  }

  const activeSessionId =
    jobMatch.sessionId || marketFit.sessionId || identity.sessionId;
  const shouldRecommendDirectionFirst =
    !targetRole.trim() && optionalJd.trim().length < 40;
  const resumeOnlyMarketFit =
    mode === "market-fit" && !resumeReady && !hasMarketFitResult && !busy;
  const marketFitTargetStep =
    mode === "market-fit" && resumeReady && !hasMarketFitResult && !busy;
  const showFloatingCta = (busy || resumeReady) && !marketFitTargetStep;
  const hasMarketFitTarget =
    Boolean(targetRole.trim()) || optionalJd.trim().length >= 40;

  function rememberSession(sessionId?: string) {
    if (!sessionId) return;
    jobMatch.setSessionId(sessionId);
    marketFit.setSessionId(sessionId);
    identity.setSessionId(sessionId);
  }

  async function handleJobBankMatch() {
    const directions: RoleDirection[] = selectedDirections.map((title) => {
      const fromSuggest = suggestedDirections.find((d) => d.title === title);
      return (
        fromSuggest || {
          title,
          matchScore: 70,
          reason: "用户选定方向",
          levelHint: "",
          searchKeywords: [title],
          bossQuery: title,
          zhilianQuery: title,
          typicalRequirements: [],
        }
      );
    });

    const outcome = await jobMatch.runJobBankMatch({
      input: resume.input,
      validateResume: resume.validateResume,
      beginLoading: beginRun,
      completeLoading: progress.completeLoading,
      onStats: setJobBankStats,
      onJobListContent: (content) => resume.updateInput("jobListContent", content),
      sessionId: activeSessionId || undefined,
      clientToken: identity.clientToken || undefined,
      persistHistory: identity.persistHistory,
      directions,
    });
    if (!outcome.ok) {
      applyFailure(outcome);
      return;
    }
    rememberSession(outcome.sessionId);
    setActivePanel("overview");
    if (outcome.warning) setWarning(outcome.warning);
    feedback("success");
    scrollToResults();
  }

  async function handleSuggestDirections() {
    if (!resume.validateResume()) {
      applyFailure({
        error: "简历内容不足，无法推荐方向。",
        code: "VALIDATION_ERROR",
      });
      return;
    }
    setIsSuggestingDirections(true);
    setError("");
    try {
      const response = await runRoleDirectionAction({
        fullName: resume.input.fullName,
        currentStatus: resume.input.currentStatus,
        experienceLevel: resume.input.experienceLevel,
        preferredLanguage: resume.input.preferredLanguage,
        preferredLocation: resume.input.preferredLocation,
        resumeContent: resume.input.resumeContent,
      });
      if (!response.ok) {
        applyFailure(response);
        return;
      }
      setSuggestedDirections(response.data.directions || []);
      if (response.data.directions?.length) {
        const topDirections = response.data.directions.slice(0, 3).map((d) => d.title);
        setSelectedDirections(topDirections);
        if (mode === "market-fit" && !targetRole.trim() && topDirections[0]) {
          setTargetRole(topDirections[0]);
        }
      }
      if (response.warning) setWarning(response.warning);
      feedback("success");
      toast("已根据简历推荐目标方向，可再点选调整");
    } catch {
      applyFailure({
        error: "方向推荐失败，请稍后重试。",
        code: "AI_UNAVAILABLE",
      });
    } finally {
      setIsSuggestingDirections(false);
    }
  }

  function toggleDirection(title: string) {
    setSelectedDirections((prev) =>
      prev.includes(title) ? prev.filter((t) => t !== title) : [...prev, title],
    );
  }

  async function handleMarketFit(
    roleTitle = targetRole,
    jd = optionalJd,
    options?: { inline?: boolean },
  ) {
    if (!options?.inline) {
      learning.clearLearningPlan();
    }
    const proofLinks = {
      github: proofGithub.trim() || undefined,
      portfolio: proofPortfolio.trim() || undefined,
      demos: proofDemo.trim() ? [proofDemo.trim()] : undefined,
    };
    const outcome = await marketFit.runMarketFit({
      resumeContent: resume.input.resumeContent,
      preferredLanguage: resume.input.preferredLanguage,
      targetRole: roleTitle.trim() || (jd.trim() ? "目标岗位" : ""),
      optionalJd: jd,
      proofLinks,
      validateResume: resume.validateResume,
      beginLoading: beginRun,
      completeLoading: progress.completeLoading,
      onFieldError: resume.setFieldError,
      sessionId: activeSessionId,
      clientToken: identity.clientToken || undefined,
      persistHistory: identity.persistHistory,
      keepPrevious: Boolean(options?.inline),
    });
    if (!outcome.ok) {
      applyFailure(outcome);
      return;
    }
    rememberSession(outcome.sessionId);
    if (roleTitle.trim() && (jd || optionalJd).trim().length >= 20) {
      upsertJdBoardItem({
        title: roleTitle.trim(),
        jd: (jd || optionalJd).trim(),
        status: "diagnosed",
        readinessScore: outcome.readinessScore,
      });
    }
    if (outcome.warning) setWarning(outcome.warning);
    feedback("success");
    scrollToResults();
  }

  async function handleLearningPlan() {
    if (!marketFit.gapResult) return;
    setError("");
    setErrorCode(undefined);
    const outcome = await learning.generateLearningPlanFromGap({
      resumeContent: resume.input.resumeContent,
      preferredLanguage: resume.input.preferredLanguage,
      gapResult: marketFit.gapResult,
      validateResume: resume.validateResume,
      sessionId: activeSessionId,
      clientToken: identity.clientToken || undefined,
      persistHistory: identity.persistHistory,
      hoursPerWeek,
    });
    if (!outcome.ok) {
      applyFailure(outcome);
      return;
    }
    rememberSession(outcome.sessionId);
    if (outcome.warning) setWarning(outcome.warning);
    feedback("success");
    scrollToResults();
  }

  async function handleOptimize(role = jobMatch.activeRole) {
    if (!role) return;
    setError("");
    setErrorCode(undefined);
    const outcome = await optimization.submitResumeOptimization({
      originalResume: resume.input.resumeContent,
      preferredLanguage: resume.input.preferredLanguage,
      role,
      sessionId: activeSessionId,
      clientToken: identity.clientToken || undefined,
      persistHistory: identity.persistHistory,
    });
    if (!outcome.ok) {
      applyFailure(outcome);
      return;
    }
    rememberSession(outcome.sessionId);
    setActivePanel("resume");
    if (outcome.warning) setWarning(outcome.warning);
    feedback("success");
  }

  async function handleFileUpload(
    event: Parameters<typeof resume.handleResumeFileUpload>[0],
  ) {
    setError("");
    setErrorCode(undefined);
    const outcome = await resume.handleResumeFileUpload(event);
    if (outcome && !outcome.ok) {
      applyFailure(outcome);
    }
  }

  function fillSample() {
    resume.fillSample();
    setTargetRole("AI Agent 开发工程师");
    setError("");
    setErrorCode(undefined);
  }

  async function copyText(label: string, text: string) {
    try {
      await navigator.clipboard.writeText(text);
      toast("已复制到剪贴板");
    } catch {
      console.warn("Clipboard write failed.");
      toast("复制失败，请手动选择文本");
    }
    setCopied(label);
    window.setTimeout(() => setCopied(""), 1600);
  }

  /** Funnel primary CTA: one clear next step. */
  const primaryCta = (() => {
    if (busy) {
      return (
        <Button variant="command" className="h-11 w-full" disabled>
          <LoadingSpinner />
          分析中，请稍候
        </Button>
      );
    }

    if (mode === "job-bank") {
      if (!hasJobBankResult) {
        return (
          <Button
            variant="command"
            className="h-11 w-full"
            disabled={!resumeReady}
            onClick={() => {
              if (!resumeReady) return;
              feedback("click");
              void handleJobBankMatch();
            }}
          >
            {resumeReady ? "开始岗位匹配" : "补足 100 字后开始"}
          </Button>
        );
      }
      if (!hasMarketFitResult) {
        return (
          <Button
            variant="command"
            className="h-11 w-full"
            disabled={!jobMatch.activeRole}
            onClick={() => {
              feedback("click");
              if (!jobMatch.activeRole) return;
              setTargetRole(jobMatch.activeRole.title);
              setOptionalJd(jobMatch.activeRole.sourceText || "");
              setActivePanel("gap");
              void handleMarketFit(
                jobMatch.activeRole.title,
                jobMatch.activeRole.sourceText || "",
                { inline: true },
              );
            }}
          >
            诊断 Top1「{jobMatch.activeRole?.title || "岗位"}」
          </Button>
        );
      }
      if (!learning.learningPlan) {
        return (
          <Button
            variant="command"
            className="h-11 w-full"
            disabled={learning.isLearningPlan}
            onClick={() => {
              feedback("click");
              setActivePanel("plan");
              void handleLearningPlan();
            }}
          >
            {learning.isLearningPlan ? <LoadingSpinner /> : null}
            生成 30 天计划
          </Button>
        );
      }
      if (!optimization.optimizationResult) {
        return (
          <Button
            variant="command"
            className="h-11 w-full"
            disabled={optimization.isOptimizing || !jobMatch.activeRole}
            onClick={() => {
              feedback("click");
              void handleOptimize();
            }}
          >
            {optimization.isOptimizing ? <LoadingSpinner /> : null}
            优化这份简历
          </Button>
        );
      }
      return (
        <Button
          variant="command"
          className="h-11 w-full"
          onClick={() => {
            feedback("click");
            window.location.assign("/apps/job-match/history");
          }}
        >
          查看历史会话 / 导出报告
        </Button>
      );
    }

    // market-fit mode
    if (!hasMarketFitResult) {
      return (
          <Button
            variant="command"
            className="h-11 w-full"
          disabled={!resumeReady || isSuggestingDirections}
          onClick={() => {
            if (!resumeReady) return;
            feedback("click");
            if (shouldRecommendDirectionFirst) {
              void handleSuggestDirections();
              return;
            }
            void handleMarketFit();
          }}
        >
          {isSuggestingDirections ? <LoadingSpinner /> : null}
          {!resumeReady
            ? "补足 100 字后开始"
            : shouldRecommendDirectionFirst
              ? "先推荐可投方向"
              : optionalJd.trim().length >= 40
                ? "开始真实 JD 诊断"
                : "开始能力诊断"}
        </Button>
      );
    }
    if (!learning.learningPlan) {
      return (
        <Button
          variant="command"
          className="h-11 w-full"
          disabled={learning.isLearningPlan}
          onClick={() => {
            feedback("click");
            void handleLearningPlan();
          }}
        >
          {learning.isLearningPlan ? <LoadingSpinner /> : null}
          生成 30 天计划
        </Button>
      );
    }
    return (
      <Button
        variant="command"
        className="h-11 w-full"
        onClick={() => {
          feedback("click");
          switchMode("job-bank");
          scrollToResults();
        }}
      >
        回到匹配结果 / 优化简历
      </Button>
    );
  })();

  const hint = recoveryHint(errorCode);
  const resumeInputPanel = (
    <CandidateInputPanel
      input={resume.input}
      fieldError={resume.fieldError}
      uploadHint={resume.uploadHint}
      isParsingFile={resume.isParsingFile}
      persistHistory={identity.persistHistory}
      onPersistHistoryChange={identity.setPersistHistory}
      onUpdate={resume.updateInput}
      onFillSample={fillSample}
      onFileUpload={handleFileUpload}
    />
  );

  return (
    <div className="page-mesh relative min-h-[calc(100svh-3.5rem)] overflow-hidden pb-[calc(5.5rem+env(safe-area-inset-bottom,0px))] xl:pb-10">
      <WorkspaceAmbient />
      <div className="relative z-10">
      <WorkspaceHeader
        mode={mode}
        jobBankTotal={jobBankStats?.total ?? 0}
        hasJobBankResult={hasJobBankResult}
        hasMarketFitResult={hasMarketFitResult}
        busy={busy}
        routeFlags={routeFlags}
        onModeChange={switchMode}
        onRouteStep={handleRouteStep}
      />

      <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6">
        {error ? (
          <DismissibleBanner
            tone="error"
            onClose={() => {
              setError("");
              setErrorCode(undefined);
            }}
          >
            <div>
              <p>{error}</p>
              {hint ? <p className="mt-1 text-xs opacity-80">{hint}</p> : null}
            </div>
          </DismissibleBanner>
        ) : null}
        {warning ? (
          <DismissibleBanner tone="warn" onClose={() => setWarning("")}>
            {warning}
          </DismissibleBanner>
        ) : null}

        {resumeOnlyMarketFit ? (
          <div className="mx-auto max-w-xl animate-fade-up">
            {resumeInputPanel}
            <p className="mt-4 rounded-xl border border-cyan-400/15 bg-cyan-400/[0.06] px-4 py-3 text-xs leading-6 text-slate-300">
              先放入简历。达到 100 字后，系统会进入下一步：推荐可投方向或对照目标岗位描述做诊断。
            </p>
          </div>
        ) : marketFitTargetStep ? (
          <div className="mx-auto max-w-2xl animate-fade-up space-y-4">
            <div className="rounded-xl border border-emerald-400/20 bg-emerald-400/[0.06] px-4 py-3">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="pro-label">Step 1 complete</p>
                  <h2 className="mt-1 text-sm font-semibold text-emerald-100">
                    简历已就绪
                  </h2>
                  <p className="mt-1 text-xs leading-5 text-slate-400">
                    {hasMarketFitTarget
                      ? `已选择「${targetRole.trim() || "目标岗位"}」，可以开始能力诊断。`
                      : "下一步只需要选择分析对象：不知道岗位就推荐方向，已有岗位就粘贴岗位描述。"}
                  </p>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  <span className="rounded-full border border-emerald-400/25 bg-emerald-400/10 px-3 py-1 text-[11px] font-semibold text-emerald-200">
                    {resume.input.resumeContent.trim().length} 字
                  </span>
                  <button
                    type="button"
                    className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-[11px] font-semibold text-slate-300 transition hover:border-white/20 hover:text-slate-100"
                    onClick={() => setEditingResumeStep((value) => !value)}
                  >
                    {editingResumeStep ? "收起简历" : "修改简历"}
                  </button>
                </div>
              </div>
            </div>

            {editingResumeStep ? <div>{resumeInputPanel}</div> : null}

            <CorpusStatusCard
              mode={mode}
              jobBankStats={jobBankStats}
              targetRole={targetRole}
              optionalJd={optionalJd}
              selectedDirections={selectedDirections}
              suggestedDirections={suggestedDirections}
              isSuggestingDirections={isSuggestingDirections}
              proofGithub={proofGithub}
              proofPortfolio={proofPortfolio}
              proofDemo={proofDemo}
              onTargetRoleChange={(value) => {
                setTargetRole(value);
                resume.setFieldError("");
              }}
              onOptionalJdChange={setOptionalJd}
              onToggleDirection={toggleDirection}
              onClearDirections={() => setSelectedDirections([])}
              onSuggestDirections={() => void handleSuggestDirections()}
              onProofGithubChange={setProofGithub}
              onProofPortfolioChange={setProofPortfolio}
              onProofDemoChange={setProofDemo}
            />

            <div>{primaryCta}</div>
          </div>
        ) : (
        <div className="grid gap-5 xl:grid-cols-[340px_minmax(0,1fr)]">
          <aside className="animate-fade-up space-y-4 xl:sticky xl:top-36 xl:self-start">
            {resumeInputPanel}
            <CorpusStatusCard
              mode={mode}
              jobBankStats={jobBankStats}
              targetRole={targetRole}
              optionalJd={optionalJd}
              selectedDirections={selectedDirections}
              suggestedDirections={suggestedDirections}
              isSuggestingDirections={isSuggestingDirections}
              proofGithub={proofGithub}
              proofPortfolio={proofPortfolio}
              proofDemo={proofDemo}
              onTargetRoleChange={(value) => {
                setTargetRole(value);
                resume.setFieldError("");
              }}
              onOptionalJdChange={setOptionalJd}
              onToggleDirection={toggleDirection}
              onClearDirections={() => setSelectedDirections([])}
              onSuggestDirections={() => void handleSuggestDirections()}
              onProofGithubChange={setProofGithub}
              onProofPortfolioChange={setProofPortfolio}
              onProofDemoChange={setProofDemo}
            />
            {mode === "market-fit" ? (
              <JdBoardCard
                currentTitle={targetRole}
                currentJd={optionalJd}
                lastReadiness={marketFit.gapResult?.readinessScore}
                onLoad={(item) => {
                  setTargetRole(item.title);
                  setOptionalJd(item.jd);
                  toast("已载入看板 JD");
                }}
              />
            ) : null}
            <div className="hidden xl:block">{primaryCta}</div>
          </aside>

          <main className="animate-fade-up space-y-4 stagger-2" ref={resultsRef}>
            {(hasJobBankResult || hasMarketFitResult || busy) && (
              <div className="glass-panel rounded-xl p-3">
                <p className="pro-label mb-2">Path progress</p>
                <CareerRouteBar
                  compact
                  flags={routeFlags}
                  onStepClick={handleRouteStep}
                />
              </div>
            )}
            <AnalysisStatusCard
              mode={mode}
              busy={busy}
              hasJobBankResult={hasJobBankResult}
              hasMarketFitResult={hasMarketFitResult}
              resumeReady={resumeReady}
              elapsedMs={progress.elapsedMs}
              stageIndex={progress.stageIndex}
              stages={progress.stages}
              analysisSource={analysisSource}
              reportBundle={reportBundle}
              reportDisabled={busy || learning.isLearningPlan}
              load={load}
            />

            {mode === "job-bank" ? (
              <JobBankMatchView
                isAnalyzing={jobMatch.isAnalyzing}
                result={jobMatch.result}
                sortedRoles={jobMatch.sortedRoles}
                activeRole={jobMatch.activeRole}
                activePanel={activePanel}
                gapResult={marketFit.gapResult}
                optimizationResult={optimization.optimizationResult}
                learningPlan={learning.learningPlan}
                isGapAnalyzing={marketFit.isGapAnalyzing}
                isOptimizing={optimization.isOptimizing}
                isLearningPlan={learning.isLearningPlan}
                copied={copied}
                profile={jobMatch.profile}
                pipeline={jobMatch.pipeline}
                onSelectRole={(role) => {
                  jobMatch.setSelectedRole(role);
                  setActivePanel("overview");
                }}
                onPanelChange={setActivePanel}
                onGap={() => {
                  if (!jobMatch.activeRole) return;
                  setTargetRole(jobMatch.activeRole.title);
                  setOptionalJd(jobMatch.activeRole.sourceText || "");
                  setActivePanel("gap");
                  void handleMarketFit(
                    jobMatch.activeRole.title,
                    jobMatch.activeRole.sourceText || "",
                    { inline: true },
                  );
                }}
                onOptimize={() => void handleOptimize(jobMatch.activeRole || undefined)}
                onGeneratePlan={() => {
                  setActivePanel("plan");
                  void handleLearningPlan();
                }}
                onCopy={copyText}
                onStartAnalysis={
                  resumeReady ? () => void handleJobBankMatch() : undefined
                }
              />
            ) : (
              <MarketFitView
                busy={marketFit.isGapAnalyzing}
                gapResult={marketFit.gapResult}
                targetRole={targetRole}
                learningPlan={learning.learningPlan}
                isLearningPlan={learning.isLearningPlan}
                needsDirectionFirst={shouldRecommendDirectionFirst}
                isSuggestingDirections={isSuggestingDirections}
                showInlineAction
                hoursPerWeek={hoursPerWeek}
                onHoursPerWeekChange={setHoursPerWeek}
                onGeneratePlan={() => void handleLearningPlan()}
                onStartDiagnosis={
                  resumeReady
                    ? () => {
                        if (shouldRecommendDirectionFirst) {
                          void handleSuggestDirections();
                          return;
                        }
                        void handleMarketFit();
                      }
                    : undefined
                }
              />
            )}
          </main>
        </div>
        )}
      </div>

      {showFloatingCta ? (
        <div className="cta-float fixed inset-x-0 bottom-0 z-30 border-t border-white/10 bg-[color-mix(in_srgb,var(--yl-bg)_95%,transparent)] p-3 backdrop-blur-md xl:hidden">
          <div className="mx-auto max-w-6xl min-w-0">{primaryCta}</div>
        </div>
      ) : null}
      </div>
    </div>
  );
}
