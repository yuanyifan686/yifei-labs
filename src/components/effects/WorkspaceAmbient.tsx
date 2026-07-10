"use client";

import { useEffect, useRef, useState } from "react";
import { useTheme } from "@/components/providers/ThemeProvider";

type Particle = {
  x: number;
  y: number;
  vx: number;
  vy: number;
  r: number;
};

/**
 * Lightweight 2D canvas dust field for workspace atmosphere.
 * Disabled on mobile, reduced-motion, or when ambient pref is off.
 */
export function WorkspaceAmbient() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const { fx, ready } = useTheme();
  const [enabled, setEnabled] = useState(false);

  useEffect(() => {
    if (!ready) return;
    const mqMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
    const mqMobile = window.matchMedia("(max-width: 640px)");
    const evaluate = () => {
      setEnabled(fx.ambient && !mqMotion.matches && !mqMobile.matches);
    };
    evaluate();
    mqMotion.addEventListener("change", evaluate);
    mqMobile.addEventListener("change", evaluate);
    return () => {
      mqMotion.removeEventListener("change", evaluate);
      mqMobile.removeEventListener("change", evaluate);
    };
  }, [fx.ambient, ready]);

  useEffect(() => {
    if (!enabled) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let raf = 0;
    let particles: Particle[] = [];
    let w = 0;
    let h = 0;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);

    function resize() {
      const parent = canvas!.parentElement;
      w = parent?.clientWidth || window.innerWidth;
      h = parent?.clientHeight || window.innerHeight;
      canvas!.width = Math.floor(w * dpr);
      canvas!.height = Math.floor(h * dpr);
      canvas!.style.width = `${w}px`;
      canvas!.style.height = `${h}px`;
      ctx!.setTransform(dpr, 0, 0, dpr, 0, 0);

      const count = Math.min(36, Math.max(18, Math.floor((w * h) / 45000)));
      particles = Array.from({ length: count }, () => ({
        x: Math.random() * w,
        y: Math.random() * h,
        vx: (Math.random() - 0.5) * 0.22,
        vy: (Math.random() - 0.5) * 0.18,
        r: 0.6 + Math.random() * 1.4,
      }));
    }

    function tick() {
      ctx!.clearRect(0, 0, w, h);
      const theme = document.documentElement.dataset.theme || "dark";
      const stroke =
        theme === "light"
          ? "rgba(14, 165, 233, 0.12)"
          : "rgba(56, 189, 248, 0.22)";
      const fill =
        theme === "light"
          ? "rgba(99, 102, 241, 0.35)"
          : "rgba(125, 211, 252, 0.55)";

      for (const p of particles) {
        p.x += p.vx;
        p.y += p.vy;
        if (p.x < -10) p.x = w + 10;
        if (p.x > w + 10) p.x = -10;
        if (p.y < -10) p.y = h + 10;
        if (p.y > h + 10) p.y = -10;
      }

      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const a = particles[i];
          const b = particles[j];
          const dx = a.x - b.x;
          const dy = a.y - b.y;
          const dist = Math.hypot(dx, dy);
          if (dist < 110) {
            ctx!.beginPath();
            ctx!.strokeStyle = stroke;
            ctx!.globalAlpha = (1 - dist / 110) * 0.45;
            ctx!.lineWidth = 1;
            ctx!.moveTo(a.x, a.y);
            ctx!.lineTo(b.x, b.y);
            ctx!.stroke();
          }
        }
      }
      ctx!.globalAlpha = 1;

      for (const p of particles) {
        ctx!.beginPath();
        ctx!.fillStyle = fill;
        ctx!.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx!.fill();
      }

      raf = window.requestAnimationFrame(tick);
    }

    resize();
    window.addEventListener("resize", resize);
    raf = window.requestAnimationFrame(tick);

    return () => {
      window.cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
    };
  }, [enabled]);

  if (!enabled) return null;

  return (
    <canvas
      ref={canvasRef}
      className="workspace-ambient"
      aria-hidden
    />
  );
}
