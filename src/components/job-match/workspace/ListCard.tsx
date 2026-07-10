import { Card } from "@/components/ui/Card";
import { cn } from "@/lib/utils";

export function ListCard({
  title,
  items,
  tone = "neutral",
}: {
  title: string;
  items?: string[] | null;
  tone?: "good" | "bad" | "neutral";
}) {
  const accent =
    tone === "good"
      ? "border-l-emerald-400/60"
      : tone === "bad"
        ? "border-l-red-400/60"
        : "border-l-cyan-400/40";

  return (
    <Card className={cn("border-l-2 p-4", accent)}>
      <h3 className="text-sm font-semibold text-slate-100">{title}</h3>
      {!items || items.length === 0 ? (
        <p className="mt-3 text-sm text-slate-500">暂无条目</p>
      ) : (
        <ul className="mt-3 space-y-2 text-sm leading-6 text-slate-300">
          {items.map((item) => (
            <li key={item} className="flex gap-2">
              <span className="mt-2 h-1 w-1 shrink-0 rounded-full bg-slate-500" />
              <span>{item}</span>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}
