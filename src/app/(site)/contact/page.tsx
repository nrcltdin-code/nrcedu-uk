import type { Metadata } from "next";
import Link from "next/link";
import { Offices } from "@/components/site/offices";
import { PageHero } from "@/components/site/page-hero";
import { buttonStyles } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { IconTile } from "@/components/ui/icon";
import { Section } from "@/components/ui/section";
import { getSiteSettings, telHref } from "@/lib/settings";
import { ContactForm } from "./contact-form";
import { JsonLd } from "@/components/site/json-ld";
import { breadcrumbLd, organizationId, organizationLd, pageMetadata } from "@/lib/seo";
import { siteUrl } from "@/lib/site-url";

export const metadata: Metadata = pageMetadata({
  title: "Contact us",
  description: "Get in touch with NRC Educational Consultant about studying abroad, applications and student visas.",
  path: "/contact",
});

export default async function ContactPage() {
  const settings = await getSiteSettings();
  const { contact } = settings;
  return (
    <main>
      <JsonLd
        data={[
          organizationLd(settings),
          { "@type": "ContactPage", url: `${siteUrl}/contact`, name: "Contact us", about: { "@id": organizationId } },
          breadcrumbLd([{ name: "Contact us", path: "/contact" }]),
        ]}
      />
      <PageHero eyebrow="Contact" title="Let's talk about" highlight="your plans">
        Ask us anything about studying abroad. We reply to every message.
      </PageHero>

      <Section tint="sky">
        <div className="grid items-start gap-8 lg:grid-cols-[1fr_1.4fr]">
          <div className="grid gap-5">
            <Card className="flex items-center gap-4">
              <IconTile name="phone" color="sky" className="shrink-0" />
              <div>
                <h2 className="font-display font-bold">Call us</h2>
                <a href={telHref(contact.phone)} className="text-brand-700 hover:underline">
                  {contact.phone}
                </a>
              </div>
            </Card>
            <Card className="flex items-center gap-4">
              <IconTile name="mail" color="amber" className="shrink-0" />
              <div>
                <h2 className="font-display font-bold">Email us</h2>
                <a href={`mailto:${contact.email}`} className="break-all text-brand-700 hover:underline">
                  {contact.email}
                </a>
              </div>
            </Card>
            <div className="bg-vivid rounded-3xl p-6 text-white shadow-xl shadow-brand-900/20">
              <h2 className="text-xl font-bold">Prefer to speak to a counsellor?</h2>
              <p className="mt-2 text-white/85">Book a free consultation and get advice on countries, courses and costs.</p>
              <Link href="/consultation" className={buttonStyles({ variant: "accent", className: "mt-5" })}>
                Book a free consultation
              </Link>
            </div>
          </div>

          <Card className="p-6 sm:p-8">
            <h2 className="mb-5 text-2xl font-bold">Send us a message</h2>
            <ContactForm />
          </Card>
        </div>
      </Section>

      <Offices className="pt-0 sm:pt-4" />
    </main>
  );
}
