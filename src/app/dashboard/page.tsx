import { Card } from "@/components/ui/Card";
import { HardLink } from "@/components/ui/HardLink";

const apps = [
  {
    title: "职业匹配与能力诊断",
    href: "/apps/job-match?mode=job-bank",
    status: "可用" as const,
    desc: "岗位匹配排序 · 目标岗市场差距分析",
    accent: "from-cyan-500/15 to-transparent",
  },
  {
    title: "作品集生成器",
    href: "#",
    status: "规划中" as const,
    desc: "即将上线",
    accent: "from-white/[0.04] to-transparent",
  },
  {
    title: "落地页生成器",
    href: "#",
    status: "规划中" as const,
    desc: "即将上线",
    accent: "from-white/[0.04] to-transparent",
  },
  {
    title: "视频脚本生成器",
    href: "#",
    status: "规划中" as const,
    desc: "即将上线",
    accent: "from-white/[0.04] to-transparent",
  },
  {
    title: "Prompt 生成器",
    href: "#",
    status: "规划中" as const,
    desc: "即将上线",
    accent: "from-white/[0.04] to-transparent",
  },
];

export default function DashboardPage() {
  return (
    <div className="page-mesh min-h-[calc(100vh-3.5rem)]">
      <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
        <div className="career-map-panel animate-fade-up rounded-3xl px-5 py-6 text-white sm:px-7 lg:grid lg:grid-cols-[0.78fr_1fr] lg:items-center lg:gap-8">
          <div className="relative z-10">
            <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-cyan-200">
              Yifei Labs · Console
            </p>
            <h1 className="mt-3 text-2xl font-semibold tracking-tight sm:text-3xl">
              职业分析控制台
            </h1>
            <p className="mt-3 max-w-xl text-sm leading-6 text-slate-300">
              从简历解析到岗位匹配、能力诊断与行动建议，选择工具进入可执行分析流程。
            </p>
          </div>
          <div className="career-map-preview relative z-10 mt-6 lg:mt-0">
            <div className="career-map-rail" />
            {["简历", "匹配", "诊断", "计划", "投递"].map((label, index) => (
              <span className={`career-map-node career-node-${index + 1}`} key={label}>
                {label}
              </span>
            ))}
          </div>
        </div>

        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {apps.map((app, index) => {
            const available = app.status === "可用";
            const content = (
              <Card
                className={`interactive-card group h-full overflow-hidden p-0 transition ${
                  available ? "" : "cursor-not-allowed opacity-75"
                } animate-fade-up stagger-${Math.min(index + 1, 8)}`}
              >
                <div
                  className={`bg-gradient-to-br ${app.accent} border-b border-white/10 px-5 py-4`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <h2
                      className={`text-base font-semibold ${
                        available
                          ? "text-slate-50 group-hover:text-cyan-100"
                          : "text-slate-400"
                      }`}
                    >
                      {app.title}
                    </h2>
                    <span
                      className={`rounded-md px-2 py-0.5 text-[11px] font-medium ${
                        available
                          ? "bg-emerald-400/10 text-emerald-300"
                          : "bg-white/10 text-slate-400"
                      }`}
                    >
                      {app.status}
                    </span>
                  </div>
                </div>
                <div className="px-5 py-4">
                  <p className="text-sm leading-6 text-slate-400">{app.desc}</p>
                  <p
                    className={`mt-5 text-sm font-medium transition ${
                      available
                        ? "text-cyan-300 group-hover:text-cyan-200"
                        : "text-slate-500"
                    }`}
                  >
                    {available ? "进入 →" : "敬请期待"}
                  </p>
                </div>
              </Card>
            );
            return available ? (
              <HardLink key={app.title} href={app.href}>
                {content}
              </HardLink>
            ) : (
              <div key={app.title}>{content}</div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
