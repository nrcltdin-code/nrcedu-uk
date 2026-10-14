import type { Metadata } from "next";
import { CtaBand } from "@/components/site/cta-band";
import { PageHero } from "@/components/site/page-hero";
import { Card } from "@/components/ui/card";
import { IconTile } from "@/components/ui/icon";
import type { IconName, TileColor } from "@/components/ui/icon";
import { Section, SectionHeading } from "@/components/ui/section";

export const metadata: Metadata = {
  title: "About us",
  description: "NRC Educational Consultants helps students choose the right university abroad and supports them from application to arrival.",
};

// Placeholder wording until the client supplies their own text.
const values: { title: string; text: string; icon: IconName; color: TileColor }[] = [
  { title: "Honest advice", text: "We recommend the universities that suit your grades, budget and goals, and we tell you plainly when an option is not right for you.", icon: "chat", color: "sky" },
  { title: "Careful applications", text: "Every document is checked before it is submitted, because small mistakes cause long delays.", icon: "document", color: "amber" },
  { title: "Support to the end", text: "We stay with you through offers, deposits, visas and travel, not only until you apply.", icon: "shield", color: "emerald" },
  { title: "Students first", text: "Our counsellors are measured by how well students do, so your success is our success.", icon: "users", color: "violet" },
];

const stats = [
  { value: "200+", label: "Partner universities" },
  { value: "30+", label: "Countries" },
  { value: "4+", label: "Years of experience" },
];

const reasons = [
  "Official representative for a number of universities, so your application goes through a direct channel.",
  "One counsellor follows your case from the first conversation to your arrival.",
  "Track every application and upload documents online, whenever it suits you.",
  "Local partners in several countries who understand your education system.",
];

export default function AboutPage() {
  return (
    <main>
      <PageHero eyebrow="About us" title="Helping students reach" highlight="universities worldwide">
        NRC Educational Consultants is a study-abroad and student visa consultancy based in the United Kingdom.
      </PageHero>

      <Section tint="sky">
        <div className="grid items-center gap-10 lg:grid-cols-2">
          <div>
            <h2 className="text-3xl font-extrabold tracking-tight sm:text-4xl">
              Our <span className="text-gradient">mission</span>
            </h2>
            <p className="mt-5 text-lg text-ink/85">
              Choosing a university in another country is one of the biggest decisions a student makes. Our job is to
              make that decision clear, and the process that follows simple.
            </p>
            <p className="mt-4 text-muted">
              We work with universities in the United Kingdom, the United States, Canada, Australia and Germany. For
              each student we compare courses, costs and entry requirements, prepare a strong application, and guide
              them through the visa process and their move abroad.
            </p>
          </div>
          <dl className="grid gap-5 sm:grid-cols-3 lg:grid-cols-1">
            {stats.map((stat) => (
              <Card key={stat.label} className="flex flex-col items-center text-center lg:flex-row lg:gap-6 lg:text-left">
                <dt className="order-2 text-muted">{stat.label}</dt>
                <dd className="text-gradient font-display text-5xl font-extrabold">{stat.value}</dd>
              </Card>
            ))}
          </dl>
        </div>
      </Section>

      <Section tone="vivid">
        <SectionHeading onDark eyebrow="Our values" title="How we" highlight="work" />
        <ul className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {values.map((value) => (
            <li key={value.title}>
              <Card tone="dark" className="h-full">
                <IconTile name={value.icon} color={value.color} />
                <h3 className="mt-5 text-lg font-bold">{value.title}</h3>
                <p className="mt-2 text-sm text-white/80">{value.text}</p>
              </Card>
            </li>
          ))}
        </ul>
      </Section>

      <Section tint="amber">
        <SectionHeading eyebrow="Why NRC" title="Why students" highlight="choose us" />
        <ul className="mx-auto grid max-w-4xl gap-4 sm:grid-cols-2">
          {reasons.map((reason) => (
            <li key={reason}>
              <Card className="flex h-full items-start gap-4">
                <IconTile name="check" color="emerald" className="size-10 shrink-0 rounded-xl" />
                <p className="text-ink/90">{reason}</p>
              </Card>
            </li>
          ))}
        </ul>
      </Section>

      <CtaBand title="Ready to start?" text="Tell us your goals and we will show you where you can study." />
    </main>
  );
}
