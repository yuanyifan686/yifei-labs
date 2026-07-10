"use client";

import { useCallback, useEffect, useState } from "react";
import { getJobBankStatsAction } from "@/app/apps/job-match/actions";
import { JobBankStats } from "@/types/jobMatch";

export function useJobBankStats() {
  const [jobBankStats, setJobBankStats] = useState<JobBankStats | null>(null);

  const refresh = useCallback(async () => {
    const response = await getJobBankStatsAction();
    if (response.ok) setJobBankStats(response.data);
    return response;
  }, []);

  useEffect(() => {
    let cancelled = false;
    void getJobBankStatsAction().then((response) => {
      if (cancelled) return;
      if (response.ok) setJobBankStats(response.data);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  return { jobBankStats, setJobBankStats, refresh };
}
