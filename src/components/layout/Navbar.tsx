"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";
import { SettingsMenu } from "@/components/layout/SettingsMenu";
import { CTA_LINKS, isNavItemActive, NAV_ITEMS } from "@/lib/navigation";

function navLinkClass(active: boolean) {
  return active
    ? "bg-white/[0.08] text-white shadow-[0_0_12px_rgba(56,189,248,0.12)]"
    : "text-slate-400 hover:bg-white/[0.05] hover:text-white";
}

function NavbarInner() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [open, setOpen] = useState(false);
  const mode = searchParams.get("mode");

  return (
    <header className="sticky top-0 z-40 animate-fade-in border-b border-white/10 bg-black/35 pt-[env(safe-area-inset-top,0px)] shadow-lg shadow-black/20 backdrop-blur-xl">
      <nav className="mx-auto flex h-14 max-w-6xl min-w-0 items-center justify-between gap-2 px-4 sm:h-16 sm:px-6">
        <Link
          href="/"
          className="group flex min-w-0 items-center gap-2.5"
          onClick={() => setOpen(false)}
        >
          <span className="liquid-glass grid h-8 w-8 shrink-0 place-items-center rounded-lg text-[11px] font-semibold tracking-wide text-white transition group-hover:scale-105">
            YL
          </span>
          <span className="min-w-0">
            <span className="block truncate text-sm font-semibold tracking-tight text-white">
              Yifei Labs
            </span>
            <span className="hidden truncate text-[11px] font-medium text-slate-400 sm:block">
              Career Intelligence
            </span>
          </span>
        </Link>

        <div className="hidden items-center gap-0.5 rounded-full border border-white/10 bg-white/[0.04] p-1 text-sm font-medium backdrop-blur-md md:flex">
          {NAV_ITEMS.map((item) => {
            const active = isNavItemActive(item.href, pathname, mode);
            return (
              <Link
                className={`rounded-full px-3 py-1.5 transition-all duration-200 ${navLinkClass(active)}`}
                href={item.href}
                key={item.label}
              >
                {item.label}
              </Link>
            );
          })}
        </div>

        <div className="flex shrink-0 items-center gap-2">
          <Link
            href={CTA_LINKS.jobBank}
            className="hidden min-h-10 items-center rounded-full border border-white/15 bg-white/[0.04] px-3.5 py-1.5 text-sm font-medium text-white transition hover:-translate-y-0.5 hover:border-white/25 hover:bg-white/[0.07] lg:inline-flex"
          >
            岗位库
          </Link>
          <Link
            href={CTA_LINKS.startAnalysis}
            className="hidden min-h-10 items-center rounded-full border border-white/10 bg-gradient-to-r from-sky-400 via-cyan-400 to-violet-500 px-3.5 py-1.5 text-sm font-medium text-slate-950 shadow-md shadow-cyan-500/15 transition hover:-translate-y-0.5 hover:from-sky-300 hover:to-violet-400 active:scale-[0.98] sm:inline-flex"
          >
            开始分析
          </Link>
          <SettingsMenu />
          <button
            type="button"
            aria-label={open ? "关闭菜单" : "打开菜单"}
            aria-expanded={open}
            className="grid h-9 w-9 place-items-center rounded-full border border-white/15 bg-white/[0.04] text-white transition hover:border-white/25 hover:bg-white/[0.08] md:hidden"
            onClick={() => setOpen((v) => !v)}
          >
            <span className="flex flex-col gap-1">
              <span
                className={`block h-0.5 w-4 bg-current transition duration-200 ${open ? "translate-y-1.5 rotate-45" : ""}`}
              />
              <span
                className={`block h-0.5 w-4 bg-current transition duration-200 ${open ? "opacity-0" : ""}`}
              />
              <span
                className={`block h-0.5 w-4 bg-current transition duration-200 ${open ? "-translate-y-1.5 -rotate-45" : ""}`}
              />
            </span>
          </button>
        </div>
      </nav>

      {open ? (
        <div className="animate-fade-up border-t border-white/10 bg-black/70 px-4 py-3 backdrop-blur-xl md:hidden">
          <div className="mx-auto flex max-w-6xl flex-col gap-0.5">
            {NAV_ITEMS.map((item) => {
              const active = isNavItemActive(item.href, pathname, mode);
              return (
                <Link
                  key={item.label}
                  href={item.href}
                  onClick={() => setOpen(false)}
                  className={`rounded-xl px-3 py-2.5 text-sm font-medium transition ${navLinkClass(active)}`}
                >
                  {item.label}
                </Link>
              );
            })}
            <Link
              href={CTA_LINKS.startAnalysis}
              onClick={() => setOpen(false)}
              className="mt-2 min-h-10 rounded-xl bg-gradient-to-r from-sky-400 via-cyan-400 to-violet-500 px-3 py-2.5 text-center text-sm font-medium text-slate-950"
            >
              开始分析
            </Link>
          </div>
        </div>
      ) : null}
    </header>
  );
}

export function Navbar() {
  return (
    <Suspense
      fallback={
        <header className="sticky top-0 z-40 h-14 border-b border-white/10 bg-black/35 sm:h-16" />
      }
    >
      <NavbarInner />
    </Suspense>
  );
}
