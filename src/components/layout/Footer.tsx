export function Footer() {
  return (
    <footer className="border-t border-white/10 bg-black/25 backdrop-blur-md">
      <div className="mx-auto flex max-w-6xl flex-col gap-3 px-4 py-8 text-sm text-slate-400 sm:flex-row sm:items-center sm:justify-between sm:px-6">
        <div>
          <p className="font-medium text-slate-100">Yifei Labs</p>
          <p className="mt-0.5 text-xs text-slate-500">
            职业匹配与能力诊断 · Career Intelligence
          </p>
        </div>
        <p className="max-w-md text-xs leading-5 text-slate-500 sm:text-right">
          岗位库为市场风格样本数据，仅供分析参考，不构成真实招聘邀约。
        </p>
      </div>
    </footer>
  );
}
