import type { Metadata } from "next";
import Link from "next/link";
import { CtaBand } from "@/components/site/cta-band";
import { PageHero } from "@/components/site/page-hero";
import { Card } from "@/components/ui/card";
import { Icon, IconTile } from "@/components/ui/icon";
import type { TileColor } from "@/components/ui/icon";
import { Section } from "@/components/ui/section";
import { getSubjects } from "@/lib/data/catalogue";
import { pageMetadata } from "@/lib/seo";

export const metadata: Metadata = pageMetadata({
  title: "Subjects",
  description: "Browse courses by subject area across the universities NRC Educational Consultant works with.",
  path: "/subjects",
});

const colors: TileColor[] = ["sky", "amber", "violet", "emerald"];

export default async function SubjectsPage() {
  const subjects = await getSubjects();

  return (
    <main>
      <PageHero eyebrow="Subjects" title="What do you want to" highlight="study?">
        Pick a subject area to see the courses available at each university.
      </PageHero>

      <Section tint="violet">
        {subjects.length === 0 ? (
          <Card>Subjects will be listed here soon.</Card>
        ) : (
          <ul className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {subjects.map((subject, index) => (
              <li key={subject.id}>
                <Link href={`/subjects/${subject.slug}`} className="group block h-full">
                  <Card className="flex h-full items-center gap-4 transition duration-300 group-hover:-translate-y-1.5 group-hover:shadow-2xl group-hover:shadow-brand-600/25">
                    <IconTile name="cap" color={colors[index % colors.length]} className="shrink-0" />
                    <div className="min-w-0 flex-1">
                      <h2 className="font-display text-lg font-bold">{subject.name}</h2>
                      <p className="text-sm text-muted">
                        {subject._count.courses} {subject._count.courses === 1 ? "course" : "courses"}
                      </p>
                    </div>
                    <Icon name="arrowRight" className="size-5 shrink-0 text-brand-600 transition group-hover:translate-x-1" />
                  </Card>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </Section>

      <CtaBand title="Can't decide on a subject?" text="Tell us what you enjoy and where you want your career to go." />
    </main>
  );
}
