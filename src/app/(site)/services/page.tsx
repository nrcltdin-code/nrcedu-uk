import type { Metadata } from "next";
import Link from "next/link";
import { CtaBand } from "@/components/site/cta-band";
import { PageHero } from "@/components/site/page-hero";
import { Card } from "@/components/ui/card";
import { Icon, IconTile } from "@/components/ui/icon";
import type { IconName, TileColor } from "@/components/ui/icon";
import { Section, SectionHeading } from "@/components/ui/section";
import { getTestPrepPages } from "@/lib/data/home";
import { pageMetadata } from "@/lib/seo";

export const metadata: Metadata = pageMetadata({
  title: "Services",
  description: "Consultation, university selection, application support, visa guidance, test preparation and pre-departure help for studying abroad.",
  path: "/services",
});

// Placeholder wording until the client supplies their own text.
const services: { title: string; text: string; points: string[]; icon: IconName; color: TileColor }[] = [
  {
    title: "Expert consultation",
    text: "A one-to-one session to understand your goals and show you realistic options.",
    points: ["Country and cost comparison", "Eligibility check against your grades", "A clear plan and timeline"],
    icon: "chat",
    color: "sky",
  },
  {
    title: "University and course selection",
    text: "A shortlist built around your profile, not a generic list.",
    points: ["Courses matched to your background", "Entry requirements explained", "Scholarship opportunities"],
    icon: "search",
    color: "violet",
  },
  {
    title: "Application support",
    text: "We prepare and check everything before it reaches the university.",
    points: ["Statement of purpose review", "Recommendation letters and transcripts", "Online tracking of every application"],
    icon: "document",
    color: "amber",
  },
  {
    title: "Visa guidance",
    text: "Help with the part of the process students worry about most.",
    points: ["Visa file preparation", "Financial document checks", "Practice interviews"],
    icon: "shield",
    color: "emerald",
  },
  {
    title: "Test preparation",
    text: "Guidance on the English and admissions tests your course requires.",
    points: ["Which test to take and when", "Score targets for your universities", "Study resources and booking help"],
    icon: "pencil",
    color: "sky",
  },
  {
    title: "Pre-departure help",
    text: "So that you arrive prepared and confident.",
    points: ["Accommodation advice", "Flights and what to pack", "What to expect in your first weeks"],
    icon: "send",
    color: "violet",
  },
];

export default function ServicesPage() {
  return (
    <main>
      <PageHero eyebrow="Services" title="Everything you need to" highlight="study abroad">
        One team supports you from your first question to your first day on campus.
      </PageHero>

      <Section tint="violet">
        <ul className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {services.map((service) => (
            <li key={service.title}>
              <Card className="h-full transition duration-300 hover:-translate-y-1.5 hover:shadow-2xl hover:shadow-brand-600/25">
                <IconTile name={service.icon} color={service.color} />
                <h2 className="mt-5 text-xl font-bold">{service.title}</h2>
                <p className="mt-2 text-muted">{service.text}</p>
                <ul className="mt-4 space-y-2 text-sm">
                  {service.points.map((point) => (
                    <li key={point} className="flex items-start gap-2">
                      <Icon name="check" className="mt-0.5 size-4 shrink-0 text-emerald-600" />
                      {point}
                    </li>
                  ))}
                </ul>
              </Card>
            </li>
          ))}
        </ul>
      </Section>

      <TestPrep />

      <CtaBand title="Not sure where to begin?" text="A free consultation is the best first step." />
    </main>
  );
}

async function TestPrep() {
  const tests = await getTestPrepPages();
  if (tests.length === 0) return null;

  return (
    <Section tint="sky" className="pt-0 sm:pt-4">
      <SectionHeading eyebrow="Test preparation" title="Tests we help you" highlight="prepare for" />
      <ul className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {tests.map((test) => (
          <li key={test.id}>
            <Link href={`/test-prep/${test.slug}`} className="group block h-full">
              <Card className="flex h-full items-start justify-between gap-4 transition duration-300 group-hover:-translate-y-1 group-hover:bg-white/75">
                <div>
                  <h3 className="text-gradient font-display text-2xl font-extrabold">{test.name}</h3>
                  {test.summary && <p className="mt-1 text-sm text-muted">{test.summary}</p>}
                </div>
                <Icon name="arrowRight" className="mt-1 size-5 shrink-0 text-brand-600 transition group-hover:translate-x-1" />
              </Card>
            </Link>
          </li>
        ))}
      </ul>
    </Section>
  );
}
