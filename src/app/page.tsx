import Link from "next/link";
import { CareerMap3D } from "@/components/home/CareerMap3D";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";

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

export default function Home() {
  return (
    <div className="page-mesh overflow-x-clip">
      {/* Hero: flex column on mobile (no absolute overlap), absolute composition on sm+ */}
      <section className="hero-3d relative flex min-h-[calc(92svh-3.5rem)] flex-col overflow-hidden bg-[#09080c] text-white sm:min-h-[calc(88vh-4rem)] lg:min-h-[min(86vh,780px)]">
        <div className="hero-ambient pointer-events-none absolute inset-0" />
        <CareerMap3D />
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_16%_22%,rgba(46,144,255,0.18),transparent_28%),radial-gradient(circle_at_86%_48%,rgba(139,92,246,0.14),transparent_26%)]" />
        <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/30 to-transparent" />

        <div className="hero-immersive-copy pointer-events-none relative z-[5] mx-auto w-full max-w-5xl px-4 pt-6 text-center sm:absolute sm:inset-x-0 sm:top-10 sm:px-6 sm:pt-0 lg:left-[6%] lg:right-auto lg:top-[18%] lg:mx-0 lg:max-w-xl lg:text-left">
          <div className="mx-auto inline-flex max-w-full items-center gap-2 rounded-full border border-white/15 bg-white/[0.06] px-3 py-1.5 text-[11px] font-semibold text-cyan-200 shadow-2xl shadow-cyan-500/10 backdrop-blur-xl sm:px-4 sm:py-2 sm:text-xs lg:mx-0">
            <span className="status-pulse h-1.5 w-1.5 shrink-0 rounded-full bg-cyan-300" />
            <span className="truncate">AI 驱动 · 精准评估 · 智能匹配</span>
          </div>
          <h1 className="mt-4 text-[1.65rem] font-semibold leading-tight tracking-tight text-white sm:mt-5 sm:text-5xl lg:text-6xl">
            AI 简历评测
            <br />
            智能岗位匹配
          </h1>
          <p className="mx-auto mt-3 max-w-2xl text-sm leading-6 text-slate-400 sm:text-base lg:mx-0">
            上传简历，快速获得 AI 评分、匹配岗位与提升建议，把下一步求职准备变成可执行路径。
          </p>
        </div>

        {/* Visual breathing room for 3D / fallback map on mobile */}
        <div
          className="hero-map-spacer relative z-[1] min-h-[200px] flex-1 sm:min-h-0"
          aria-hidden
        />

        <div className="hero-command-shell relative z-[6] mx-auto w-full max-w-5xl px-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] sm:absolute sm:inset-x-4 sm:bottom-8 sm:px-0 sm:pb-0">
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
                className="hero-primary-btn w-full border border-white/10 bg-gradient-to-r from-sky-500 via-blue-600 to-violet-600 text-white shadow-2xl shadow-blue-500/30 hover:from-sky-400 hover:to-violet-500 sm:w-auto"
              >
                <Link href="/apps/job-match?mode=market-fit">
                  诊断目标岗位
                  <span aria-hidden>→</span>
                </Link>
              </Button>
              <Button
                asChild
                variant="secondary"
                className="w-full border-white/15 bg-white/[0.06] text-white backdrop-blur-xl hover:border-white/25 hover:bg-white/[0.06] sm:w-auto"
              >
                <Link href="/apps/job-match?mode=job-bank">岗位库演练匹配</Link>
              </Button>
              <Button
                asChild
                variant="secondary"
                className="hidden border-white/15 bg-white/[0.04] text-white backdrop-blur-xl hover:border-white/25 hover:bg-white/[0.06] sm:inline-flex"
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

        {/* Soft transition into light sections */}
        <div className="hero-fade-out pointer-events-none absolute inset-x-0 bottom-0 z-[4] h-20 sm:h-28" />
      </section>

      {/* Route bridge: connects 3D story to product */}
      <section className="hero-bridge border-b border-white/10">
        <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 sm:py-14">
          <div className="mb-8 max-w-2xl animate-fade-up">
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-400">
              Career route
            </p>
            <h2 className="mt-2 text-2xl font-semibold tracking-tight text-slate-50">
              从简历到计划，一条分析路径
            </h2>
            <p className="mt-2 text-sm leading-6 text-slate-300">
              上方扫描舱展示简历解析、岗位匹配和能力评估的流转，每一步都能在工作台落地为可执行结果。
            </p>
          </div>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {routeSteps.map((step, index) => (
              <div
                key={step.title}
                className={`animate-fade-up interactive-card rounded-xl border border-white/10 bg-white/[0.04] p-4 shadow-sm stagger-${index + 1}`}
              >
                <p className="text-[11px] font-bold tabular-nums text-cyan-400">
                  {String(index + 1).padStart(2, "0")}
                </p>
                <h3 className="mt-2 text-sm font-semibold text-slate-50">{step.title}</h3>
                <p className="mt-1 text-xs leading-5 text-slate-400">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Capabilities */}
      <section className="border-b border-white/10">
        <div className="mx-auto max-w-6xl px-4 py-14 sm:px-6">
          <div className="mb-8 max-w-2xl animate-fade-up">
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-400">
              Capabilities
            </p>
            <h2 className="mt-2 text-2xl font-semibold tracking-tight text-slate-50">
              三条能力，覆盖求职决策
            </h2>
          </div>
          <div className="grid gap-4 md:grid-cols-3">
            {capabilities.map((item, index) => (
              <Link key={item.title} href={item.href} className="group block">
                <Card
                  className={`interactive-card h-full p-6 animate-fade-up stagger-${index + 1}`}
                >
                  <div className="flex items-center justify-between">
                    <span className="grid h-9 w-9 place-items-center rounded-lg bg-cyan-400/10 text-xs font-bold text-cyan-300 transition group-hover:scale-105 group-hover:bg-cyan-400/15">
                      {item.icon}
                    </span>
                    <span className="text-slate-400 transition group-hover:translate-x-0.5 group-hover:text-cyan-400">
                      →
                    </span>
                  </div>
                  <h3 className="mt-4 text-base font-semibold text-slate-50 group-hover:text-cyan-100">
                    {item.title}
                  </h3>
                  <p className="mt-2 text-sm leading-6 text-slate-300">{item.desc}</p>
                </Card>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="border-b border-white/10 bg-white/[0.03]">
        <div className="mx-auto max-w-6xl px-4 py-14 sm:px-6">
          <div className="grid gap-8 lg:grid-cols-2 lg:items-center">
            <div className="animate-fade-up">
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-400">
                How it works
              </p>
              <h2 className="mt-2 text-2xl font-semibold tracking-tight text-slate-50">
                三步完成一次专业分析
              </h2>
              <ol className="mt-6 space-y-3">
                {steps.map((step, i) => (
                  <li
                    key={step}
                    className={`animate-fade-up interactive-row flex gap-3 rounded-xl border border-transparent px-3 py-3 text-sm leading-6 text-slate-200 stagger-${i + 1}`}
                  >
                    <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-cyan-400/30 bg-cyan-400/15 text-xs font-semibold text-cyan-100 shadow-[0_0_12px_rgba(56,189,248,0.2)]">
                      {i + 1}
                    </span>
                    <span className="pt-0.5">{step}</span>
                  </li>
                ))}
              </ol>
            </div>

            <Card className="animate-fade-up interactive-card overflow-hidden p-0 stagger-2">
              <div className="border-b border-white/10 bg-gradient-to-br from-cyan-500/10 via-transparent to-sky-500/5 px-6 py-4">
                <div className="flex items-center gap-2">
                  <span className="status-pulse h-1.5 w-1.5 rounded-full bg-emerald-400/100" />
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
                      <span className="text-sm text-slate-300">{row.k}</span>
                      <span className="text-right text-sm font-semibold text-slate-50">
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
            </Card>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="relative overflow-hidden border-t border-white/10 bg-[#05060c]">
        <div className="pointer-events-none absolute inset-0 opacity-40">
          <div className="absolute -right-10 top-0 h-40 w-40 rounded-full bg-cyan-500/30 blur-3xl" />
          <div className="absolute -left-10 bottom-0 h-40 w-40 rounded-full bg-violet-500/20 blur-3xl" />
        </div>
        <div className="relative mx-auto flex max-w-6xl flex-col gap-5 px-4 py-12 text-white sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <div className="animate-fade-up">
            <h2 className="text-2xl font-semibold tracking-tight">开始你的职业分析</h2>
            <p className="mt-2 text-sm text-slate-400">
              无需登录，粘贴简历即可获得结构化匹配与差距报告。
            </p>
          </div>
          <div className="flex flex-wrap gap-3 animate-fade-up stagger-2">
            <Link href="/apps/job-match?mode=job-bank">
              <Button variant="command">进入工作台 →</Button>
            </Link>
            <Link href="/apps/job-match/job-bank">
              <Button variant="secondary">浏览岗位库</Button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
