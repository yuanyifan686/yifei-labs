"use client";

import { useEffect, useRef, useState } from "react";
import { useTheme } from "@/components/providers/ThemeProvider";
import { feedback } from "@/lib/fx/feedback";
import { cn } from "@/lib/utils";

export function SettingsMenu() {
  const { theme, toggleTheme, fx, setFx, ready } = useTheme();
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!open) return;
    function onDoc(e: MouseEvent) {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", onDoc);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDoc);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <div className="relative" ref={rootRef}>
      <button
        type="button"
        aria-label="显示设置"
        aria-expanded={open}
        title="显示设置"
        className="grid h-9 w-9 place-items-center rounded-lg border border-[var(--yl-border)] text-[var(--yl-text)] transition hover:border-cyan-400/30 hover:bg-[var(--yl-primary-soft)]"
        onClick={() => setOpen((v) => !v)}
      >
        <span className="text-sm" aria-hidden>
          ⚙
        </span>
      </button>

      {open ? (
        <div className="settings-panel absolute right-0 z-50 mt-2 w-64 animate-fade-up rounded-xl border border-[var(--yl-border)] bg-[var(--yl-surface)] p-3 shadow-2xl shadow-black/20 backdrop-blur-xl">
          <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[var(--yl-text-muted)]">
            Experience
          </p>
          <div className="mt-3 space-y-2.5">
            <ToggleRow
              label="浅色主题"
              checked={theme === "light"}
              disabled={!ready}
              onChange={() => {
                toggleTheme();
                feedback("click");
              }}
            />
            <ToggleRow
              label="工作台氛围粒子"
              checked={fx.ambient}
              disabled={!ready}
              onChange={(v) => {
                setFx({ ambient: v });
                feedback("click");
              }}
            />
            <ToggleRow
              label="3D 技能星图"
              checked={fx.skillStar3d !== false}
              disabled={!ready}
              onChange={(v) => {
                setFx({ skillStar3d: v });
                feedback("click");
              }}
            />
            <ToggleRow
              label="音效反馈"
              checked={fx.sound}
              disabled={!ready}
              onChange={(v) => {
                setFx({ sound: v });
                if (v) feedback("success");
              }}
            />
            <ToggleRow
              label="触感反馈"
              checked={fx.haptic}
              disabled={!ready}
              onChange={(v) => {
                setFx({ haptic: v });
                if (v) feedback("click");
              }}
            />
          </div>
          <p className="mt-3 text-[10px] leading-4 text-[var(--yl-text-muted)]">
            音效和触感默认关闭。氛围粒子会在移动端或减少动态效果时自动降级。
          </p>
        </div>
      ) : null}
    </div>
  );
}

function ToggleRow({
  label,
  checked,
  disabled,
  onChange,
}: {
  label: string;
  checked: boolean;
  disabled?: boolean;
  onChange: (value: boolean) => void;
}) {
  return (
    <label
      className={cn(
        "flex cursor-pointer items-center justify-between gap-3 rounded-lg border border-[var(--yl-border)] bg-[color-mix(in_srgb,var(--yl-surface-muted)_75%,transparent)] px-2.5 py-2 text-sm text-[var(--yl-text)]",
        disabled && "cursor-not-allowed opacity-50",
      )}
    >
      <span>{label}</span>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        disabled={disabled}
        className={cn(
          "relative h-6 w-10 rounded-full border transition",
          checked
            ? "border-cyan-400/45 bg-cyan-400/25"
            : "border-[var(--yl-border)] bg-[color-mix(in_srgb,var(--yl-text-muted)_14%,transparent)]",
        )}
        onClick={() => onChange(!checked)}
      >
        <span
          className="absolute rounded-full bg-[var(--yl-text)] shadow transition"
          style={{
            width: 18,
            height: 18,
            left: checked ? 18 : 2,
            top: 2,
          }}
        />
      </button>
    </label>
  );
}
