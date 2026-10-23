import type { Metadata } from "next";
import { Suspense } from "react";
import Image from "next/image";
import Link from "next/link";
import { buttonStyles } from "@/components/ui/button";
import { notFound } from "next/navigation";
import { CtaBand } from "@/components/site/cta-band";

import { Prose } from "@/components/site/prose";
import { Card } from "@/components/ui/card";
import { Container, Section } from "@/components/ui/section";
import { getTestPrepPage } from "@/lib/data/content";
import { getTestPrepPages } from "@/lib/data/home";
import { parseFacts, parseTables } from "@/lib/test-prep";
import { breadcrumbLd, pageMetadata } from "@/lib/seo";
import { JsonLd } from "@/components/site/json-ld";

type Props = PageProps<"/test-prep/[slug]">;

export async function generateStaticParams() {
  const tests = await getTestPrepPages();
  return tests.length > 0 ? tests.map(({ slug }) => ({ slug })) : [{ slug: "__none__" }];
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const test = await getTestPrepPage((await params).slug);
  if (!test) return {};
  return pageMetadata({
    title: `${test.name} preparation`,
    description: test.summary ?? `What the ${test.name} test is, the scores universities ask for, and how to prepare.`,
    path: `/test-prep/${test.slug}`,
    image: test.imageUrl,
  });
}

// Params are read inside <Suspense>: with Partial Prefetching, an address that was not built ahead of
// time (a new record, or a page whose cache a content change refreshed) is generated on request, and
// reading params above the boundary makes that render fail.
export default function TestPrepPage({ params }: Props) {
  return (
    <Suspense fallback={<main className="min-h-dvh" />}>
      <TestPrepContent params={params} />
    </Suspense>
  );
}

async function TestPrepContent({ params }: Pick<Props, "params">) {
  const { slug } = await params;
  const [test, tests] = await Promise.all([getTestPrepPage(slug), getTestPrepPages()]);
  if (!test) notFound();

  const others = tests.filter((other) => other.slug !== test.slug);
  const facts = parseFacts(test.facts);
  const tables = parseTables(test.tables);

  return (
    <main>
      <JsonLd
        data={[
          breadcrumbLd([
            { name: "Test preparation", path: "/test-prep" },
            { name: test.name, path: `/test-prep/${test.slug}` },
          ]),
        ]}
      />
      <Container className="pt-6">
        <div className="bg-deep relative isolate overflow-hidden rounded-[2rem] text-white">
          {test.imageUrl && (
            <Image src={test.imageUrl} alt="" fill priority sizes="(min-width: 1152px) 1104px, 100vw" className="-z-10 object-cover saturate-125" />
          )}
          <div className="absolute inset-0 -z-10 bg-linear-to-r from-deep-900/95 via-brand-800/75 to-brand-600/40" />
          <div className="px-6 py-14 sm:px-12 sm:py-20">
            <nav aria-label="Breadcrumb" className="mb-5 text-sm text-white/75">
              <Link href="/test-prep" className="hover:text-white">Test preparation</Link>
            </nav>
            <h1 className="text-4xl font-extrabold tracking-tight sm:text-5xl">
              {test.name} <span className="text-gradient-warm">preparation</span>
            </h1>
            {test.summary && <p className="mt-5 line-clamp-2 max-w-2xl text-lg text-white/90">{test.summary}</p>}
            <Link href="/consultation" className={buttonStyles({ variant: "accent", size: "lg", className: "mt-8" })}>
              Book a free consultation
            </Link>
          </div>
        </div>
      </Container>

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
