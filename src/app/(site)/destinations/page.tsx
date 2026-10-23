import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { CtaBand } from "@/components/site/cta-band";
import { PageHero } from "@/components/site/page-hero";
import { Card } from "@/components/ui/card";
import { Icon } from "@/components/ui/icon";
import { Section } from "@/components/ui/section";
import { getDestinations } from "@/lib/data/home";
import { pageMetadata } from "@/lib/seo";

export const metadata: Metadata = pageMetadata({
  title: "Study destinations",
  description: "Compare the countries you can study in with NRC Educational Consultants: the UK, USA, Canada, Australia and Germany.",
  path: "/destinations",
});

export default async function DestinationsPage() {
  const countries = await getDestinations();

  return (
    <main>
      <PageHero eyebrow="Study destinations" title="Choose where to" highlight="study">
        Every country offers something different. Compare them, then explore the universities in each.
      </PageHero>

      <Section tint="sky">
        {countries.length === 0 ? (
          <Card>Destinations will be listed here soon.</Card>
        ) : (
          <ul className="grid gap-6 md:grid-cols-2">
            {countries.map((country) => (
              <li key={country.id}>
                <Link href={`/destinations/${country.slug}`} className="group block h-full">
                  <Card className="flex h-full overflow-hidden p-0 transition duration-300 group-hover:-translate-y-1.5 group-hover:shadow-2xl group-hover:shadow-brand-600/25">
                    <div className="bg-deep relative w-2/5 shrink-0">
                      {country.imageUrl && (
                        <Image src={country.imageUrl} alt="" fill sizes="(min-width: 768px) 220px, 40vw" className="object-cover transition duration-500 group-hover:scale-110" />
                      )}
                    </div>
                    <div className="p-6">
                      <h2 className="text-xl font-bold">{country.name}</h2>
                      <p className="mt-1 text-sm font-semibold text-brand-700">
                        {country._count.universities} {country._count.universities === 1 ? "university" : "universities"}
                      </p>
                      {country.description && <p className="mt-3 text-sm text-muted">{country.description}</p>}
                      <span className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-brand-700">
                        Explore <Icon name="arrowRight" className="size-4 transition group-hover:translate-x-1" />
                      </span>
                    </div>
                  </Card>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </Section>

      <CtaBand title="Not sure which country suits you?" text="We compare costs, work rights and entry requirements for your situation." />
    </main>
  );
}
