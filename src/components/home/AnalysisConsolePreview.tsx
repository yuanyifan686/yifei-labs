const entries = [
  "上传简历",
  "粘贴岗位描述",
  "岗位库匹配",
  "历史报告",
  "学习计划",
];

const candidates = [
  { role: "AI 工作流工程师", score: "92%", highlight: true },
  { role: "大模型应用工程师", score: "86%" },
  { role: "AI 产品工程师", score: "78%" },
  { role: "数据分析师（AI 增强）", score: "74%" },
  { role: "内容自动化运营", score: "71%" },
];

const gaps = ["RAG 评测", "系统稳定性", "商业指标表达"];
const nextSteps = ["调整项目表述", "补 1 个闭环案例", "生成 30 天学习计划"];

export function AnalysisConsolePreview() {
  return (
    <div className="analysis-console animate-fade-up mx-auto max-w-6xl">
      <div className="analysis-console-chrome">
        <div className="analysis-console-dots" aria-hidden>
          <span />
          <span />
          <span />
        </div>
        <p className="analysis-console-title">Yifei Labs — Analysis Console</p>
        <div className="w-[42px]" aria-hidden />
      </div>

      <div className="analysis-console-body">
        <div className="analysis-console-col">
          <h4>分析入口</h4>
          <ul className="space-y-1.5">
            {entries.map((item, i) => (
              <li
                key={item}
                className={`flex items-center gap-2 rounded-lg border px-3 py-2.5 text-sm ${
                  i === 0
                    ? "border-cyan-400/30 bg-cyan-400/10 text-cyan-100"
                    : "border-white/10 bg-white/[0.03] text-slate-300"
                }`}
              >
                <span
                  className={`h-1.5 w-1.5 shrink-0 rounded-full ${
                    i === 0 ? "bg-cyan-300" : "bg-slate-500"
                  }`}
                />
                {item}
              </li>
            ))}
          </ul>
        </div>

        <div className="analysis-console-col">
          <h4>候选岗位</h4>
          <ul className="space-y-1.5">
            {candidates.map((item) => (
              <li
                key={item.role}
                className={`flex items-center justify-between gap-3 rounded-lg border px-3 py-2.5 text-sm ${
                  item.highlight
                    ? "border-emerald-400/30 bg-emerald-400/10"
                    : "border-white/10 bg-white/[0.03]"
                }`}
              >
                <span className="min-w-0 truncate text-slate-100">{item.role}</span>
                <strong
                  className={`shrink-0 tabular-nums ${
                    item.highlight ? "text-emerald-300" : "text-cyan-300"
                  }`}
                >
                  {item.score}
                </strong>
              </li>
            ))}
          </ul>
        </div>

        <div className="analysis-console-col">
          <h4>结构化报告</h4>
          <div className="space-y-3">
            <div>
              <p className="text-base font-semibold text-white">AI 工作流工程师</p>
              <div className="mt-2 flex flex-wrap gap-1.5">
                <span className="rounded-full border border-emerald-400/30 bg-emerald-400/10 px-2 py-0.5 text-[11px] font-semibold text-emerald-200">
                  高匹配
                </span>
                <span className="rounded-full border border-cyan-400/30 bg-cyan-400/10 px-2 py-0.5 text-[11px] font-semibold text-cyan-100">
                  建议优先投递
                </span>
              </div>
            </div>

            <div className="rounded-xl border border-white/10 bg-white/[0.03] p-3">
              <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                Summary by Yifei
              </p>
              <p className="mt-1.5 text-xs leading-5 text-slate-300">
                你的项目经历与岗位中的自动化工作流、Agent 编排和内容生成能力高度相关。建议补充
                RAG 评测、系统稳定性和交付指标描述。
              </p>
            </div>

            <div>
              <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                能力缺口
              </p>
              <div className="mt-1.5 flex flex-wrap gap-1.5">
                {gaps.map((g) => (
                  <span
                    key={g}
                    className="rounded-md border border-amber-400/20 bg-amber-400/10 px-2 py-0.5 text-[11px] font-medium text-amber-100"
                  >
                    {g}
                  </span>
                ))}
              </div>
            </div>

            <div>
              <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                下一步行动
              </p>
              <ol className="mt-1.5 space-y-1">
                {nextSteps.map((step, i) => (
                  <li key={step} className="flex gap-2 text-xs text-slate-300">
                    <span className="tabular-nums text-cyan-400/80">{i + 1}.</span>
                    {step}
                  </li>
                ))}
              </ol>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
