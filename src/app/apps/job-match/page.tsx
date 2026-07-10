import { Suspense } from "react";
import { JobMatchWorkspace } from "@/components/job-match/JobMatchWorkspace";

export default function JobMatchPage() {
  return (
    <Suspense
      fallback={
        <div className="mx-auto max-w-7xl px-4 py-16 text-center text-slate-500">
          加载中...
        </div>
      }
    >
      <JobMatchWorkspace />
    </Suspense>
  );
}
