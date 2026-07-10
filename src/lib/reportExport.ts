import {
  JobMatchResult,
  LearningPlanResult,
  PreferredLanguage,
  SkillGapAnalysisResult,
} from "@/types/jobMatch";

export type ReportBundle = {
  generatedAt: string;
  fullName?: string;
  mode: "job-bank" | "market-fit" | "combined";
  resumePreview?: string;
  jobMatch?: JobMatchResult | null;
  marketFit?: (SkillGapAnalysisResult & { marketJobsUsed?: number }) | null;
  learningPlan?: LearningPlanResult | null;
  language?: PreferredLanguage;
};

function section(title: string, body: string) {
  return `## ${title}\n\n${body.trim()}\n`;
}

function bullets(items?: string[] | null) {
  if (!items || items.length === 0) return "_暂无_\n";
  return items.map((item) => `- ${item}`).join("\n") + "\n";
}

export function buildReportMarkdown(report: ReportBundle) {
  const lines: string[] = [];
  lines.push(`# Yifei Labs 职业分析报告`);
  lines.push("");
  lines.push(`- 生成时间：${report.generatedAt}`);
  if (report.fullName) lines.push(`- 候选人：${report.fullName}`);
  lines.push(`- 报告类型：${report.mode}`);
  lines.push("");
  lines.push(`> 岗位库与部分市场需求为市场风格样本数据，仅供分析参考，不构成真实招聘邀约。`);
  lines.push("");

  if (report.jobMatch) {
    lines.push(
      section(
        "一、简历摘要",
        report.jobMatch.candidateSummary || "无",
      ),
    );
    const roles = [...(report.jobMatch.recommendedRoles || [])]
      .sort((a, b) => b.matchScore - a.matchScore)
      .slice(0, 12);
    if (report.jobMatch.profile?.summaryLine) {
      lines.push(
        section("简历画像", report.jobMatch.profile.summaryLine),
      );
      if (report.jobMatch.profile.skillNames?.length) {
        lines.push(
          section(
            "识别技能",
            report.jobMatch.profile.skillNames.join("、"),
          ),
        );
      }
    }
    if (report.jobMatch.pipeline) {
      const p = report.jobMatch.pipeline;
      lines.push(
        section(
          "匹配流水线",
          `岗位库 ${p.jobBankTotal} → 预筛 ${p.candidateCount} → 输出 ${p.rankedCount}（模式 ${p.retrievalMode}）`,
        ),
      );
    }
    if (report.jobMatch.aggregateGaps?.length) {
      lines.push(section("跨岗优先短板", bullets(report.jobMatch.aggregateGaps)));
    }
    const roleBlocks = roles
      .map((role, index) => {
        const dims = role.scoreDimensions;
        const dimLine = dims
          ? `- 维度：技能 ${dims.skillCoverage} / 方向 ${dims.directionFit} / 经验 ${dims.experienceFit} / 地点 ${dims.locationFit}`
          : null;
        return [
          `### ${index + 1}. ${role.title}（${role.matchScore}%）`,
          "",
          `- 公司/地点：${[role.company, role.location].filter(Boolean).join(" · ") || "—"}`,
          role.isSynthetic !== false
            ? `- 数据性质：合成市场样本（非实时在招）`
            : `- 数据性质：用户提供 / 非合成`,
          role.scoreDimensions
            ? `- 维度：技能${role.scoreDimensions.skillCoverage} / 方向${role.scoreDimensions.directionFit} / 经验${role.scoreDimensions.experienceFit} / 地点${role.scoreDimensions.locationFit}`
            : null,
          role.matchedKeywords?.length
            ? `- 命中技能：${role.matchedKeywords.slice(0, 8).join("、")}`
            : null,
          role.gaps?.length
            ? `- 缺口：${role.gaps.slice(0, 5).join("；")}`
            : null,
          dimLine,
          `- 匹配说明：${role.reason}`,
          `- 优势：${(role.strengths || []).join("；") || "—"}`,
          `- 缺口：${(role.gaps || []).join("；") || "—"}`,
          `- 关键词：${(role.matchedKeywords || []).join("、") || "—"}`,
        ]
          .filter(Boolean)
          .join("\n");
      })
      .join("\n\n");
    lines.push(section("二、岗位匹配排序", roleBlocks || "_无匹配结果_"));
  }

  if (report.marketFit) {
    const fit = report.marketFit;
    lines.push(
      section(
        report.jobMatch ? "三、目标岗位市场诊断" : "一、目标岗位市场诊断",
        [
          `**目标岗位**：${fit.targetRole}`,
          `**准备度**：${fit.readinessScore}%`,
          `**市场匹配度**：${fit.marketFitScore ?? "—"}%`,
          "",
          fit.summary,
          "",
          fit.marketDemandSummary ? `市场需求：${fit.marketDemandSummary}` : "",
        ]
          .filter(Boolean)
          .join("\n"),
      ),
    );
    lines.push(section("已具备优势", bullets(fit.matchedStrengths)));
    lines.push(section("缺失 / 证据不足", bullets(fit.missingSkills)));
    if (fit.evidenceScores?.length) {
      const scoreBlocks = fit.evidenceScores
        .map((s) => {
          return [
            `### ${s.label}（${s.score}/${s.max || 100}）`,
            "",
            "**证据**",
            bullets(s.evidence),
            s.risks?.length ? "**风险提示**\n" + bullets(s.risks) : "",
            s.nextActions?.length ? "**补强动作**\n" + bullets(s.nextActions) : "",
          ]
            .filter(Boolean)
            .join("\n");
        })
        .join("\n");
      lines.push(section("证据评分卡", scoreBlocks));
    }
    if (fit.riskFlags?.length) {
      lines.push(section("影响匹配的风险点", bullets(fit.riskFlags)));
    }
    if (fit.nextActions?.length) {
      lines.push(section("补强动作汇总", bullets(fit.nextActions)));
    }
    if (fit.proofSummary) {
      lines.push(section("证明资产", fit.proofSummary));
    }
    if (fit.skillMatrix?.length) {
      const matrixLines = fit.skillMatrix
        .map(
          (c) =>
            `- ${c.skill}：简历${c.inResume ? "✓" : "—"} / JD${c.inTargetJd ? "✓" : "—"} / 市场${c.inMarket ? "✓" : "—"} → ${c.status}`,
        )
        .join("\n");
      lines.push(section("技能覆盖矩阵", matrixLines + "\n"));
    }
    lines.push(section("市场常见要求", bullets(fit.commonMarketRequirements)));
    lines.push(section("学习优先级", bullets(fit.learningPriorities)));
    lines.push(section("简历改进", bullets(fit.resumeImprovements)));
    lines.push(section("面试准备", bullets(fit.interviewPrepTips)));
    lines.push(section("建议关键词", bullets(fit.suggestedKeywords)));
  }

  if (report.learningPlan) {
    const plan = report.learningPlan;
    lines.push(
      section(
        "30 天学习计划总览",
        `**周期**：${plan.horizonDays} 天\n\n${plan.summary}`,
      ),
    );
    const weeks = (plan.weeklyPlan || [])
      .map((week) => {
        return [
          `### 第 ${week.week} 周 · ${week.theme}`,
          "",
          "**目标**",
          bullets(week.goals),
          "**每日重点**",
          bullets(week.dailyFocus),
          "**交付物**",
          bullets(week.deliverables),
        ].join("\n");
      })
      .join("\n");
    lines.push(section("周计划", weeks || "_无_"));

    const projects = (plan.projectIdeas || [])
      .map((p, i) => {
        return [
          `### 项目 ${i + 1}：${p.title}`,
          "",
          `- 难度：${p.difficulty} · 约 ${p.durationDays} 天`,
          `- 覆盖技能：${(p.skillsCovered || []).join("、")}`,
          `- 说明：${p.description}`,
          `- 简历写法：${p.resumeBullet}`,
        ].join("\n");
      })
      .join("\n\n");
    lines.push(section("推荐项目", projects || "_无_"));
    lines.push(section("里程碑", bullets(plan.milestones)));
    lines.push(section("学习资源", bullets(plan.resources)));
  }

  lines.push("---");
  lines.push("");
  lines.push("_Generated by Yifei Labs Career Intelligence_");
  return lines.join("\n");
}

