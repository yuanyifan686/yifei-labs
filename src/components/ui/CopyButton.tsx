"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";

export function CopyButton({ text, label = "复制" }: { text: string; label?: string }) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1600);
  }

  return (
    <Button variant="secondary" onClick={copy}>
      {copied ? "已复制" : label}
    </Button>
  );
}
