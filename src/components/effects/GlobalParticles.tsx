"use client";

import { useEffect, useRef } from "react";

type Particle = {
  x: number;
  y: number;
  vx: number;
  vy: number;
  r: number;
  phase: number;
  twinkle: number;
  hue: "cyan" | "blue" | "violet";
};

function makeParticle(width: number, height: number): Particle {
  const hueRoll = Math.random();
  return {
    x: Math.random() * width,
    y: Math.random() * height,
    vx: (Math.random() - 0.5) * 0.16,
    vy: (Math.random() - 0.5) * 0.13,
    r: 0.65 + Math.random() * 1.45,
    phase: Math.random() * Math.PI * 2,
    twinkle: 0.6 + Math.random() * 1.4,
    hue: hueRoll > 0.78 ? "violet" : hueRoll > 0.48 ? "blue" : "cyan",
  };
}

function particleColor(particle: Particle, alpha: number, light: boolean) {
  if (light) {
    if (particle.hue === "violet") return `rgba(124, 58, 237, ${alpha * 0.46})`;
    if (particle.hue === "blue") return `rgba(14, 165, 233, ${alpha * 0.55})`;
    return `rgba(6, 182, 212, ${alpha * 0.5})`;
  }

  if (particle.hue === "violet") return `rgba(168, 85, 247, ${alpha * 0.72})`;
  if (particle.hue === "blue") return `rgba(56, 189, 248, ${alpha * 0.78})`;
  return `rgba(125, 211, 252, ${alpha * 0.82})`;
}

export function GlobalParticles() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const motion = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (motion.matches) return;

    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;

    let width = 0;
    let height = 0;
    let raf = 0;
    let particles: Particle[] = [];
    const dpr = Math.min(window.devicePixelRatio || 1, 2);

    const resize = () => {
      width = window.innerWidth;
      height = window.innerHeight;
      canvas.width = Math.floor(width * dpr);
      canvas.height = Math.floor(height * dpr);
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    const count = Math.min(210, Math.max(96, Math.floor((width * height) / 9800)));
      particles = Array.from({ length: count }, () => makeParticle(width, height));
    };

    const tick = (time: number) => {
      ctx.clearRect(0, 0, width, height);
      const light = document.documentElement.dataset.theme === "light";
      ctx.globalCompositeOperation = light ? "source-over" : "lighter";

      for (const particle of particles) {
        particle.x += particle.vx;
        particle.y += particle.vy;

        if (particle.x < -12) particle.x = width + 12;
        if (particle.x > width + 12) particle.x = -12;
        if (particle.y < -12) particle.y = height + 12;
        if (particle.y > height + 12) particle.y = -12;

        const wave = 0.55 + Math.sin(time * 0.001 * particle.twinkle + particle.phase) * 0.45;
        const rightBias = 0.72 + (particle.x / Math.max(width, 1)) * 0.38;
        const alpha = Math.min(1, (0.26 + wave * 0.68) * rightBias);
        const radius = particle.r * (0.9 + wave * 0.58);

        ctx.beginPath();
        ctx.fillStyle = particleColor(particle, alpha, light);
        ctx.arc(particle.x, particle.y, radius, 0, Math.PI * 2);
        ctx.fill();
      }

      ctx.globalCompositeOperation = "source-over";
      raf = window.requestAnimationFrame(tick);
    };

    resize();
    window.addEventListener("resize", resize);
    raf = window.requestAnimationFrame(tick);

    return () => {
      window.cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
    };
  }, []);

  return <canvas ref={canvasRef} className="cinematic-bg cinematic-bg-particles" aria-hidden />;
}
