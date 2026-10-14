import type { ComponentProps } from "react";
import { cn } from "@/lib/cn";

type Tone = "brand" | "accent" | "success" | "danger" | "neutral";

const tones: Record<Tone, string> = {
  brand: "bg-brand-600/12 text-brand-800 border-brand-600/20",
  accent: "bg-accent-500/15 text-accent-600 border-accent-500/30",
  success: "bg-emerald-500/12 text-emerald-800 border-emerald-500/25",
  danger: "bg-red-500/12 text-red-800 border-red-500/25",
  neutral: "bg-white/60 text-muted border-white/70",
};

type BadgeProps = ComponentProps<"span"> & { tone?: Tone };

export function Badge({ tone = "brand", className, ...props }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold backdrop-blur-md",
        tones[tone],
        className,
      )}
      {...props}
    />
  );
}
