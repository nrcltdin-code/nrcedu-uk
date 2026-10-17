import type { Metadata } from "next";
import { Suspense } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ApplyButton } from "@/components/site/apply-button";
import { CtaBand } from "@/components/site/cta-band";
import { PageHero } from "@/components/site/page-hero";
import { buttonStyles } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Icon, IconTile } from "@/components/ui/icon";
import type { IconName, TileColor } from "@/components/ui/icon";
import { Section } from "@/components/ui/section";
import { getCourse, getUniversitySlugs, levelNames } from "@/lib/data/catalogue";
import { formatDate, formatDuration, formatMoney } from "@/lib/format";

type Props = PageProps<"/universities/[slug]/courses/[course]">;

export async function generateStaticParams() {
  const universities = await getUniversitySlugs();
  const params = universities.flatMap((university) =>
    university.courses.map((course) => ({ slug: university.slug, course: course.slug })),
  );
  return params.length > 0 ? params : [{ slug: "__none__", course: "__none__" }];
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug, course: courseSlug } = await params;
  const course = await getCourse(slug, courseSlug);
  if (!course) return {};
  return {
    title: `${course.name} at ${course.university.name}`,
    description: `Fees, duration, entry requirements and intakes for ${course.name} at ${course.university.name}. Apply through NRC Educational Consultants.`,
  };
}

// Params are read inside <Suspense>: with Partial Prefetching, an address that was not built ahead of
// time (a new record, or a page whose cache a content change refreshed) is generated on request, and
// reading params above the boundary makes that render fail.
export default function CoursePage({ params }: Props) {
  return (
    <Suspense fallback={<main className="min-h-dvh" />}>
      <CourseContent params={params} />
    </Suspense>
  );
}

async function CourseContent({ params }: Pick<Props, "params">) {
  const { slug, course: courseSlug } = await params;
  const course = await getCourse(slug, courseSlug);
  if (!course) notFound();

  const { university } = course;
  const facts: { label: string; value: string; icon: IconName; color: TileColor }[] = [
    { label: "Level", value: levelNames[course.level], icon: "cap", color: "sky" },
    ...(course.durationMonths ? [{ label: "Duration", value: formatDuration(course.durationMonths), icon: "clock" as const, color: "violet" as const }] : []),
    ...(course.tuitionFee !== null
      ? [{ label: "Tuition per year", value: formatMoney(course.tuitionFee, course.currency), icon: "document" as const, color: "amber" as const }]
      : []),
    { label: "Location", value: [university.city, university.country.name].filter(Boolean).join(", "), icon: "pin", color: "emerald" },
  ];

  return (
    <main>
      <PageHero eyebrow={university.name} title={course.name}>
        {levelNames[course.level]} course in {[university.city, university.country.name].filter(Boolean).join(", ")}
        {course.subject && <> · {course.subject.name}</>}
      </PageHero>

      <Section tint="violet">
        <nav aria-label="Breadcrumb" className="mb-8 text-sm text-muted">
          <Link href="/universities" className="hover:text-brand-700">
            Universities
          </Link>
          <span aria-hidden="true"> / </span>
          <Link href={`/universities/${university.slug}`} className="hover:text-brand-700">
            {university.name}
          </Link>
          <span aria-hidden="true"> / </span>
          <span className="text-ink">{course.name}</span>
        </nav>

        <dl className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {facts.map((fact) => (
            <Card key={fact.label} className="flex items-center gap-4">
              <IconTile name={fact.icon} color={fact.color} className="shrink-0" />
              <div className="flex flex-col">
                <dt className="order-2 text-sm text-muted">{fact.label}</dt>
                <dd className="font-display text-lg font-bold">{fact.value}</dd>
              </div>
            </Card>
          ))}
        </dl>

        <div className="mt-8 grid items-start gap-8 lg:grid-cols-[1.6fr_1fr]">
          <div className="grid gap-8">
            <Card>
              <h2 className="text-2xl font-bold">About this course</h2>
              <p className="mt-4 whitespace-pre-line text-ink/85">
                {course.description ?? "A full description of this course is coming soon. Ask a counsellor for the details."}
              </p>
            </Card>
            <Card>
              <h2 className="text-2xl font-bold">Entry requirements</h2>
              <p className="mt-4 whitespace-pre-line text-ink/85">
                {course.entryRequirements ??
                  "Requirements depend on your qualifications and country. A counsellor will check your eligibility for free."}
              </p>
            </Card>
          </div>

          <div id="apply" className="bg-vivid scroll-mt-28 rounded-3xl p-6 text-white shadow-xl shadow-brand-900/20 sm:p-8">
            <h2 className="text-2xl font-bold">Apply for this course</h2>
            {course.intakes.length > 0 ? (
              <ul className="mt-5 space-y-4">
                {course.intakes.map((intake) => (
                  <li key={intake.id} className="flex items-start gap-3">
                    <Icon name="clock" className="mt-0.5 size-5 shrink-0 text-accent-400" />
                    <div>
                      <p className="font-semibold">{intake.name}</p>
                      <p className="text-sm text-white/80">
                        Starts {formatDate(intake.startDate)}
                        {intake.applicationDeadline && <> · apply by {formatDate(intake.applicationDeadline)}</>}
                      </p>
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-3 text-white/85">Intake dates will be announced soon.</p>
            )}
            <div className="mt-7 flex flex-wrap gap-3">
              <ApplyButton courseId={course.id} size="lg" label="Apply now" />
              <Link href="/consultation" className={buttonStyles({ size: "lg", className: "border border-white/30 bg-white/10 bg-none shadow-none hover:bg-white/20" })}>
                Ask first
              </Link>
            </div>
          </div>
        </div>
      </Section>

      <CtaBand title="Not sure this course is right for you?" text="We compare similar courses and tell you where your chances are best." />
    </main>
  );
}
