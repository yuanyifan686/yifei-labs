"use client";

import { useCallback, useEffect, useState, useTransition } from "react";
import {
  deleteMyAnalysisSessionAction,
  listMyAnalysisSessionsAction,
} from "@/app/apps/job-match/actions";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { HardLink } from "@/components/ui/HardLink";
import { getOrCreateClientToken } from "@/lib/session/clientIdentity";
import { formatDate, matchTone } from "@/lib/utils";
import { AnalysisSession } from "@/types/jobMatch";

export function HistoryArchiveClient() {
  const [sessions, setSessions] = useState<AnalysisSession[]>([]);
  const [error, setError] = useState("");
  const [persistenceEnabled, setPersistenceEnabled] = useState(false);
  const [clientToken, setClientToken] = useState("");
  const [isPending, startTransition] = useTransition();

  const refresh = useCallback(() => {
    startTransition(async () => {
      setError("");
      const token = getOrCreateClientToken();
      setClientToken(token);
      const response = await listMyAnalysisSessionsAction(token);
      if (!response.ok) {
        setError(response.error);
        setSessions([]);
        return;
      }
      setSessions(response.data.sessions);
      setPersistenceEnabled(response.data.persistenceEnabled);
    });
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  async function handleDelete(id: string) {
    if (!clientToken) return;
    if (!window.confirm("确定删除该分析会话？此操作不可恢复。")) return;
    const response = await deleteMyAnalysisSessionAction(id, clientToken);
    if (!response.ok) {
      setError(response.error);
      return;
    }
    setSessions((prev) => prev.filter((s) => s.id !== id));
  }

  return (
    <div className="page-mesh min-h-[calc(100vh-3.5rem)]">
      <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
        <div className="animate-fade-up flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-400">
              Route Archive
            </p>
            <h1 className="mt-2 text-2xl font-semibold tracking-tight text-slate-50">
              职业分析会话
            </h1>
            <p className="mt-2 text-sm text-slate-400">
              仅展示本浏览器身份下的会话（client token 隔离）。包含匹配、诊断与学习计划摘要。
            </p>
          </div>
          <div className="flex flex-wrap gap-3 text-sm font-medium">
            <HardLink
              className="text-slate-200 transition hover:text-slate-50"
              href="/apps/job-match?mode=job-bank"
            >
              岗位匹配
            </HardLink>
            <HardLink
              className="text-slate-200 transition hover:text-slate-50"
              href="/apps/job-match?mode=market-fit"
            >
              能力诊断
            </HardLink>
          </div>
        </div>

        {!persistenceEnabled ? (
          <Card className="mt-6 border-amber-400/20 bg-amber-400/5 p-4 text-sm text-amber-100">
            未开启云端持久化（Supabase）。当前仅能列出本进程内存中的会话；重启服务后历史会清空。
            配置 <code className="text-xs">NEXT_PUBLIC_SUPABASE_URL</code> 与{" "}
            <code className="text-xs">SUPABASE_SERVICE_ROLE_KEY</code> 并执行 SQL migration 后可归档。
          </Card>
        ) : null}

        {error ? (
          <Card className="mt-6 border-red-400/20 bg-red-400/5 p-4 text-sm text-red-100">
            {error}
          </Card>
        ) : null}

        <div className="mt-8 space-y-3">
          {isPending && sessions.length === 0 ? (
            <Card className="p-8 text-center text-sm text-slate-400">加载中…</Card>
          ) : sessions.length === 0 ? (
            <Card className="animate-fade-up border-dashed p-10 text-center">
              <p className="text-sm font-medium text-slate-100">暂无本机分析会话</p>
              <p className="mt-2 text-sm text-slate-400">
                完成一次岗位匹配后，会话会出现在这里。不会展示其他浏览器的记录。
              </p>
              <div className="mt-6 flex flex-wrap justify-center gap-2">
                <HardLink
                  href="/apps/job-match?mode=job-bank"
                  className="inline-flex rounded-lg bg-gradient-to-r from-sky-500 to-violet-600 px-4 py-2 text-sm font-medium text-white shadow-sm"
                >
                  开始岗位匹配
                </HardLink>
              </div>
            </Card>
          ) : (
            sessions.map((session) => {
              const topRole = session.matchResult?.recommendedRoles?.[0];
              const gapCount = session.gapResults?.length || 0;
              const planCount = session.learningPlans?.length || 0;
              const title =
                topRole?.title ||
                session.gapResults?.[0]?.targetRole ||
                session.resumeProfile?.summaryLine ||
                "未命名分析会话";

              return (
                <Card className="interactive-card p-5" key={session.id}>
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                    <div className="min-w-0">
                      <h2 className="truncate text-base font-semibold text-slate-50">
                        {title}
                      </h2>
                      <p className="mt-1 text-sm text-slate-400">
                        更新于 {formatDate(session.updatedAt)} · 来源{" "}
                        {session.source || "mixed"} · 存储{" "}
                        {session.persistence || "unknown"}
                      </p>
                      <div className="mt-3 flex flex-wrap items-center gap-2">
                        {topRole ? (
                          <Badge className={matchTone(topRole.matchScore)}>
                            Top {topRole.matchScore}%
                          </Badge>
                        ) : null}
                        <Badge>匹配 {session.matchResult ? "✓" : "—"}</Badge>
                        <Badge>诊断 {gapCount}</Badge>
                        <Badge>计划 {planCount}</Badge>
                        {session.resumeTextHash ? (
                          <Badge className="font-mono text-[10px]">
                            hash {session.resumeTextHash.slice(0, 8)}
                          </Badge>
                        ) : null}
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <HardLink
                        className="inline-flex rounded-md bg-gradient-to-r from-sky-500 to-violet-600 px-4 py-2 text-sm font-medium text-white"
                        href={`/apps/job-match/history/${session.id}`}
                      >
                        查看详情
                      </HardLink>
                      <Button
                        type="button"
                        variant="ghost"
                        className="text-sm text-slate-300"
                        onClick={() => void handleDelete(session.id)}
                      >
                        删除
                      </Button>
                    </div>
                  </div>
                </Card>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
