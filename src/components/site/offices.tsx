import Image from "next/image";
import { Card } from "@/components/ui/card";
import { Icon } from "@/components/ui/icon";
import { Section, SectionHeading } from "@/components/ui/section";
import { getOffices } from "@/lib/data/home";
import { telHref } from "@/lib/settings";
import { JsonLd } from "@/components/site/json-ld";
import { officeLd } from "@/lib/seo";

// "Our offices" block, used on the home and contact pages. Hides itself when there are none.
export async function Offices({ className }: { className?: string }) {
  const offices = await getOffices();
  if (offices.length === 0) return null;

  return (
    <Section tint="sky" className={className}>
      <JsonLd data={offices.map(officeLd)} />
      <SectionHeading eyebrow="Our offices" title="Visit us" highlight="in person">
        Meet a counsellor face to face at the office nearest to you.
      </SectionHeading>
      <ul className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {offices.map((office) => (
          <li key={office.id}>
            <Card className="flex h-full flex-col overflow-hidden p-0 transition duration-300 hover:-translate-y-1.5 hover:shadow-2xl hover:shadow-brand-600/25">
              <div className="bg-deep relative h-40">
                {office.imageUrl && (
                  <Image src={office.imageUrl} alt="" fill sizes="(min-width: 1024px) 352px, (min-width: 768px) 50vw, 100vw" className="object-cover" />
                )}
                <div className="absolute inset-0 bg-linear-to-t from-brand-700/90 via-brand-600/30 to-transparent" />
                {office.isHeadOffice && (
                  <span className="absolute left-4 top-4 rounded-full bg-linear-to-r from-accent-400 to-orange-500 px-3 py-1 text-xs font-bold text-deep-900 shadow-lg">
                    Head office
                  </span>
                )}
                <p className="absolute bottom-3 left-4 text-sm font-medium text-white">
                  {office.city}, {office.country}
                </p>
              </div>

              <div className="flex flex-1 flex-col p-6">
                <h3 className="text-lg font-bold">{office.name}</h3>
                <ul className="mt-4 space-y-3 text-sm">
                  <li className="flex items-start gap-3">
                    <Icon name="pin" className="mt-0.5 size-5 shrink-0 text-brand-600" />
                    <address className="not-italic text-ink/90">{office.address}</address>
                  </li>
                  {office.phone && (
                    <li className="flex items-center gap-3">
                      <Icon name="phone" className="size-5 shrink-0 text-brand-600" />
                      <a href={telHref(office.phone)} className="hover:text-brand-700 hover:underline">
                        {office.phone}
                      </a>
                    </li>
                  )}
                  {office.email && (
                    <li className="flex items-center gap-3">
                      <Icon name="mail" className="size-5 shrink-0 text-brand-600" />
                      <a href={`mailto:${office.email}`} className="break-all hover:text-brand-700 hover:underline">
                        {office.email}
                      </a>
                    </li>
                  )}
                  {office.openingHours && (
                    <li className="flex items-center gap-3">
                      <Icon name="clock" className="size-5 shrink-0 text-brand-600" />
                      <span className="text-muted">{office.openingHours}</span>
                    </li>
                  )}
                </ul>
                {office.mapUrl && (
                  <a
                    href={office.mapUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-auto inline-flex items-center gap-1 pt-5 text-sm font-semibold text-brand-700 hover:underline"
                  >
                    Get directions <Icon name="arrowRight" className="size-4" />
                  </a>
                )}
              </div>
            </Card>
          </li>
        ))}
      </ul>
    </Section>
  );
}
