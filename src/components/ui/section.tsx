import type { ComponentProps, ReactNode } from "react";
import { cn } from "@/lib/cn";

export function Container({ className, ...props }: ComponentProps<"div">) {
  return <div className={cn("mx-auto w-full max-w-6xl px-4 sm:px-6", className)} {...props} />;
}

type Tone = "plain" | "deep" | "vivid";
type Tint = "sky" | "amber" | "violet";

const tints: Record<Tint, string> = {
  sky: "tint-sky",
  amber: "tint-amber",
  violet: "tint-violet",
};

type SectionProps = ComponentProps<"section"> & {
  // "deep" and "vivid" are dark bands with white text; pair them with glass-dark cards.
  tone?: Tone;
  // A colour wash behind a light section, so glass cards have colour to pick up.
  tint?: Tint;
};

export function Section({ tone = "plain", tint, className, children, ...props }: SectionProps) {
  return (
    <section
      className={cn(
        "relative isolate py-16 sm:py-24",
        tone === "deep" && "bg-deep text-white",
        tone === "vivid" && "bg-vivid text-white",
        className,
      )}
      {...props}
    >
      {tint && <div aria-hidden="true" className={cn("pointer-events-none absolute inset-0 -z-10", tints[tint])} />}
      <Container>{children}</Container>
    </section>
  );
}

export function SectionHeading({
  eyebrow,
  title,
  highlight,
  onDark,
  children,
}: {
  eyebrow?: string;
  title: string;
  // Words shown in gradient colour after the title, e.g. title "Where would you like to" + highlight "study?".
  highlight?: string;
  onDark?: boolean;
  children?: ReactNode;
}) {
  return (
    <div className="mx-auto mb-12 max-w-2xl text-center">
      {eyebrow && (
        <p
          className={cn(
            "mb-4 inline-flex items-center gap-2 rounded-full border px-4 py-1.5 text-xs font-bold uppercase tracking-widest",
            onDark ? "border-white/25 bg-white/10 text-accent-400" : "border-white/70 bg-white/60 text-brand-700",
          )}
        >
          <span className="size-1.5 rounded-full bg-accent-500" />
          {eyebrow}
        </p>
      )}
      <h2 className="text-3xl font-extrabold tracking-tight sm:text-4xl">
        {title}
        {highlight && <span className={onDark ? "text-gradient-warm" : "text-gradient"}> {highlight}</span>}
      </h2>
      {children && <p className="mt-4 text-base opacity-80">{children}</p>}
    </div>
  );
}
