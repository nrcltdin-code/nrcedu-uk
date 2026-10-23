import type { Metadata } from "next";
import { PageHero } from "@/components/site/page-hero";
import { Card } from "@/components/ui/card";
import { IconTile } from "@/components/ui/icon";
import type { IconName, TileColor } from "@/components/ui/icon";
import { Section } from "@/components/ui/section";
import { courseLevelNames } from "@/lib/data/catalogue";
import { getCountryOptions } from "@/lib/data/content";
import { ConsultationForm } from "./consultation-form";
import { pageMetadata } from "@/lib/seo";

export const metadata: Metadata = pageMetadata({
  title: "Free consultation",
  description: "Book a free consultation with an NRC counsellor and find out where you can study abroad.",
  path: "/consultation",
});

const points: { title: string; text: string; icon: IconName; color: TileColor }[] = [
  { title: "It costs nothing", text: "The first consultation is free, with no obligation to continue.", icon: "check", color: "emerald" },
  { title: "Advice for your situation", text: "We look at your grades, budget and goals before suggesting anything.", icon: "chat", color: "sky" },
  { title: "A clear next step", text: "You leave with a shortlist of countries and courses, and a timeline.", icon: "search", color: "violet" },
];

export default async function ConsultationPage() {
  const { all, destinations } = await getCountryOptions();
  const levels = courseLevelNames.map(([value, name]) => ({ value, name }));

  return (
    <main>
      <PageHero eyebrow="Free consultation" title="Start your" highlight="journey">
        Tell us a little about yourself and a counsellor will get in touch.
      </PageHero>

      <Section tint="amber">
        <div className="grid items-start gap-8 lg:grid-cols-[1fr_1.5fr]">
          <ul className="grid gap-5">
            {points.map((point) => (
              <li key={point.title}>
                <Card className="flex items-start gap-4">
                  <IconTile name={point.icon} color={point.color} className="shrink-0" />
                  <div>
                    <h2 className="font-display font-bold">{point.title}</h2>
                    <p className="mt-1 text-sm text-muted">{point.text}</p>
                  </div>
                </Card>
              </li>
            ))}
          </ul>

          <Card className="p-6 sm:p-8">
            <h2 className="mb-5 text-2xl font-bold">Your details</h2>
            <ConsultationForm countries={all} destinations={destinations} levels={levels} />
          </Card>
        </div>
      </Section>
    </main>
  );
}
