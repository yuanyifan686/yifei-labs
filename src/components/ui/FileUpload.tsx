"use client";

import { ChangeEvent, InputHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

const DEFAULT_ACCEPT =
  ".pdf,.docx,.txt,.md,.csv,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document,text/plain";

export function FileUpload({
  label = "上传文件",
  loadingLabel = "解析中…",
  loading = false,
  className,
  accept = DEFAULT_ACCEPT,
  onFileChange,
  ...props
}: {
  label?: string;
  loadingLabel?: string;
  loading?: boolean;
  onFileChange?: (event: ChangeEvent<HTMLInputElement>) => void;
} & Omit<InputHTMLAttributes<HTMLInputElement>, "type" | "onChange">) {
  return (
    <label
      className={cn(
        "cursor-pointer font-medium text-cyan-300 hover:text-cyan-200",
        loading && "pointer-events-none opacity-60",
        className,
      )}
    >
      {loading ? loadingLabel : label}
      <input
        className="hidden"
        type="file"
        accept={accept}
        disabled={loading || props.disabled}
        onChange={onFileChange}
        {...props}
      />
    </label>
  );
}
