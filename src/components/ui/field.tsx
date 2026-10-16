import type { ComponentProps } from "react";
import { cn } from "@/lib/cn";

const control = cn(
  // A clear border and solid fill, so fields stand out on white glass cards as well as on colour.
  "w-full rounded-xl border border-brand-900/20 bg-white px-4 text-sm text-ink shadow-[inset_0_1px_2px_rgb(18_52_83/0.06)]",
  "placeholder:text-muted/70 transition-colors hover:border-brand-900/35",
  "focus:border-brand-500 focus:outline-2 focus:outline-brand-400/40",
  "disabled:cursor-not-allowed disabled:bg-brand-900/5 disabled:text-muted",
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
