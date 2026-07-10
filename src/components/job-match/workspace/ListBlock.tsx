export function ListBlock({
  title,
  items,
}: {
  title: string;
  items?: string[] | null;
}) {
  return (
    <div>
      <h3 className="mb-2 text-xs font-semibold text-slate-400">{title}</h3>
      <ul className="space-y-1.5 text-sm leading-6 text-slate-300">
        {(items && items.length > 0 ? items : ["暂无"]).map((item) => (
          <li key={item} className="flex gap-2">
            <span className="mt-2 h-1 w-1 shrink-0 rounded-full bg-cyan-400/70" />
            <span>{item}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
