import { HTMLAttributes } from "react";
import { cn } from "@/lib/utils";

export function Card({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "yl-card rounded-xl border shadow-[0_8px_32px_rgba(0,0,0,0.12)] backdrop-blur-md transition-[transform,box-shadow,border-color] duration-250",
        className,
      )}
      {...props}
    />
  );
}
