"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

export function AnimatedNumber({
  value,
  className,
  duration = 700,
  suffix = "",
}: {
  value: number;
  className?: string;
  duration?: number;
  suffix?: string;
}) {
  const [display, setDisplay] = useState(0);

  useEffect(() => {
    let frame = 0;
    const start = performance.now();
    const from = 0;
    const to = value;

    function tick(now: number) {
      const t = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - t, 3);
      setDisplay(Math.round(from + (to - from) * eased));
      if (t < 1) frame = requestAnimationFrame(tick);
    }

    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [value, duration]);

  return (
    <span className={cn("tabular-nums", className)}>
      {display}
      {suffix}
    </span>
  );
}
