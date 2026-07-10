import { RoleDirection } from "@/types/jobMatch";

export type PlatformKind = "boss" | "zhilian";

const PLATFORM_META: Record<
  PlatformKind,
  { label: string; shortLabel: string; homeUrl: string; note: string }
> = {
  boss: {
    label: "Boss 直聘",
    shortLabel: "Boss",
    homeUrl: "https://www.zhipin.com/",
    note: "打开 Boss 搜索后，复制感兴趣的在招 JD 粘贴回来即可匹配。",
  },
  zhilian: {
    label: "智联招聘",
    shortLabel: "智联",
    homeUrl: "https://www.zhaopin.com/",
    note: "打开智联搜索后，复制感兴趣的在招 JD 粘贴回来即可匹配。",
  },
};

export function getPlatformMeta(platform: PlatformKind) {
  return PLATFORM_META[platform];
}

/** Public search page links only — no scraping. */
export function buildPlatformSearchUrl(
  platform: PlatformKind,
  query: string,
  location?: string,
) {
  const q = query.trim();
  const city = (location || "").split(/[/,，、\s]+/).filter(Boolean)[0] || "";

  if (platform === "boss") {
    const params = new URLSearchParams();
    if (q) params.set("query", q);
    // city is optional; Boss accepts free-text query well enough.
    if (city) params.set("city", city);
    return `https://www.zhipin.com/web/geek/job?${params.toString()}`;
  }

  const params = new URLSearchParams();
  if (q) params.set("kw", q);
  if (city) params.set("jl", city);
  return `https://sou.zhaopin.com/?${params.toString()}`;
}

export function pickPrimaryQuery(direction: RoleDirection, platform: PlatformKind) {
  if (platform === "boss") {
    return direction.bossQuery || direction.title;
  }
  return direction.zhilianQuery || direction.title;
}

export function buildCombinedSearchQuery(directions: RoleDirection[], platform: PlatformKind) {
  const selected = directions.slice(0, 3);
  if (selected.length === 0) return "";
  if (selected.length === 1) return pickPrimaryQuery(selected[0], platform);
  // Platforms search one query at a time — use the top direction title + shared keywords.
  const top = selected[0];
  const keywords = selected
    .flatMap((item) => item.searchKeywords)
    .filter(Boolean)
    .slice(0, 3);
  return [pickPrimaryQuery(top, platform), ...keywords].filter(Boolean).join(" ");
}

/** Convert selected AI role directions into a pasteable job-list draft for matching. */
export function buildJobListFromDirections(
  directions: RoleDirection[],
  options?: { platformLabel?: string; location?: string },
) {
  const platformLabel = options?.platformLabel || "AI 推荐方向";
  const location = options?.location || "不限";

  return directions
    .map((direction, index) => {
      const requirements =
        direction.typicalRequirements.length > 0
          ? direction.typicalRequirements.join("、")
          : direction.searchKeywords.join("、");

      return [
        `岗位：${direction.title}`,
        `公司：待从招聘平台填写`,
        `地点：${location}`,
        `薪资：待确认`,
        `来源：${platformLabel}`,
        `匹配参考分：${direction.matchScore}`,
        `要求：${requirements}`,
        `说明：${direction.reason}`,
        index < directions.length - 1 ? "" : "",
      ].join("\n");
    })
    .join("\n")
    .trim();
}

export function formatDirectionAsSearchCard(direction: RoleDirection) {
  return [
    direction.title,
    `Boss 检索：${direction.bossQuery || direction.title}`,
    `智联检索：${direction.zhilianQuery || direction.title}`,
    `关键词：${direction.searchKeywords.join("、")}`,
  ].join("\n");
}
