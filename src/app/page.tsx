import Link from "next/link";
import { AnalysisConsolePreview } from "@/components/home/AnalysisConsolePreview";
import { CareerMap3D } from "@/components/home/CareerMap3D";
import { Button } from "@/components/ui/Button";

const capabilities = [
  {
    title: "目标岗位诊断",
    desc: "粘贴招聘页岗位描述，评估准备度、能力缺口与是否值得投。",
    icon: "01",
    href: "/apps/job-match?mode=market-fit",
  },
  {
    title: "岗位库演练",
    desc: "对照合成市场样本排序，练习方向判断与能力对照（非实时在招）。",
    icon: "02",
    href: "/apps/job-match?mode=job-bank",
  },
  {
    title: "行动与优化",
    desc: "生成 30 天计划与简历改写建议，把分析结果落到下一步求职准备。",
    icon: "03",
    href: "/apps/job-match?mode=market-fit",
  },
];

const routeSteps = [
  { title: "简历解析", desc: "提取技能、经验与证据" },
  { title: "岗位匹配", desc: "对照市场样本排序" },
  { title: "差距诊断", desc: "定位缺口与准备度" },
  { title: "行动计划", desc: "学习路径与简历优化" },
];

const steps = [
  "上传或粘贴简历，补充状态与经验信息",
  "选择岗位匹配，或输入目标岗位做差距诊断",
  "阅读结构化结果：排序、分数、缺口与行动建议",
];

const sampleRows = [
  { k: "岗位匹配度", v: "88%", bar: 88 },
  { k: "市场准备度", v: "72%", bar: 72 },
  { k: "优先补齐", v: "RAG 评测 / 系统稳定性", bar: null },
  { k: "建议动作", v: "调整项目表述 · 补 1 个闭环案例", bar: null },
];

const trustMetrics = [
  { value: "92%", label: "示例匹配峰值" },
  { value: "30 天", label: "行动计划" },
  { value: "5 类", label: "能力证据" },
  { value: "3 步", label: "完成分析" },
];

const trustNotes = [
  "AI 分析仅作为职业准备参考",
  "岗位库为市场风格样本数据",
  "支持目标岗位 JD 诊断",
  "可导出结构化报告",
];

