"use client";

import { AppMode } from "@/components/job-match/constants";
import { SegmentedControl } from "@/components/ui/SegmentedControl";

export function ModeSwitcher({
  mode,
  hasJobBankResult,
  hasMarketFitResult,
  onChange,
}: {
  mode: AppMode;
  hasJobBankResult: boolean;
  hasMarketFitResult: boolean;
  onChange: (mode: AppMode) => void;
}) {
  return (
    <SegmentedControl
      value={mode}
      onChange={onChange}
      options={[
        { value: "job-bank", label: "岗位匹配", hasResult: hasJobBankResult },
        { value: "market-fit", label: "能力诊断", hasResult: hasMarketFitResult },
      ]}
    />
  );
}
