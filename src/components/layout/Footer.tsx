export function Footer() {
  return (
    <footer className="border-t border-[var(--yl-border)] bg-[var(--yl-bg)]">
      <div className="mx-auto flex max-w-6xl flex-col gap-3 px-4 py-8 text-sm text-[var(--yl-text-muted)] sm:flex-row sm:items-center sm:justify-between sm:px-6">
        <div>
          <p className="font-medium text-[var(--yl-text)]">Yifei Labs</p>
          <p className="mt-0.5 text-xs text-[var(--yl-text-muted)]">
            职业匹配与能力诊断 · Career Intelligence
          </p>
        </div>
        <p className="text-xs leading-5 text-[var(--yl-text-muted)] sm:text-right">
          岗位库为市场风格样本数据，仅供分析参考，不构成真实招聘邀约。
        </p>
      </div>
    </footer>
  );
}