export default function Home() {
  return (
    <div className="overflow-x-clip">
      {/* Hero: left copy + right cockpit */}
      <section className="hero-3d relative flex min-h-[calc(100vh-72px)] flex-col overflow-hidden pb-6 text-white lg:pb-10">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_16%_22%,rgba(34,211,238,0.14),transparent_28%),radial-gradient(circle_at_86%_48%,rgba(124,58,237,0.12),transparent_26%)]" />
        <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/25 to-transparent" />

        <div className="relative z-[5] mx-auto grid w-full max-w-6xl flex-1 grid-cols-1 items-center gap-8 px-4 pt-8 sm:px-6 lg:grid-cols-2 lg:gap-10 lg:pt-12">
          {/* Left: copy + CTAs */}
          <div className="animate-fade-up relative z-[6] max-w-xl">
            <div className="inline-flex max-w-full items-center gap-2 rounded-full border border-white/15 bg-white/[0.06] px-3 py-1.5 text-[11px] font-semibold text-cyan-200 shadow-2xl shadow-cyan-500/10 backdrop-blur-xl sm:px-4 sm:py-2 sm:text-xs">
              <span className="status-pulse h-1.5 w-1.5 shrink-0 rounded-full bg-cyan-300" />
              <span className="truncate">AI 驱动 · 精准评估 · 智能匹配</span>
            </div>

            <h1 className="mt-5 text-4xl font-semibold leading-[1.12] tracking-tight text-white sm:text-5xl lg:text-6xl xl:text-7xl">
              AI 简历评测
              <br />
              <span className="shiny-text">智能岗位匹配</span>
            </h1>

            <p className="mt-4 max-w-lg text-sm leading-6 text-slate-400 sm:text-base sm:leading-7">
              上传简历或粘贴目标岗位，快速获得 AI 评分、匹配排序、能力缺口与下一步行动计划。
            </p>

            <div className="mt-6 flex w-full flex-col gap-3 sm:flex-row sm:flex-wrap">
              <Button
                asChild
                variant="command"
                className="hero-primary-btn min-h-11 w-full rounded-full px-6 sm:w-auto"
              >
                <Link href="/apps/job-match?mode=job-bank">
                  开始分析
                  <span aria-hidden>→</span>
                </Link>
              </Button>
              <Button
                asChild
                variant="secondary"
                className="min-h-11 w-full rounded-full border-white/15 bg-white/[0.05] text-white backdrop-blur-xl hover:border-white/25 sm:w-auto"
              >
                <Link href="/apps/job-match?mode=job-bank">岗位库演练匹配</Link>
              </Button>
            </div>

            <p className="mt-3 text-xs leading-5 text-slate-500">
              无需登录，粘贴简历即可生成结构化分析
            </p>
          </div>

          {/* Right: 3D scan + dashboard */}
          <div className="hero-cockpit relative z-[4] min-h-[360px] w-full !overflow-visible !border-0 !bg-transparent !shadow-none animate-fade-up stagger-2 sm:min-h-[400px] lg:min-h-[520px]">
            <CareerMap3D />
          </div>
        </div>

        {/* Bottom glass action bar */}
        <div className="hero-command-shell relative z-[6] mx-auto mt-6 w-full max-w-6xl px-3 sm:mt-8 sm:px-6">
          <div className="hero-command-bar">
            <div className="min-w-0">
              <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-cyan-200">
                Start analysis
              </p>
              <p className="mt-1 text-sm font-medium text-white sm:truncate">
                进入工作台，完成匹配或诊断
              </p>
            </div>
            <div className="hero-command-actions">
              <Button
                asChild
                className="hero-primary-btn w-full min-h-10 rounded-full border border-white/10 bg-gradient-to-r from-sky-400 via-cyan-400 to-violet-500 text-slate-950 shadow-xl shadow-cyan-500/20 hover:from-sky-300 hover:to-violet-400 sm:w-auto"
              >
                <Link href="/apps/job-match?mode=market-fit">
                  诊断目标岗位
                  <span aria-hidden>→</span>
                </Link>
              </Button>
              <Button
                asChild
                variant="secondary"
                className="w-full min-h-10 rounded-full border-white/15 bg-white/[0.06] text-white backdrop-blur-xl hover:border-white/25 hover:bg-white/[0.08] sm:w-auto"
              >
                <Link href="/apps/job-match?mode=job-bank">岗位库演练匹配</Link>
              </Button>
              <Button
                asChild
                variant="secondary"
                className="hidden min-h-10 rounded-full border-white/15 bg-white/[0.04] text-white backdrop-blur-xl hover:border-white/25 hover:bg-white/[0.06] sm:inline-flex"
              >
                <Link href="/apps/job-match/job-bank">浏览合成岗位库</Link>
              </Button>
            </div>
            <div className="hero-command-meta">
              <span>岗位描述优先</span>
              <span>合成样本演练</span>
              <span>可导出报告</span>
            </div>
          </div>
        </div>

        <div className="hero-fade-out pointer-events-none absolute inset-x-0 bottom-0 z-[3] h-16 sm:h-20" />
      </section>

      {/* Career route */}
      <section className="border-b border-white/10">
        <div className="mx-auto max-w-6xl px-4 py-14 sm:px-6 sm:py-16">
          <div className="mb-8 max-w-2xl animate-fade-up">
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
              Career route
            </p>
            <h2 className="mt-2 text-2xl font-semibold tracking-tight text-slate-50 sm:text-3xl">
              从简历到计划，一条分析路径
            </h2>
            <p className="mt-2 max-w-xl text-sm leading-6 text-slate-400">
              从简历解析、岗位匹配到差距诊断，每一步都沉淀为可执行的求职决策。
            </p>
          </div>

          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {routeSteps.map((step, index) => (
              <div key={step.title} className="relative">
                {index < routeSteps.length - 1 ? (
                  <span
                    className="pointer-events-none absolute -right-2 top-1/2 z-10 hidden h-px w-4 -translate-y-1/2 bg-gradient-to-r from-cyan-400/40 to-transparent lg:block"
                    aria-hidden
                  />
                ) : null}
                <div
                  className={`liquid-glass interactive-card animate-fade-up rounded-2xl p-5 stagger-${index + 1}`}
                >
                  <p className="text-[11px] font-bold tabular-nums tracking-wider text-cyan-400">
                    {String(index + 1).padStart(2, "0")}
                  </p>
                  <h3 className="mt-2 text-sm font-semibold text-slate-50">{step.title}</h3>
                  <p className="mt-1 text-xs leading-5 text-slate-400">{step.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Capabilities */}
      <section className="border-b border-white/10">
        <div className="mx-auto max-w-6xl px-4 py-14 sm:px-6 sm:py-16">
          <div className="mb-8 max-w-2xl animate-fade-up">
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
              Capabilities
            </p>
            <h2 className="mt-2 text-2xl font-semibold tracking-tight text-slate-50 sm:text-3xl">
              三条能力，覆盖求职决策
            </h2>
          </div>
          <div className="grid gap-4 md:grid-cols-3">
            {capabilities.map((item, index) => (
              <Link key={item.title} href={item.href} className="group block">
                <div
                  className={`liquid-glass interactive-card h-full rounded-2xl p-6 animate-fade-up stagger-${index + 1}`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold tracking-wider text-cyan-300/90">
                      {item.icon} →
                    </span>
                  </div>
                  <h3 className="mt-4 text-base font-semibold text-slate-50 group-hover:text-cyan-100">
                    {item.title}
                  </h3>
                  <p className="mt-2 text-sm leading-6 text-slate-400">{item.desc}</p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Analysis Console preview */}
      <section className="border-b border-white/10">
        <div className="mx-auto max-w-6xl px-4 py-14 sm:px-6 sm:py-16">
          <div className="mb-8 max-w-2xl animate-fade-up">
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
              Analysis console
            </p>
            <h2 className="mt-2 text-2xl font-semibold tracking-tight text-slate-50 sm:text-3xl">
              职业分析工作台预览
            </h2>
            <p className="mt-2 max-w-xl text-sm leading-6 text-slate-400">
              从分析入口到候选排序与结构化报告，一次工作流覆盖匹配、缺口与行动建议。
            </p>
          </div>
          <AnalysisConsolePreview />
        </div>
      </section>

      {/* How it works */}
      <section className="border-b border-white/10">
        <div className="mx-auto max-w-6xl px-4 py-14 sm:px-6 sm:py-16">
          <div className="grid gap-8 lg:grid-cols-2 lg:items-center">
            <div className="animate-fade-up">
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
                How it works
              </p>
              <h2 className="mt-2 text-2xl font-semibold tracking-tight text-slate-50 sm:text-3xl">
                三步完成一次专业分析
              </h2>
              <ol className="mt-6 space-y-3">
                {steps.map((step, i) => (
                  <li
                    key={step}
                    className={`liquid-glass animate-fade-up interactive-row flex gap-3 rounded-xl px-4 py-3.5 text-sm leading-6 text-slate-200 stagger-${i + 1}`}
                  >
                    <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-cyan-400/30 bg-cyan-400/15 text-xs font-semibold text-cyan-100">
                      {i + 1}
                    </span>
                    <span className="pt-0.5">{step}</span>
                  </li>
                ))}
              </ol>
            </div>

            <div className="liquid-glass animate-fade-up interactive-card overflow-hidden rounded-2xl p-0 stagger-2">
              <div className="border-b border-white/10 px-6 py-4">
                <div className="flex items-center gap-2">
                  <span className="status-pulse h-1.5 w-1.5 rounded-full bg-emerald-400" />
                  <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                    输出示例
                  </p>
                </div>
              </div>
              <div className="space-y-0 px-6 py-2">
                {sampleRows.map((row, i) => (
                  <div
                    key={row.k}
                    className={`animate-fade-up border-b border-white/10 py-3.5 last:border-0 stagger-${i + 1}`}
                  >
                    <div className="flex items-center justify-between gap-3">
                      <span className="text-sm text-slate-400">{row.k}</span>
                      <span className="max-w-[55%] text-right text-sm font-semibold text-slate-50">
                        {row.v}
                      </span>
                    </div>
                    {row.bar != null ? (
                      <div className="score-track mt-2">
                        <div
                          className={`score-fill ${row.bar >= 80 ? "score-fill-high" : "score-fill-mid"}`}
                          style={{ width: `${row.bar}%` }}
                        />
                      </div>
                    ) : null}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Trust */}
      <section className="border-b border-white/10">
        <div className="mx-auto max-w-6xl px-4 py-14 sm:px-6 sm:py-16">
          <div className="mb-8 max-w-2xl animate-fade-up">
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
              Trust
            </p>
            <h2 className="mt-2 text-2xl font-semibold tracking-tight text-slate-50 sm:text-3xl">
              可信说明
            </h2>
          </div>

          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {trustMetrics.map((m, i) => (
              <div
                key={m.label}
                className={`liquid-glass animate-fade-up rounded-2xl p-4 text-center stagger-${i + 1}`}
              >
                <p className="text-2xl font-semibold tracking-tight text-cyan-200 sm:text-3xl">
                  {m.value}
                </p>
                <p className="mt-1 text-xs text-slate-500">{m.label}</p>
              </div>
            ))}
          </div>

          <ul className="mt-6 grid gap-2 sm:grid-cols-2">
            {trustNotes.map((note) => (
              <li
                key={note}
                className="flex items-start gap-2 text-sm leading-6 text-slate-400"
              >
                <span className="mt-2 h-1 w-1 shrink-0 rounded-full bg-cyan-400/70" />
                {note}
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* Final CTA */}
      <section className="relative overflow-hidden py-14 sm:py-16">
        <div className="pointer-events-none absolute inset-0 opacity-50">
          <div className="absolute -right-10 top-0 h-48 w-48 rounded-full bg-cyan-500/25 blur-3xl" />
          <div className="absolute -left-10 bottom-0 h-48 w-48 rounded-full bg-violet-500/20 blur-3xl" />
        </div>
        <div className="relative mx-auto max-w-6xl px-4 sm:px-6">
          <div className="liquid-glass animate-fade-up rounded-2xl p-8 sm:p-10">
            <h2 className="max-w-xl text-2xl font-semibold tracking-tight text-white sm:text-3xl">
              把求职判断，变成一份可执行计划。
            </h2>
            <p className="mt-3 max-w-lg text-sm leading-6 text-slate-400">
              从简历、岗位到行动建议，Yifei Labs 帮你看清匹配度、差距和下一步。
            </p>
            <div className="mt-6 flex w-full flex-col gap-3 sm:flex-row sm:flex-wrap">
              <Button asChild variant="command" className="min-h-11 w-full rounded-full sm:w-auto">
                <Link href="/apps/job-match?mode=job-bank">
                  开始分析
                  <span aria-hidden>→</span>
                </Link>
              </Button>
              <Button
                asChild
                variant="secondary"
                className="min-h-11 w-full rounded-full border-white/15 bg-white/[0.05] text-white sm:w-auto"
              >
                <Link href="/apps/job-match/job-bank">浏览岗位库</Link>
              </Button>
            </div>
            <p className="mt-5 max-w-xl text-xs leading-5 text-slate-500">
              岗位库为市场风格样本数据，仅供分析参考，不构成真实招聘邀约。
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
