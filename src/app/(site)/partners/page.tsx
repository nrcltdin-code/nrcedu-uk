import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { CtaBand } from "@/components/site/cta-band";
import { PageHero } from "@/components/site/page-hero";
import { Card } from "@/components/ui/card";
import { Icon } from "@/components/ui/icon";
import { Section, SectionHeading } from "@/components/ui/section";
import { getPartnerUniversities } from "@/lib/data/content";
import { getPartners } from "@/lib/data/home";

export const metadata: Metadata = {
  title: "Our partner universities",
  description: "The universities NRC Educational Consultants officially represents, and the organisations we work with.",
};

export default async function PartnersPage() {
  const [universities, partners] = await Promise.all([getPartnerUniversities(), getPartners()]);

  return (
    <main>
      <PageHero eyebrow="Partners" title="Universities we" highlight="officially represent">
        As an official representative, we submit your application through a direct channel to the university.
      </PageHero>

      <Section tint="sky">
        {universities.length === 0 ? (
          <Card>Our partner universities will be listed here soon.</Card>
        ) : (
          <ul className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {universities.map((university) => (
              <li key={university.id}>
                <Link href={`/universities/${university.slug}`} className="group block h-full">
                  <Card tone="solid" className="flex h-full items-center gap-4 transition duration-300 group-hover:-translate-y-1 group-hover:shadow-xl group-hover:shadow-brand-600/20">
                    <span className="flex size-14 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-linear-to-br from-brand-600 to-sky-500 font-display text-lg font-extrabold text-white">
                      {university.logoUrl ? (
                        <Image src={university.logoUrl} alt="" width={56} height={56} className="size-full bg-white object-contain" />
                      ) : (
                        university.name.charAt(0)
                      )}
                    </span>
                    <div className="min-w-0 flex-1">
                      <h2 className="font-display font-bold leading-snug">{university.name}</h2>
                      <p className="text-sm text-muted">{[university.city, university.country.name].filter(Boolean).join(", ")}</p>
                    </div>
                    <Icon name="arrowRight" className="size-5 shrink-0 text-brand-600 transition group-hover:translate-x-1" />
                  </Card>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </Section>

      {partners.length > 0 && (
        <Section tint="amber" className="pt-0 sm:pt-4">
          <SectionHeading eyebrow="Also working with" title="Other" highlight="partners" />
          <ul className="flex flex-wrap justify-center gap-4">
            {partners.map((partner) => (
              <li key={partner.id} className="glass flex h-16 items-center rounded-2xl px-6 font-display font-semibold text-brand-800">
                {partner.logoUrl ? (
                  <Image src={partner.logoUrl} alt={partner.name} width={120} height={40} className="h-10 w-auto object-contain" />
                ) : (
                  partner.name
                )}
              </li>
            ))}
          </ul>
        </Section>
      )}

      <CtaBand title="Want to apply to one of these universities?" text="We will check your eligibility and prepare your application." />
    </main>
  );
}
