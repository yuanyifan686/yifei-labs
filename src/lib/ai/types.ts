export type AnalysisSource = "ai" | "fallback";

export type AnalysisOutcome<T> = {
  data: T;
  source: AnalysisSource;
  warning?: string;
};
