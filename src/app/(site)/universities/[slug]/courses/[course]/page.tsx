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
import { absoluteUrl, breadcrumbLd, pageMetadata } from "@/lib/seo";
import { JsonLd } from "@/components/site/json-ld";

type Props = PageProps<"/universities/[slug]/courses/[course]">;
type CourseData = NonNullable<Awaited<ReturnType<typeof getCourse>>>;

const where = (c: CourseData) => [c.university.city, c.university.country.name].filter(Boolean).join(", ");

// When staff have not written a description yet, a short summary built from the course's own
// facts, so every page has unique, useful text for students and search engines.
function summary(c: CourseData) {
  const level = levelNames[c.level].toLowerCase();
  const parts = [
    `${c.name} is ${/^[aeiou]/i.test(level) ? "an" : "a"} ${level} course at ${c.university.name} in ${where(c)}${c.subject ? `, in the ${c.subject.name} subject area` : ""}.`,
  ];
  const facts = [
    c.durationMonths && `lasts ${formatDuration(c.durationMonths)}`,
    c.tuitionFee != null && `costs about ${formatMoney(c.tuitionFee, c.currency)} a year for international students`,
  ].filter(Boolean);
  if (facts.length) parts.push(`The course ${facts.join(" and ")}.`);
  if (c.intakes.length) parts.push(`Upcoming intakes: ${c.intakes.slice(0, 3).map((i) => i.name).join(", ")}.`);
  parts.push(`NRC Educational Consultant helps international students apply to ${c.university.name} for free, from choosing the course and checking eligibility to the offer, CAS and student visa.`);
  return parts.join(" ");
}

function entryList(c: CourseData) {
  const e = c.entry;
  return [
    e.minGradePercent != null && `Previous qualification with at least ${e.minGradePercent}% overall (or equivalent)`,
    e.minIelts != null && `IELTS ${e.minIelts} overall${e.minIeltsBand != null ? ` with no band below ${e.minIeltsBand}` : ""}, or an equivalent English test`,
    e.acceptsMoi === true && "Medium of Instruction (MOI) letter may be accepted instead of IELTS",
    e.maxStudyGapYears != null && `Study gap of up to ${e.maxStudyGapYears} years accepted`,
  ].filter((x): x is string => Boolean(x));
}

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
  const facts = [
    course.durationMonths ? formatDuration(course.durationMonths) : null,
    course.tuitionFee != null ? `tuition ${formatMoney(course.tuitionFee, course.currency)}` : null,
    course.intakes[0] ? `next intake ${course.intakes[0].name}` : null,
  ].filter(Boolean);
  return pageMetadata({
    title: `${course.name} at ${course.university.name}`,
    description: `${levelNames[course.level]} ${course.name} at ${course.university.name}, ${course.university.country.name}${facts.length ? `: ${facts.join(", ")}` : ""}. Entry requirements and free application support from NRC.`,
    path: `/universities/${course.university.slug}/courses/${course.slug}`,
    image: course.university.coverUrl,
  });
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
      <JsonLd
        data={[
          {
            "@type": "Course",
            name: course.name,
            description: course.description || summary(course),
            url: absoluteUrl(`/universities/${course.university.slug}/courses/${course.slug}`),
            provider: {
              "@type": "CollegeOrUniversity",
              name: course.university.name,
              url: absoluteUrl(`/universities/${course.university.slug}`),
            },
            ...(course.subject ? { about: course.subject.name } : {}),
            educationalLevel: levelNames[course.level],
            ...(course.durationMonths ? { timeRequired: `P${course.durationMonths}M` } : {}),
            ...(course.tuitionFee != null
              ? { offers: { "@type": "Offer", category: "Tuition", price: course.tuitionFee, priceCurrency: course.currency} }
              : {}),
            ...(course.intakes.length
              ? {
                  hasCourseInstance: course.intakes.map((intake) => ({
                    "@type": "CourseInstance",
                    name: intake.name,
                    courseMode: "Onsite",
                    startDate: intake.startDate.toISOString().slice(0, 10),
                    location: [course.university.city, course.university.country.name].filter(Boolean).join(", "),
                  })),
                }
              : {}),
          },
          breadcrumbLd([
            { name: "Universities", path: "/universities" },
            { name: course.university.name, path: `/universities/${course.university.slug}` },
            { name: course.name, path: `/universities/${course.university.slug}/courses/${course.slug}` },
          ]),
        ]}
      />
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
              <p className="mt-4 whitespace-pre-line text-ink/85">{course.description || summary(course)}</p>
            </Card>
            <Card>
              <h2 className="text-2xl font-bold">Entry requirements</h2>
              {course.entryRequirements && <p className="mt-4 whitespace-pre-line text-ink/85">{course.entryRequirements}</p>}
              {entryList(course).length > 0 && (
                <ul className="mt-4 grid gap-2 text-ink/85">
                  {entryList(course).map((line) => (
                    <li key={line} className="flex gap-2"><Icon name="check" className="mt-0.5 size-5 shrink-0 text-emerald-600" />{line}</li>
                  ))}
                </ul>
              )}
              {course.entry.documents.length > 0 && (
                <>
                  <h3 className="mt-6 font-bold">Documents you will need</h3>
                  <p className="mt-2 text-ink/85">{course.entry.documents.join(", ")}.</p>
                </>
              )}
              <p className="mt-4 text-sm text-muted">Requirements can depend on your country and qualifications. A counsellor will check your eligibility for free.</p>
            </Card>
            {(course.moreHere.length > 0 || course.elsewhere.length > 0) && (
              <Card>
                {course.moreHere.length > 0 && (
                  <>
                    <h2 className="text-2xl font-bold">More courses at {university.name}</h2>
                    <ul className="mt-4 grid gap-2 sm:grid-cols-2">
                      {course.moreHere.map((c) => (
                        <li key={c.id}>
                          <Link href={`/universities/${c.university.slug}/courses/${c.slug}`} className="font-medium text-brand-700 hover:underline">{c.name}</Link>
                          <span className="text-sm text-muted"> · {levelNames[c.level]}</span>
                        </li>
                      ))}
                    </ul>
                    <Link href={`/universities/${university.slug}`} className="mt-3 inline-block text-sm font-semibold text-brand-700 hover:underline">All courses at {university.name} →</Link>
                  </>
                )}
                {course.elsewhere.length > 0 && course.subject && (
                  <>
                    <h2 className={`text-2xl font-bold ${course.moreHere.length ? "mt-8" : ""}`}>{course.subject.name} at other universities</h2>
                    <ul className="mt-4 grid gap-2 sm:grid-cols-2">
                      {course.elsewhere.map((c) => (
                        <li key={c.id}>
                          <Link href={`/universities/${c.university.slug}/courses/${c.slug}`} className="font-medium text-brand-700 hover:underline">{c.name}</Link>
                          <span className="text-sm text-muted"> · {c.university.name}</span>
                        </li>
                      ))}
                    </ul>
                    <Link href={`/subjects/${course.subject.slug}`} className="mt-3 inline-block text-sm font-semibold text-brand-700 hover:underline">All {course.subject.name} courses →</Link>
                  </>
                )}
              </Card>
            )}
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
