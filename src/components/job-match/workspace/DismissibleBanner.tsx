import { ReactNode } from "react";
import { cn } from "@/lib/utils";

export function DismissibleBanner({
  children,
  tone,
  onClose,
}: {
  children: ReactNode;
  tone: "error" | "warn";
  onClose: () => void;
}) {
  const styles =
    tone === "error"
      ? "border-red-400/30 bg-red-500/10 text-red-200"
      : "border-amber-400/30 bg-amber-500/10 text-amber-100";
  return (
    <div
      className={cn(
        "animate-fade-up mb-4 flex items-start justify-between gap-3 rounded-lg border px-4 py-3 text-sm",
        styles,
      )}
    >
      <div className="leading-6">{children}</div>
      <button
        type="button"
        aria-label="关闭"
        className="shrink-0 text-base leading-none opacity-50 hover:opacity-100"
        onClick={onClose}
      >
        ×
      </button>
    </div>
  );
}
