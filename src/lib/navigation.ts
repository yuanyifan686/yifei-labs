export type NavItem = {
  label: string;
  href: string;
};

export const NAV_ITEMS: NavItem[] = [
  { label: "首页", href: "/" },
  { label: "岗位匹配", href: "/apps/job-match?mode=job-bank" },
  { label: "能力诊断", href: "/apps/job-match?mode=market-fit" },
  { label: "岗位库", href: "/apps/job-match/job-bank" },
  { label: "历史记录", href: "/apps/job-match/history" },
];

export const CTA_LINKS = {
  startAnalysis: "/apps/job-match?mode=job-bank",
  jobBank: "/apps/job-match/job-bank",
  marketFit: "/apps/job-match?mode=market-fit",
} as const;

/** Resolve active nav item from pathname + mode query. */
export function isNavItemActive(
  href: string,
  pathname: string,
  mode: string | null,
): boolean {
  const [path, query = ""] = href.split("?");
  if (path === "/") return pathname === "/";

  if (path === "/apps/job-match" && pathname === "/apps/job-match") {
    if (query.includes("mode=market-fit")) return mode === "market-fit";
    if (query.includes("mode=job-bank")) return mode !== "market-fit";
    return true;
  }

  if (path === "/apps/job-match/job-bank") {
    return pathname === "/apps/job-match/job-bank";
  }

  return pathname === path || pathname.startsWith(`${path}/`);
}
