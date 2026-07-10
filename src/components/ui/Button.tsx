import {
  ButtonHTMLAttributes,
  cloneElement,
  isValidElement,
  ReactElement,
  ReactNode,
} from "react";
import { cn } from "@/lib/utils";

type ButtonVariant = "primary" | "secondary" | "ghost" | "danger" | "command";

const variants: Record<ButtonVariant, string> = {
  primary:
    "bg-slate-100 text-slate-900 shadow-sm shadow-cyan-500/10 hover:bg-white active:scale-[0.98] disabled:bg-slate-700 disabled:text-slate-400 disabled:shadow-none",
  secondary:
    "border border-white/15 bg-white/[0.04] text-slate-100 hover:border-cyan-400/30 hover:bg-white/[0.08] active:scale-[0.98] disabled:text-slate-500",
  ghost:
    "text-slate-300 hover:bg-white/[0.06] hover:text-white active:scale-[0.98] disabled:text-slate-600",
  danger:
    "bg-red-500/90 text-white hover:bg-red-500 active:scale-[0.98] disabled:bg-red-900/40 disabled:text-red-300/50",
  command:
    "relative overflow-hidden border border-white/10 bg-gradient-to-r from-sky-500 via-blue-600 to-violet-600 text-white shadow-lg shadow-cyan-500/20 hover:from-sky-400 hover:to-violet-500 active:scale-[0.98] disabled:from-slate-700 disabled:to-slate-700 disabled:text-slate-400 disabled:shadow-none",
};

const baseClass =
  "inline-flex min-h-10 items-center justify-center gap-2 rounded-lg px-4 py-2 text-sm font-medium tracking-tight transition-all duration-200 disabled:cursor-not-allowed disabled:active:scale-100";

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
  /** Merge styles onto a child element (e.g. Next.js Link) — avoids a>button. */
  asChild?: boolean;
  children?: ReactNode;
};

export function Button({
  className,
  variant = "primary",
  type = "button",
  asChild = false,
  children,
  ...props
}: ButtonProps) {
  const classes = cn(baseClass, variants[variant], className);

  if (asChild && isValidElement(children)) {
    const child = children as ReactElement<{ className?: string }>;
    return cloneElement(child, {
      className: cn(classes, child.props.className),
    });
  }

  return (
    <button type={type} className={classes} {...props}>
      {children}
    </button>
  );
}
