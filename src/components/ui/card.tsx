import type { ComponentProps } from "react";
import { cn } from "@/lib/cn";

type Tone = "light" | "solid" | "dark";

const tones: Record<Tone, string> = {
  light: "glass",
  solid: "glass-solid",
  dark: "glass-dark text-white",
};

type CardProps = ComponentProps<"div"> & { tone?: Tone };

export function Card({ tone = "light", className, ...props }: CardProps) {
  // min-w-0: as a grid or flex item a card may shrink, so a long unbroken line inside cannot widen the page.
  return <div className={cn("min-w-0 rounded-3xl p-6", tones[tone], className)} {...props} />;
}
