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
  return <div className={cn("rounded-3xl p-6", tones[tone], className)} {...props} />;
}
