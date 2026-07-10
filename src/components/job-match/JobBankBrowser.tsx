"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { AnimatedNumber } from "@/components/ui/AnimatedNumber";
import { formatDate } from "@/lib/utils";
import { StoredJob } from "@/types/jobMatch";

const PAGE_SIZE = 12;

const sourceLabel: Record<string, string> = {
  minimax: "MiniMax",
  grok: "Grok",
  fallback: "规则",
};

type Props = {
  jobs: StoredJob[];
};

export function JobBankBrowser({ jobs }: Props) {
  const [query, setQuery] = useState("");
  const [source, setSource] = useState("all");
  const [location, setLocation] = useState("all");
  const [synthetic, setSynthetic] = useState("all");
  const [visible, setVisible] = useState(PAGE_SIZE);
  const [showDataNote, setShowDataNote] = useState(false);

  const locations = useMemo(() => {
    const set = new Set(jobs.map((j) => j.location).filter(Boolean));
    return ["all", ...[...set].sort()];
  }, [jobs]);

  const sources = useMemo(() => {
    const set = new Set(jobs.map((j) => j.source).filter(Boolean));
    return ["all", ...[...set].sort()];
  }, [jobs]);

  const bySource = useMemo(() => {
    return jobs.reduce<Record<string, number>>((acc, job) => {
      acc[job.source] = (acc[job.source] || 0) + 1;
      return acc;
    }, {});
  }, [jobs]);

  const cityCount = useMemo(
    () => new Set(jobs.map((j) => j.location).filter(Boolean)).size,
    [jobs],
  );

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return jobs.filter((job) => {
      if (source !== "all" && job.source !== source) return false;
      if (location !== "all" && job.location !== location) return false;
      if (synthetic === "synthetic" && job.isSynthetic === false) return false;
      if (synthetic === "real" && job.isSynthetic !== false) return false;
      if (!q) return true;
      const hay = [
        job.title,
        job.company,
        job.location,
        job.requirements,
        job.description,
        ...job.keywords,
        ...(job.skillTags || []),
        ...job.relatedDirections,
      ]
        .join(" ")
        .toLowerCase();
      return hay.includes(q);
    });
  }, [jobs, query, source, location, synthetic]);

  const shown = filtered.slice(0, visible);
  const hasFilters =
    query.trim().length > 0 ||
    source !== "all" ||
    location !== "all" ||
    synthetic !== "all";

  function resetFilters() {
    setQuery("");
    setSource("all");
    setLocation("all");
    setSynthetic("all");
    setVisible(PAGE_SIZE);
  }

  return (
    <div className="page-mesh min-h-[calc(100vh-3.5rem)]">
      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-10">
        <div className="animate-fade-up flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <div className="mb-2 inline-flex items-center gap-2 rounded-full border border-cyan-400/25 bg-cyan-400/10 px-2.5 py-1 text-[11px] font-semibold text-cyan-200">
              <span className="h-1.5 w-1.5 rounded-full bg-cyan-400" />
              Career map · 岗位节点库
            </div>
            <h1 className="text-2xl font-semibold tracking-tight text-slate-50 sm:text-3xl">
              目标岗位节点库
            </h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-400">
              把市场岗位转成职业地图节点，用于匹配目标、识别技能关卡与规划行动路线。
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link href="/apps/job-match?mode=market-fit">
              <Button variant="secondary">能力诊断</Button>
            </Link>
            <Link href="/apps/job-match?mode=job-bank">
              <Button variant="command">岗位匹配</Button>
            </Link>
          </div>
        </div>

        <div className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <Stat label="岗位样本" value={jobs.length} delay={1} />
          <Stat label="Grok" value={bySource.grok || 0} delay={2} />
          <Stat label="MiniMax" value={bySource.minimax || 0} delay={3} />
          <Stat label="地点覆盖" value={cityCount} delay={4} />
        </div>

        <div className="mt-4">
          <button
            type="button"
            className="text-xs font-medium text-slate-400 transition hover:text-slate-100"
            onClick={() => setShowDataNote((v) => !v)}
          >
            {showDataNote ? "收起数据说明" : "数据说明 ▾"}
          </button>
          {showDataNote ? (
            <div className="animate-fade-up mt-2 rounded-lg border border-white/10 bg-white/[0.04] px-3 py-3 text-xs leading-5 text-slate-300 backdrop-blur">
              岗位由模型按市场热招方向生成，公司名为虚构模板。用于分析演练，不代表真实在招职位。
            </div>
          ) : null}
        </div>

        <div className="glass-panel mt-6 rounded-xl p-3 sm:p-4">
          <div className="grid gap-3 md:grid-cols-[1fr_120px_120px_120px]">
            <Input
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setVisible(PAGE_SIZE);
              }}
              placeholder="搜索岗位、公司、技能关键词"
            />
            <Select
              value={source}
              onChange={(e) => {
                setSource(e.target.value);
                setVisible(PAGE_SIZE);
              }}
            >
              {sources.map((s) => (
                <option key={s} value={s}>
                  {s === "all" ? "全部来源" : sourceLabel[s] || s}
                </option>
              ))}
            </Select>
            <Select
              value={location}
              onChange={(e) => {
                setLocation(e.target.value);
                setVisible(PAGE_SIZE);
              }}
            >
              {locations.map((loc) => (
                <option key={loc} value={loc}>
                  {loc === "all" ? "全部地点" : loc}
                </option>
              ))}
            </Select>
            <Select
              value={synthetic}
              onChange={(e) => {
                setSynthetic(e.target.value);
                setVisible(PAGE_SIZE);
              }}
            >
              <option value="all">全部样本</option>
              <option value="synthetic">合成样本</option>
              <option value="real">非合成</option>
            </Select>
          </div>
          <div className="mt-3 flex flex-col gap-2 text-xs text-slate-400 sm:flex-row sm:items-center sm:justify-between">
            <p>
              显示{" "}
              <span className="font-semibold text-slate-100">
                {shown.length}
              </span>{" "}
              / {filtered.length}
              {filtered.length !== jobs.length ? ` · 全库 ${jobs.length}` : ""}
            </p>
            {hasFilters ? (
              <button
                type="button"
                className="self-start rounded-md border border-white/10 px-2 py-1 font-medium text-cyan-200 transition hover:border-cyan-400/30 hover:bg-cyan-400/10 sm:self-auto"
                onClick={resetFilters}
              >
                清除筛选
              </button>
            ) : null}
          </div>
        </div>

        {jobs.length === 0 ? (
          <Card className="mt-6 border-dashed p-10 text-center">
            <p className="text-sm font-medium text-slate-100">岗位库为空</p>
            <p className="mt-2 text-sm text-slate-400">
              请运行{" "}
              <code className="rounded bg-white/10 px-1.5 py-0.5 text-xs">
                npm run seed:jobs:hot
              </code>
            </p>
          </Card>
        ) : filtered.length === 0 ? (
          <Card className="mt-6 border-dashed p-10 text-center text-sm text-slate-400">
            无符合条件的岗位，试试调整筛选条件
          </Card>
        ) : (
          <div className="mt-6 space-y-3">
            {shown.map((job, index) => (
              <JobCard key={job.id} job={job} index={index + 1} />
            ))}
            {visible < filtered.length ? (
              <div className="flex justify-center pt-2">
                <Button variant="secondary" onClick={() => setVisible((v) => v + PAGE_SIZE)}>
                  加载更多（剩余 {filtered.length - visible}）
                </Button>
              </div>
            ) : (
              <p className="py-4 text-center text-xs text-slate-500">已显示全部结果</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function Stat({
  label,
  value,
  delay,
}: {
  label: string;
  value: number;
  delay: number;
}) {
  return (
    <div
      className={`animate-fade-up interactive-card rounded-xl border border-white/10 bg-white/[0.04] px-4 py-3 shadow-sm backdrop-blur-sm stagger-${delay}`}
    >
      <p className="text-[11px] font-medium uppercase tracking-wider text-slate-400">{label}</p>
      <p className="mt-1 text-xl font-semibold tabular-nums text-slate-50">
        <AnimatedNumber value={value} />
      </p>
    </div>
  );
}

function JobCard({ job, index }: { job: StoredJob; index: number }) {
  const [expanded, setExpanded] = useState(false);
  const keywords = job.keywords || [];
  const visibleKeywords = expanded ? keywords : keywords.slice(0, 5);
  const hidden = Math.max(0, keywords.length - 5);

  return (
    <Card
      className={`interactive-card animate-fade-up p-5 stagger-${Math.min(((index - 1) % 8) + 1, 8)}`}
    >
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="grid h-6 w-6 place-items-center rounded-md bg-white/10 text-[11px] font-bold tabular-nums text-slate-400">
              {String(index).padStart(2, "0")}
            </span>
            <h2 className="text-base font-semibold text-slate-50">{job.title}</h2>
            {job.source ? (
              <Badge className="border-white/10 bg-white/[0.04] text-slate-300">
                {sourceLabel[job.source] || job.source}
              </Badge>
            ) : null}
            {job.isSynthetic !== false ? (
              <Badge className="border-amber-400/25 bg-amber-400/10 text-amber-200">
                合成样本
              </Badge>
            ) : null}
            {job.seniority ? (
              <Badge className="border-white/10 bg-white/[0.04] text-slate-400">
                {job.seniority}
              </Badge>
            ) : null}
          </div>
          <p className="mt-1 text-xs text-slate-400">
            {job.company} · {job.location} · {job.salary}
          </p>
          <p className="mt-3 text-sm leading-6 text-slate-300">{job.description}</p>
          <div className="mt-3 rounded-lg border border-white/10 bg-white/[0.04] px-3 py-2.5">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
              Requirements
            </p>
            <p className="mt-1 text-sm leading-6 text-slate-200">{job.requirements}</p>
          </div>
          {keywords.length > 0 ? (
            <div className="mt-3 flex flex-wrap items-center gap-1.5">
              {visibleKeywords.map((keyword) => (
                <Badge key={keyword}>{keyword}</Badge>
              ))}
              {!expanded && hidden > 0 ? (
                <button
                  type="button"
                  className="text-xs font-medium text-cyan-300 transition hover:text-cyan-200"
                  onClick={() => setExpanded(true)}
                >
                  +{hidden}
                </button>
              ) : null}
              {expanded && keywords.length > 5 ? (
                <button
                  type="button"
                  className="text-xs font-medium text-slate-400 hover:text-slate-100"
                  onClick={() => setExpanded(false)}
                >
                  收起
                </button>
              ) : null}
            </div>
          ) : null}
        </div>
        <div className="flex shrink-0 flex-col gap-2 lg:w-40">
          <Link
            href={`/apps/job-match?mode=market-fit&role=${encodeURIComponent(job.title)}`}
            className="inline-flex h-10 items-center justify-center rounded-lg bg-gradient-to-r from-sky-500 to-violet-600 px-3 text-sm font-medium text-white shadow-sm transition hover:bg-slate-200 hover:shadow-md active:scale-[0.98]"
          >
            能力诊断 →
          </Link>
          <p className="text-center text-[11px] text-slate-500 lg:text-right">
            {formatDate(job.createdAt)}
          </p>
        </div>
      </div>
    </Card>
  );
}
