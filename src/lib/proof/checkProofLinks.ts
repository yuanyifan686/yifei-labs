import { lookup } from "node:dns/promises";
import { isIP } from "node:net";
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

function isPrivateIpv4(ip: string) {
  const parts = ip.split(".").map((part) => Number(part));
  if (parts.length !== 4 || parts.some((part) => !Number.isInteger(part) || part < 0 || part > 255)) {
    return true;
  }
  const [a, b] = parts;
  return (
    a === 0 ||
    a === 10 ||
    a === 127 ||
    (a === 100 && b >= 64 && b <= 127) ||
    (a === 169 && b === 254) ||
    (a === 172 && b >= 16 && b <= 31) ||
    (a === 192 && b === 168) ||
    (a === 198 && (b === 18 || b === 19)) ||
    a >= 224
  );
}

function isPrivateIpv6(ip: string) {
  const value = ip.toLowerCase();
  return (
    value === "::1" ||
    value === "::" ||
    value.startsWith("fc") ||
    value.startsWith("fd") ||
    value.startsWith("fe80:") ||
    value.startsWith("ff") ||
    value.includes("::ffff:127.") ||
    value.includes("::ffff:10.") ||
    value.includes("::ffff:192.168.") ||
    /^::ffff:172\.(1[6-9]|2\d|3[0-1])\./.test(value)
  );
}

function isPrivateAddress(address: string) {
  const family = isIP(address);
  if (family === 4) return isPrivateIpv4(address);
  if (family === 6) return isPrivateIpv6(address);
  return true;
}

function isBlockedHostname(hostname: string) {
  const host = hostname.toLowerCase().replace(/\.$/, "");
  return (
    host === "localhost" ||
    host.endsWith(".localhost") ||
    host === "metadata.google.internal"
  );
}

async function validatePublicHttpUrl(rawUrl: string): Promise<URL> {
  let parsed: URL;
  try {
    parsed = new URL(rawUrl);
  } catch {
    throw new Error("链接格式无效");
  }

  if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
    throw new Error("仅允许 http(s) 链接");
  }

  if (parsed.username || parsed.password) {
    throw new Error("链接不能包含用户名或密码");
  }

  if (isBlockedHostname(parsed.hostname)) {
    throw new Error("不允许访问本机或云元数据地址");
  }

  if (isIP(parsed.hostname)) {
    if (isPrivateAddress(parsed.hostname)) {
      throw new Error("不允许访问内网或保留 IP 地址");
    }
    return parsed;
  }

  const addresses = await lookup(parsed.hostname, { all: true, verbatim: true });
  if (!addresses.length || addresses.some((item) => isPrivateAddress(item.address))) {
    throw new Error("域名解析到内网或保留地址");
  }

  return parsed;
}

async function fetchPublicUrl(
  url: string,
  init: RequestInit,
  maxRedirects = 3,
): Promise<Response> {
  let current = await validatePublicHttpUrl(url);

  for (let redirect = 0; redirect <= maxRedirects; redirect += 1) {
    const res = await fetch(current, {
      ...init,
      redirect: "manual",
    });

    if (res.status < 300 || res.status >= 400) {
      return res;
    }

    const location = res.headers.get("location");
    if (!location) return res;
    current = await validatePublicHttpUrl(new URL(location, current).toString());
  }

  throw new Error("重定向次数过多");
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

      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), timeoutMs);
      try {
        await validatePublicHttpUrl(url);
        let res = await fetchPublicUrl(url, {
          method: "HEAD",
          signal: controller.signal,
          headers: { "User-Agent": "YifeiLabs-ProofCheck/1.0" },
        });
        // Some hosts block HEAD
        if (res.status === 405 || res.status === 403 || res.status === 404) {
          res = await fetchPublicUrl(url, {
            method: "GET",
            signal: controller.signal,
            headers: {
              "User-Agent": "YifeiLabs-ProofCheck/1.0",
              Range: "bytes=0-0",
            },
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
