import type { ProofCheckResult } from "@/types/resume";

function classifyUrl(url: string): ProofCheckResult["kind"] {
  const u = url.toLowerCase();
  if (u.includes("github.com")) return "github";
  if (u.includes("linkedin.com")) return "linkedin";
  if (
    u.includes("vercel.app") ||
    u.includes("netlify.app") ||
    u.includes("pages.dev") ||
    u.includes("github.io") ||
    u.includes("demo")
  ) {
    return "demo";
  }
  if (
    u.includes("notion.") ||
    u.includes("behance.") ||
    u.includes("dribbble.") ||
    u.includes("portfolio")
  ) {
    return "portfolio";
  }
  if (
    u.includes("juejin.") ||
    u.includes("zhihu.com") ||
    u.includes("xiaohongshu.") ||
    u.includes("medium.com") ||
    u.includes("blog")
  ) {
    return "blog";
  }
  return "other";
}

/**
 * Lightweight reachability check (no GitHub API). Timeouts fail soft.
 */
export async function checkProofLinks(
  urls: string[],
  options?: { timeoutMs?: number },
): Promise<ProofCheckResult[]> {
  const timeoutMs = options?.timeoutMs ?? 3500;
  const unique = [...new Set(urls)].slice(0, 8);

  const results = await Promise.all(
    unique.map(async (url) => {
      const kind = classifyUrl(url);
      const notes: string[] = [`类型推断：${kind}`];
      if (!/^https?:\/\//i.test(url)) {
        return {
          url,
          kind,
          reachable: false,
          notes: ["链接格式无效，需包含 http(s)://"],
        };
      }

      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), timeoutMs);
      try {
        let res = await fetch(url, {
          method: "HEAD",
          redirect: "follow",
          signal: controller.signal,
          headers: { "User-Agent": "YifeiLabs-ProofCheck/1.0" },
        });
        // Some hosts block HEAD
        if (res.status === 405 || res.status === 403 || res.status === 404) {
          res = await fetch(url, {
            method: "GET",
            redirect: "follow",
            signal: controller.signal,
            headers: { "User-Agent": "YifeiLabs-ProofCheck/1.0" },
          });
        }
        const ok = res.ok || (res.status >= 200 && res.status < 400);
        if (ok) notes.push(`HTTP ${res.status} 可访问`);
        else notes.push(`HTTP ${res.status}，访问异常`);
        if (kind === "github") notes.push("GitHub 链接（技术岗可作为证明资产）");
        return { url, kind, reachable: ok, notes };
      } catch (e) {
        const msg = e instanceof Error ? e.message : "network error";
        notes.push(`探测失败：${msg.slice(0, 80)}`);
        return { url, kind, reachable: false, notes };
      } finally {
        clearTimeout(timer);
      }
    }),
  );

  return results;
}
