import type { Metadata } from "next";
import Link from "next/link";
import { CtaBand } from "@/components/site/cta-band";
import { PageHero } from "@/components/site/page-hero";
import { Card } from "@/components/ui/card";
import { Icon } from "@/components/ui/icon";
import { Section } from "@/components/ui/section";
import { getTestPrepPages } from "@/lib/data/home";

export const metadata: Metadata = {
  title: "Test preparation",
  description: "Guidance on IELTS, TOEFL, PTE, Duolingo, GRE and GMAT for students applying to universities abroad.",
};

export default async function TestPrepIndexPage() {
  const tests = await getTestPrepPages();

  return (
    <main>
      <PageHero eyebrow="Test preparation" title="Get the score" highlight="your university asks for">
        We tell you which test to take, what score you need, and how to prepare for it.
      </PageHero>

      <Section tint="sky">
        {tests.length === 0 ? (
          <Card>Test preparation guides will be listed here soon.</Card>
        ) : (
          <ul className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {tests.map((test) => (
              <li key={test.id}>
                <Link href={`/test-prep/${test.slug}`} className="group block h-full">
                  <Card className="flex h-full flex-col transition duration-300 group-hover:-translate-y-1.5 group-hover:shadow-2xl group-hover:shadow-brand-600/25">
                    <h2 className="text-gradient font-display text-4xl font-extrabold">{test.name}</h2>
                    {test.summary && <p className="mt-3 text-muted">{test.summary}</p>}
                    <span className="mt-auto inline-flex items-center gap-1 pt-5 text-sm font-semibold text-brand-700">
                      Read the guide <Icon name="arrowRight" className="size-4 transition group-hover:translate-x-1" />
                    </span>
                  </Card>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </Section>

      <CtaBand title="Not sure which test you need?" text="It depends on your course and country. We will check for you." />
    </main>
  );
}
