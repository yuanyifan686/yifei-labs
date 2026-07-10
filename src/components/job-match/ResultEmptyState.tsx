import { ReactNode } from "react";
import { EmptyState } from "@/components/ui/EmptyState";

export function ResultEmptyState({
  mode,
  action,
  needsDirectionFirst,
}: {
  mode: "job-bank" | "market-fit";
  action?: ReactNode;
  needsDirectionFirst?: boolean;
}) {
  if (mode === "job-bank") {
    return (
      <EmptyState
        icon="01"
        title="等待开始岗位匹配"
        description="贴入简历后，系统会从岗位样本库中筛出更适合准备的方向，并解释匹配理由和能力缺口。"
        action={action}
      />
    );
  }

  return (
    <EmptyState
      icon="02"
      className="mode-panel border-dashed border-white/15 bg-white/[0.03]"
      title={needsDirectionFirst ? "先找到可投方向" : "等待开始能力诊断"}
      description={
        needsDirectionFirst
          ? "如果还不知道投什么岗位，系统会先根据简历推荐方向；选定方向后再诊断准备度、能力缺口和学习优先级。"
          : "目标岗位是可选输入；粘贴真实 JD 时会优先按岗位原文诊断，否则按岗位名称和市场样本评估。"
      }
      action={action}
    />
  );
}
