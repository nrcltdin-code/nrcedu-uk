import type { Metadata } from "next";
import { Suspense } from "react";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { CtaBand } from "@/components/site/cta-band";
import { Prose } from "@/components/site/prose";
import { UniversityCard } from "@/components/site/university-card";
import { buttonStyles } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Container, Section } from "@/components/ui/section";
import { getDestination } from "@/lib/data/catalogue";
import { getDestinations } from "@/lib/data/home";
import { breadcrumbLd, pageMetadata } from "@/lib/seo";
import { JsonLd } from "@/components/site/json-ld";

type Props = PageProps<"/destinations/[slug]">;

export async function generateStaticParams() {
  const countries = await getDestinations();
  return countries.length > 0 ? countries.map(({ slug }) => ({ slug })) : [{ slug: "__none__" }];
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const country = await getDestination((await params).slug);
  if (!country) return {};
  const count = country.universities.length;
  return pageMetadata({
    title: `Study in ${country.name}`,
    description:
      country.description ??
      `Study in ${country.name}${count ? ` at ${count} partner ${count === 1 ? "university" : "universities"}` : ""}: courses, fees, intakes and student visa support from NRC Educational Consultant.`,
    path: `/destinations/${country.slug}`,
    image: country.imageUrl,
  });
}

// Params are read inside <Suspense>: with Partial Prefetching, an address that was not built ahead of
// time (a new record, or a page whose cache a content change refreshed) is generated on request, and
// reading params above the boundary makes that render fail.
export default function DestinationPage({ params }: Props) {
  return (
    <Suspense fallback={<main className="min-h-dvh" />}>
      <DestinationContent params={params} />
    </Suspense>
  );
}

async function DestinationContent({ params }: Pick<Props, "params">) {
  const country = await getDestination((await params).slug);
  if (!country) notFound();

  return (
    <main>
      <JsonLd
        data={[
          breadcrumbLd([
            { name: "Destinations", path: "/destinations" },
            { name: `Study in ${country.name}`, path: `/destinations/${country.slug}` },
          ]),
        ]}
      />
      <Container className="pt-6">
        <div className="bg-deep relative isolate overflow-hidden rounded-[2rem] text-white">
          {country.imageUrl && (
            <Image src={country.imageUrl} alt="" fill priority sizes="(min-width: 1152px) 1104px, 100vw" className="-z-10 object-cover saturate-125" />
          )}
          <div className="absolute inset-0 -z-10 bg-linear-to-r from-deep-900/95 via-brand-800/75 to-brand-600/40" />
          <div className="px-6 py-14 sm:px-12 sm:py-20">
            <nav aria-label="Breadcrumb" className="mb-5 text-sm text-white/75">
              <Link href="/destinations" className="hover:text-white">
                Destinations
              </Link>
            </nav>
            <h1 className="text-4xl font-extrabold tracking-tight sm:text-5xl">
              Study in <span className="text-gradient-warm">{country.name}</span>
            </h1>
            {(country.tagline || country.description) && (
              <p className="mt-5 line-clamp-2 max-w-2xl text-lg text-white/90">{country.tagline || country.description}</p>
            )}
            <Link href="/consultation" className={buttonStyles({ variant: "accent", size: "lg", className: "mt-8" })}>
              Book a free consultation
            </Link>
          </div>
        </div>
      </Container>

      {country.content && (
        <Section>
          <article className="mx-auto max-w-3xl">
            <h2 className="mb-6 text-3xl font-extrabold tracking-tight">
              About studying in <span className="text-gradient">{country.name}</span>
            </h2>
            <Prose text={country.content} />
          </article>
        </Section>
      )}

      <Section tint="amber">
        <h2 className="mb-8 text-3xl font-extrabold tracking-tight">
          Universities in <span className="text-gradient">{country.name}</span>
        </h2>
        {country.universities.length === 0 ? (
          <Card>
            We are adding universities in {country.name}. Ask a counsellor for the current list.
          </Card>
        ) : (
          <ul className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {country.universities.map((university) => (
              <li key={university.id}>
                <UniversityCard university={university} />
              </li>
            ))}
          </ul>
        )}
      </Section>

      <CtaBand title={`Planning to study in ${country.name}?`} text="We handle your application and your student visa." />
    </main>
  );
}