export function downloadTextFile(filename: string, content: string, mime = "text/markdown;charset=utf-8") {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export function printReportAsPdf(title: string, markdownLikeHtml: string) {
  const win = window.open("", "_blank", "noopener,noreferrer,width=900,height=700");
  if (!win) {
    throw new Error("浏览器拦截了弹窗，请允许后重试。");
  }
  win.document.write(`<!doctype html>
<html lang="zh-CN">
<head>
  <meta charset="utf-8" />
  <title>${title}</title>
  <style>
    body { font-family: "Segoe UI", "PingFang SC", "Microsoft YaHei", sans-serif; color: #18181b; line-height: 1.6; padding: 32px; max-width: 820px; margin: 0 auto; }
    h1 { font-size: 22px; margin-bottom: 8px; }
    h2 { font-size: 16px; margin-top: 28px; border-bottom: 1px solid #e4e4e7; padding-bottom: 6px; }
    h3 { font-size: 14px; margin-top: 18px; }
    p, li { font-size: 13px; color: #3f3f46; }
    .meta { color: #71717a; font-size: 12px; margin-bottom: 20px; }
    .note { background: #fafafa; border: 1px solid #e4e4e7; padding: 10px 12px; border-radius: 8px; font-size: 12px; color: #52525b; }
    ul { padding-left: 18px; }
    @media print { body { padding: 0; } }
  </style>
</head>
<body>
  ${markdownLikeHtml}
  <script>window.onload = function () { window.print(); };</script>
</body>
</html>`);
  win.document.close();
}

/** Lightweight markdown → HTML for print (headings/lists/paragraphs only). */
export function markdownToSimpleHtml(md: string) {
  const escaped = md
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");

  const lines = escaped.split("\n");
  const html: string[] = [];
  let inList = false;

  function closeList() {
    if (inList) {
      html.push("</ul>");
      inList = false;
    }
  }

  for (const raw of lines) {
    const line = raw.trimEnd();
    if (!line.trim()) {
      closeList();
      continue;
    }
    if (line.startsWith("# ")) {
      closeList();
      html.push(`<h1>${line.slice(2)}</h1>`);
      continue;
    }
    if (line.startsWith("## ")) {
      closeList();
      html.push(`<h2>${line.slice(3)}</h2>`);
      continue;
    }
    if (line.startsWith("### ")) {
      closeList();
      html.push(`<h3>${line.slice(4)}</h3>`);
      continue;
    }
    if (line.startsWith("> ")) {
      closeList();
      html.push(`<div class="note">${line.slice(2)}</div>`);
      continue;
    }
    if (line.startsWith("- ")) {
      if (!inList) {
        html.push("<ul>");
        inList = true;
      }
      html.push(`<li>${inlineMd(line.slice(2))}</li>`);
      continue;
    }
    if (line.startsWith("---")) {
      closeList();
      html.push("<hr />");
      continue;
    }
    closeList();
    html.push(`<p>${inlineMd(line)}</p>`);
  }
  closeList();
  return html.join("\n");
}

function inlineMd(text: string) {
  return text
    .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
    .replace(/`([^`]+)`/g, "<code>$1</code>");
}
