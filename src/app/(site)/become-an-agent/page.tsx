import type { Metadata } from "next";
import { PageHero } from "@/components/site/page-hero";
import { Card } from "@/components/ui/card";
import { IconTile } from "@/components/ui/icon";
import type { IconName, TileColor } from "@/components/ui/icon";
import { Section, SectionHeading } from "@/components/ui/section";
import { getCountryOptions } from "@/lib/data/content";
import { AgentForm } from "./agent-form";
import { pageMetadata } from "@/lib/seo";

export const metadata: Metadata = pageMetadata({
  title: "Become an agent",
  description: "Partner with NRC Educational Consultants as a student recruitment agent and place your students at universities abroad.",
  path: "/become-an-agent",
});

// Placeholder wording until the client supplies their own text.
const benefits: { title: string; text: string; icon: IconName; color: TileColor }[] = [
  { title: "Access to our universities", text: "Submit your students to the universities we represent, through one channel.", icon: "building", color: "sky" },
  { title: "Commission on enrolments", text: "Earn commission for each of your students who enrols. Rates depend on the university.", icon: "check", color: "amber" },
  { title: "Your own online portal", text: "Add students, upload documents and follow every application in one place.", icon: "document", color: "violet" },
  { title: "A team behind you", text: "Our counsellors check applications and handle communication with universities.", icon: "users", color: "emerald" },
];

const steps = ["Send your application with the form below.", "We review it and contact you.", "Once approved, sign in and start adding students."];

export default async function BecomeAnAgentPage() {
  const { all } = await getCountryOptions();

  return (
    <main>
      <PageHero eyebrow="Partner with us" title="Become an" highlight="NRC agent">
        Recruit students in your country and place them at universities abroad with our support.
      </PageHero>

      <Section tint="sky">
        <SectionHeading eyebrow="Why partner with NRC" title="What you" highlight="get" />
        <ul className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {benefits.map((benefit) => (
            <li key={benefit.title}>
              <Card className="h-full">
                <IconTile name={benefit.icon} color={benefit.color} />
                <h3 className="mt-5 text-lg font-bold">{benefit.title}</h3>
                <p className="mt-2 text-sm text-muted">{benefit.text}</p>
              </Card>
            </li>
          ))}
        </ul>
      </Section>

      <Section tint="amber" className="pt-0 sm:pt-4">
        <div className="grid items-start gap-8 lg:grid-cols-[1fr_1.6fr]">
          <Card>
            <h2 className="text-xl font-bold">How it works</h2>
            <ol className="mt-5 space-y-4">
              {steps.map((step, index) => (
                <li key={step} className="flex items-start gap-3">
                  <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-linear-to-br from-brand-600 to-sky-500 font-display text-sm font-bold text-white">
                    {index + 1}
                  </span>
                  <span className="pt-1 text-ink/90">{step}</span>
                </li>
              ))}
            </ol>
          </Card>

          <Card className="p-6 sm:p-8">
            <h2 className="mb-5 text-2xl font-bold">Agent application</h2>
            <AgentForm countries={all} />
          </Card>
        </div>
      </Section>
    </main>
  );
}
