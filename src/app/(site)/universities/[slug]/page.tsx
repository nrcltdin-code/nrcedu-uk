import type { Metadata } from "next";
import { Suspense } from "react";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { CourseList } from "@/components/site/course-list";
import { CtaBand } from "@/components/site/cta-band";
import { buttonStyles } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Icon } from "@/components/ui/icon";
import { Container, Section } from "@/components/ui/section";
import { getUniversity, getUniversitySlugs } from "@/lib/data/catalogue";
import { formatDate, formatMoney } from "@/lib/format";
import { absoluteUrl, breadcrumbLd, pageMetadata } from "@/lib/seo";
import { JsonLd } from "@/components/site/json-ld";

type Props = PageProps<"/universities/[slug]">;

// Prerenders every published university; ones added later are rendered on first visit.
export async function generateStaticParams() {
  const universities = await getUniversitySlugs();
  return universities.length > 0 ? universities.map(({ slug }) => ({ slug })) : [{ slug: "__none__" }];
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const university = await getUniversity((await params).slug);
  if (!university) return {};
  const location = [university.city, university.country.name].filter(Boolean).join(", ");
  const count = university.courses.length;
  const cheapest = university.courses
    .filter((c) => c.tuitionFee != null)
    .sort((a, b) => a.tuitionFee! - b.tuitionFee!)[0];
  const nextIntake = university.intakes[0];
  const facts = [
    count ? `${count} ${count === 1 ? "course" : "courses"}` : null,
    cheapest ? `tuition from ${formatMoney(cheapest.tuitionFee!, cheapest.currency)}` : null,
    nextIntake ? `next intake ${nextIntake.name}` : null,
  ].filter(Boolean);
  return pageMetadata({
    title: `${university.name}: courses, fees and intakes`,
    description: `Study at ${university.name} in ${location}${facts.length ? `: ${facts.join(", ")}` : ""}. Free advice and application support from NRC Educational Consultants.`,
    path: `/universities/${university.slug}`,
    image: university.coverUrl ?? university.logoUrl,
  });
}

// Params are read inside <Suspense>: with Partial Prefetching, an address that was not built ahead of
// time (a new record, or a page whose cache a content change refreshed) is generated on request, and
// reading params above the boundary makes that render fail.
export default function UniversityPage({ params }: Props) {
  return (
    <Suspense fallback={<main className="min-h-dvh" />}>
      <UniversityContent params={params} />
    </Suspense>
  );
}

async function UniversityContent({ params }: Pick<Props, "params">) {
  const university = await getUniversity((await params).slug);
  if (!university) notFound();

  const location = [university.city, university.country.name].filter(Boolean).join(", ");

  return (
    <main>
      <JsonLd
        data={[
          {
            "@type": "CollegeOrUniversity",
            name: university.name,
            url: absoluteUrl(`/universities/${university.slug}`),
            ...(university.description ? { description: university.description } : {}),
            ...(university.logoUrl ? { logo: university.logoUrl } : {}),
            ...(university.coverUrl ? { image: university.coverUrl } : {}),
            ...(university.website ? { sameAs: [university.website] } : {}),
            address: {
              "@type": "PostalAddress",
              ...(university.city ? { addressLocality: university.city } : {}),
              addressCountry: university.country.name,
            },
          },
          breadcrumbLd([
            { name: "Universities", path: "/universities" },
            { name: university.name, path: `/universities/${university.slug}` },
          ]),
        ]}
      />
      <Container className="pt-6">
        <div className="bg-deep relative isolate overflow-hidden rounded-[2rem] text-white">
          {university.coverUrl && (
            <Image src={university.coverUrl} alt="" fill priority sizes="(min-width: 1152px) 1104px, 100vw" className="-z-10 object-cover saturate-125" />
          )}
          <div className="absolute inset-0 -z-10 bg-linear-to-r from-deep-900/95 via-brand-800/75 to-brand-600/40" />
          <div className="px-6 py-14 sm:px-12 sm:py-20">
            <nav aria-label="Breadcrumb" className="mb-5 text-sm text-white/75">
              <Link href="/universities" className="hover:text-white">
                Universities
              </Link>
              <span aria-hidden="true"> / </span>
              <Link href={`/destinations/${university.country.slug}`} className="hover:text-white">
                {university.country.name}
              </Link>
            </nav>
            {university.isOfficialPartner && (
              <span className="mb-4 inline-block rounded-full bg-linear-to-r from-accent-400 to-orange-500 px-3 py-1 text-xs font-bold text-deep-900">
                Official representative
              </span>
            )}
            <h1 className="max-w-3xl text-4xl font-extrabold tracking-tight sm:text-5xl">{university.name}</h1>
            <p className="mt-4 flex flex-wrap items-center gap-x-6 gap-y-2 text-white/90">
              <span className="flex items-center gap-2">
                <Icon name="pin" className="size-5" />
                {location}
              </span>
              <span className="flex items-center gap-2">
                <Icon name="cap" className="size-5" />
                {university.courses.length} {university.courses.length === 1 ? "course" : "courses"}
              </span>
              {university.ranking && <span>World rank #{university.ranking}</span>}
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <a href="#courses" className={buttonStyles({ variant: "accent", size: "lg" })}>
                Apply now
              </a>
              <Link href="/consultation" className={buttonStyles({ size: "lg", className: "border border-white/30 bg-white/10 bg-none shadow-none hover:bg-white/20" })}>
                Ask a counsellor
              </Link>
            </div>
          </div>
        </div>
      </Container>

      <Section tint="sky">
        <div className="grid items-start gap-8 lg:grid-cols-[1.6fr_1fr]">
          <Card>
            <h2 className="text-2xl font-bold">
              About <span className="text-gradient">{university.name}</span>
            </h2>
            <p className="mt-4 whitespace-pre-line text-ink/85">
              {university.description ?? "More information about this university is coming soon."}
            </p>
            {university.website && (
              <a
                href={university.website}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-5 inline-flex items-center gap-1 text-sm font-semibold text-brand-700 hover:underline"
              >
                Visit the university website <Icon name="arrowRight" className="size-4" />
              </a>
            )}
          </Card>

          <Card>
            <h2 className="text-xl font-bold">Upcoming intakes</h2>
            {university.intakes.length === 0 ? (
              <p className="mt-3 text-sm text-muted">Intake dates will be announced soon. Ask a counsellor for details.</p>
            ) : (
              <ul className="mt-4 space-y-4">
                {university.intakes.map((intake) => (
                  <li key={intake.id} className="flex items-start gap-3">
                    <Icon name="clock" className="mt-0.5 size-5 shrink-0 text-brand-600" />
                    <div>
                      <p className="font-semibold">{intake.name}</p>
                      <p className="text-sm text-muted">
                        Starts {formatDate(intake.startDate)}
                        {intake.applicationDeadline && <> · apply by {formatDate(intake.applicationDeadline)}</>}
                      </p>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </div>

        <div id="courses" className="mt-14 scroll-mt-28">
          <h2 className="mb-6 text-3xl font-extrabold tracking-tight">
            Courses <span className="text-gradient">you can apply for</span>
          </h2>
          {university.courses.length === 0 ? (
            <Card>Courses for this university will be listed soon.</Card>
          ) : (
            <CourseList
              courses={university.courses.map((course) => ({
                ...course,
                href: `/universities/${university.slug}/courses/${course.slug}`,
                detail: course.subject?.name,
              }))}
            />
          )}
        </div>
      </Section>

      <CtaBand title={`Interested in ${university.name}?`} text="A counsellor can check your eligibility and guide your application." />
    </main>
  );
}
