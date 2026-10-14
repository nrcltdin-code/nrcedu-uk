import type { ReactNode } from "react";
import { Container } from "@/components/ui/section";

// Coloured banner at the top of every inner page of the public site.
export function PageHero({
  eyebrow,
  title,
  highlight,
  children,
}: {
  eyebrow?: string;
  title: string;
  highlight?: string;
  children?: ReactNode;
}) {
  return (
    <Container className="pt-6">
      <div className="bg-vivid rounded-[2rem] px-6 py-14 text-center text-white sm:px-12 sm:py-20">
        {eyebrow && (
          <p className="mb-4 inline-flex items-center gap-2 rounded-full border border-white/25 bg-white/10 px-4 py-1.5 text-xs font-bold uppercase tracking-widest text-accent-400">
            <span className="size-1.5 rounded-full bg-accent-500" />
            {eyebrow}
          </p>
        )}
        <h1 className="mx-auto max-w-3xl text-4xl font-extrabold tracking-tight sm:text-5xl">
          {title}
          {highlight && <span className="text-gradient-warm"> {highlight}</span>}
        </h1>
        {children && <p className="mx-auto mt-5 max-w-2xl text-lg text-white/85">{children}</p>}
      </div>
    </Container>
  );
}
