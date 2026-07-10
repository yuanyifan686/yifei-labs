"use client";

import { useState } from "react";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import {
  JdBoardItem,
  listJdBoard,
  removeJdBoardItem,
  upsertJdBoardItem,
} from "@/lib/jdBoard";

export function JdBoardCard({
  currentTitle,
  currentJd,
  lastReadiness,
  onLoad,
}: {
  currentTitle: string;
  currentJd: string;
  lastReadiness?: number;
  onLoad: (item: JdBoardItem) => void;
}) {
  const [items, setItems] = useState<JdBoardItem[]>(() =>
    typeof window === "undefined" ? [] : listJdBoard(),
  );

  function refresh() {
    setItems(listJdBoard());
  }

  return (
    <Card className="interactive-card p-4" data-testid="jd-board">
      <div className="flex items-center justify-between gap-2">
        <div>
          <p className="pro-label">Real JD board</p>
          <h3 className="mt-1 text-sm font-semibold text-slate-50">真实 JD 看板</h3>
        </div>
        <Button
          type="button"
          variant="secondary"
          className="h-8 px-2 text-xs"
          disabled={!currentTitle.trim() || currentJd.trim().length < 20}
          onClick={() => {
            upsertJdBoardItem({
              title: currentTitle.trim(),
              jd: currentJd.trim(),
              status: lastReadiness != null ? "diagnosed" : "saved",
              readinessScore: lastReadiness,
            });
            refresh();
          }}
        >
          保存当前 JD
        </Button>
      </div>
      <p className="mt-2 text-[11px] leading-5 text-slate-500">
        本地保存多个在招 JD，便于对比诊断（无账号）。
      </p>
      <div className="mt-3 max-h-48 space-y-2 overflow-auto">
        {items.length === 0 ? (
          <p className="text-xs text-slate-500">暂无保存的 JD。</p>
        ) : (
          items.map((item) => (
            <div
              key={item.id}
              className="rounded-lg border border-white/10 bg-white/[0.03] p-2.5"
            >
              <div className="flex items-start justify-between gap-2">
                <button
                  type="button"
                  className="min-w-0 text-left"
                  onClick={() => onLoad(item)}
                >
                  <p className="truncate text-xs font-semibold text-slate-100">
                    {item.title}
                  </p>
                  <p className="mt-0.5 text-[10px] text-slate-500">
                    {item.status}
                    {item.readinessScore != null
                      ? ` · 准备度 ${item.readinessScore}`
                      : ""}
                  </p>
                </button>
                <div className="flex shrink-0 gap-1">
                  <Badge className="text-[10px]">
                    {item.jd.length > 40 ? "真实 JD" : "短文本"}
                  </Badge>
                  <button
                    type="button"
                    className="text-[10px] text-slate-500 hover:text-red-300"
                    onClick={() => {
                      removeJdBoardItem(item.id);
                      refresh();
                    }}
                  >
                    删
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </Card>
  );
}
