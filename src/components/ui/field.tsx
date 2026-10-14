import type { ComponentProps } from "react";
import { cn } from "@/lib/cn";

const control = cn(
  "w-full rounded-xl border border-white/70 bg-white/60 px-4 text-sm text-ink",
  "placeholder:text-muted/70 transition-colors",
  "focus:border-brand-400 focus:bg-white/85 focus:outline-2 focus:outline-brand-400/40",
  "disabled:opacity-60",
);

export function Label({ className, ...props }: ComponentProps<"label">) {
  return (
    <label className={cn("mb-1.5 block text-sm font-medium text-ink", className)} {...props} />
  );
}

export function Input({ className, ...props }: ComponentProps<"input">) {
  return <input className={cn(control, "h-11", className)} {...props} />;
}

export function Textarea({ className, ...props }: ComponentProps<"textarea">) {
  return <textarea className={cn(control, "min-h-28 py-3", className)} {...props} />;
}

export function Select({ className, ...props }: ComponentProps<"select">) {
  return <select className={cn(control, "h-11", className)} {...props} />;
}
