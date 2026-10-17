import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { CtaBand } from "@/components/site/cta-band";
import { PageHero } from "@/components/site/page-hero";
import { Prose } from "@/components/site/prose";
import { Card } from "@/components/ui/card";
import { Section } from "@/components/ui/section";
import { getTestPrepPage } from "@/lib/data/content";
import { getTestPrepPages } from "@/lib/data/home";
import { parseFacts, parseTables } from "@/lib/test-prep";

type Props = PageProps<"/test-prep/[slug]">;

export async function generateStaticParams() {
  const tests = await getTestPrepPages();
  return tests.length > 0 ? tests.map(({ slug }) => ({ slug })) : [{ slug: "__none__" }];
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const test = await getTestPrepPage((await params).slug);
  if (!test) return {};
  return {
    title: `${test.name} preparation`,
    description: test.summary ?? `What the ${test.name} test is, the scores universities ask for, and how to prepare.`,
  };
}

export default async function TestPrepPage({ params }: Props) {
  const { slug } = await params;
  const [test, tests] = await Promise.all([getTestPrepPage(slug), getTestPrepPages()]);
  if (!test) notFound();

  const others = tests.filter((other) => other.slug !== test.slug);
  const facts = parseFacts(test.facts);
  const tables = parseTables(test.tables);

  return (
    <main>
      <PageHero eyebrow="Test preparation" title={test.name} highlight="preparation">
        {test.summary}
      </PageHero>

      <Section tint="violet">
        <div className="grid items-start gap-8 lg:grid-cols-[1.7fr_1fr]">
          <div className="grid gap-8">
          {tables.map((table, i) => (
            <Card key={i} className="p-6 sm:p-8">
              {table.title && <h2 className="mb-4 text-2xl font-bold">{table.title}</h2>}
              <div className="-mx-2 overflow-x-auto px-2">
                <table className="w-full min-w-[32rem] border-collapse text-left">
                  <thead>
                    <tr className="border-b-2 border-brand-600/25">
                      {table.columns.map((c, j) => <th key={j} scope="col" className="px-3 py-2.5 text-sm font-semibold uppercase tracking-wide text-brand-800">{c}</th>)}
                    </tr>
                  </thead>
                  <tbody>
                    {table.rows.map((row, r) => (
                      <tr key={r} className="border-b border-brand-900/10 even:bg-brand-600/[0.04]">
                        {row.map((v, j) => (j === 0 ? <th key={j} scope="row" className="px-3 py-2.5 font-semibold">{v}</th> : <td key={j} className="px-3 py-2.5 text-ink/85">{v}</td>))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {table.note && <p className="mt-3 text-sm text-muted">{table.note}</p>}
            </Card>
          ))}
          <Card className="p-6 sm:p-10">
            {test.content ? (
              <Prose text={test.content} />
            ) : (
              <p className="text-lg text-ink/85">
                Our full guide to {test.name} is being written. In the meantime, a counsellor can tell you the score
                your chosen universities require and how to book the test.
              </p>
            )}
          </Card>
          </div>

          <div className="grid gap-6 lg:sticky lg:top-28">
          {facts.length > 0 && (
            <Card>
              <h2 className="text-lg font-bold">At a glance</h2>
              <dl className="mt-3 divide-y divide-brand-900/10">
                {facts.map((f, i) => (
                  <div key={i} className="flex justify-between gap-4 py-2.5 text-sm">
                    <dt className="text-muted">{f.label}</dt>
                    <dd className="text-right font-semibold">{f.value}</dd>
                  </div>
                ))}
              </dl>
            </Card>
          )}
          {others.length > 0 && (
            <Card>
              <h2 className="text-lg font-bold">Other tests</h2>
              <ul className="mt-3 divide-y divide-brand-900/10">
                {others.map((other) => (
                  <li key={other.id}>
                    <Link href={`/test-prep/${other.slug}`} className="block py-3 font-medium hover:text-brand-700">
                      {other.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </Card>
          )}
          </div>
        </div>
      </Section>

      <CtaBand title={`Need help with ${test.name}?`} text="We will tell you the score you need and help you plan your preparation." />
    </main>
  );
}
