"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";
import { SettingsMenu } from "@/components/layout/SettingsMenu";
import { CTA_LINKS, isNavItemActive, NAV_ITEMS } from "@/lib/navigation";

function navLinkClass(active: boolean) {
  return active
    ? "bg-[var(--yl-primary-soft)] text-[var(--yl-text)] shadow-[0_0_12px_rgba(56,189,248,0.12)]"
    : "text-[var(--yl-text-muted)] hover:bg-[var(--yl-primary-soft)] hover:text-[var(--yl-text)]";
}

function NavbarInner() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [open, setOpen] = useState(false);
  const mode = searchParams.get("mode");

  return (
    <header className="sticky top-0 z-40 border-b border-[var(--yl-border)] bg-[color-mix(in_srgb,var(--yl-bg)_90%,transparent)] shadow-lg shadow-black/10 backdrop-blur-xl pt-[env(safe-area-inset-top,0px)]">
      <nav className="mx-auto flex h-14 max-w-6xl min-w-0 items-center justify-between gap-2 px-4 sm:h-16 sm:px-6">
        <Link
          href="/"
          className="group flex min-w-0 items-center gap-2.5"
          onClick={() => setOpen(false)}
        >
          <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg border border-cyan-400/35 bg-gradient-to-br from-sky-500/30 to-violet-600/30 text-[11px] font-semibold tracking-wide text-[var(--yl-text)] shadow-[0_0_16px_rgba(56,189,248,0.18)] transition group-hover:scale-105 group-hover:shadow-[0_0_22px_rgba(56,189,248,0.25)]">
            YL
          </span>
          <span className="min-w-0">
            <span className="block truncate text-sm font-semibold tracking-tight text-[var(--yl-text)]">
              Yifei Labs
            </span>
            <span className="hidden truncate text-[11px] font-medium text-[var(--yl-text-muted)] sm:block">
              Career Intelligence
            </span>
          </span>
        </Link>

        <div className="hidden items-center gap-0.5 rounded-xl border border-[var(--yl-border)] bg-[color-mix(in_srgb,var(--yl-surface)_78%,transparent)] p-1 text-sm font-medium md:flex">
          {NAV_ITEMS.map((item) => {
            const active = isNavItemActive(item.href, pathname, mode);
            return (
              <Link
                className={`rounded-lg px-3 py-1.5 transition-all duration-200 ${navLinkClass(active)}`}
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
            className="hidden rounded-lg border border-[var(--yl-border)] px-3 py-1.5 text-sm font-medium text-[var(--yl-text)] transition hover:border-cyan-400/30 hover:bg-[var(--yl-primary-soft)] lg:inline-flex"
          >
            岗位库
          </Link>
          <Link
            href={CTA_LINKS.startAnalysis}
            className="hidden rounded-lg border border-white/10 bg-gradient-to-r from-sky-500 via-blue-600 to-violet-600 px-3 py-1.5 text-sm font-medium text-white shadow-md shadow-cyan-500/20 transition hover:from-sky-400 hover:to-violet-500 active:scale-[0.98] sm:inline-flex"
          >
            开始分析
          </Link>
          <SettingsMenu />
          <button
            type="button"
            aria-label={open ? "关闭菜单" : "打开菜单"}
            aria-expanded={open}
            className="grid h-9 w-9 place-items-center rounded-lg border border-[var(--yl-border)] text-[var(--yl-text)] transition hover:bg-[var(--yl-primary-soft)] md:hidden"
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
        <div className="animate-fade-up border-t border-[var(--yl-border)] bg-[color-mix(in_srgb,var(--yl-bg)_97%,transparent)] px-4 py-3 backdrop-blur md:hidden">
          <div className="mx-auto flex max-w-6xl flex-col gap-0.5">
            {NAV_ITEMS.map((item) => {
              const active = isNavItemActive(item.href, pathname, mode);
              return (
                <Link
                  key={item.label}
                  href={item.href}
                  onClick={() => setOpen(false)}
                  className={`rounded-lg px-3 py-2.5 text-sm font-medium transition ${navLinkClass(active)}`}
                >
                  {item.label}
                </Link>
              );
            })}
            <Link
              href={CTA_LINKS.startAnalysis}
              onClick={() => setOpen(false)}
              className="mt-2 rounded-lg bg-gradient-to-r from-sky-500 to-violet-600 px-3 py-2.5 text-center text-sm font-medium text-white"
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
        <header className="sticky top-0 z-40 h-14 border-b border-[var(--yl-border)] bg-[var(--yl-bg)] sm:h-16" />
      }
    >
      <NavbarInner />
    </Suspense>
  );
}
