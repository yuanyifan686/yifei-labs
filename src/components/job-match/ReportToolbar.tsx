"use client";

import { Button } from "@/components/ui/Button";
import { useToast } from "@/components/ui/Toast";
import {
  buildReportMarkdown,
  downloadTextFile,
  ReportBundle,
} from "@/lib/reportExport";

export function ReportToolbar({
  report,
  disabled,
  onExported,
}: {
  report: ReportBundle | null;
  disabled?: boolean;
  onExported?: () => void;
}) {
  const { toast } = useToast();
  if (!report) return null;

  function exportMarkdown() {
    if (!report) return;
    const md = buildReportMarkdown(report);
    const stamp = new Date().toISOString().slice(0, 10);
    downloadTextFile(`yifei-labs-report-${stamp}.md`, md);
    toast("Markdown 报告已导出");
    onExported?.();
  }

  return (
    <div className="grid w-full grid-cols-1 gap-2 sm:flex sm:w-auto sm:flex-wrap">
      <Button
        variant="secondary"
        className="h-9 w-full text-xs sm:w-auto"
        disabled={disabled}
        onClick={exportMarkdown}
      >
        导出 MD
      </Button>
    </div>
  );
}
