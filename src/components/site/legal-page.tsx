import type { ReactNode } from "react";
import { PageHero } from "@/components/site/page-hero";
import { Card } from "@/components/ui/card";
import { Section } from "@/components/ui/section";

export type LegalSection = { heading: string; body: ReactNode };

// Shared layout for the terms and privacy pages.
export function LegalPage({ title, updated, sections }: { title: string; updated: string; sections: LegalSection[] }) {
  return (
    <main>
      <PageHero eyebrow="Legal" title={title}>
        Last updated {updated}
      </PageHero>
      <Section>
        <Card tone="solid" className="mx-auto max-w-3xl">
          <div className="grid gap-8">
            {sections.map((section) => (
              <section key={section.heading}>
                <h2 className="text-xl font-bold">{section.heading}</h2>
                <div className="mt-2 grid gap-3 text-muted">{section.body}</div>
              </section>
            ))}
          </div>
        </Card>
      </Section>
    </main>
  );
}
