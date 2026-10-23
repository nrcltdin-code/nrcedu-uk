import type { Metadata } from "next";
import { Suspense } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { CourseList } from "@/components/site/course-list";
import { CtaBand } from "@/components/site/cta-band";
import { PageHero } from "@/components/site/page-hero";
import { Card } from "@/components/ui/card";
import { Section } from "@/components/ui/section";
import { getSubject, getSubjects } from "@/lib/data/catalogue";
import { absoluteUrl, breadcrumbLd, pageMetadata } from "@/lib/seo";
import { JsonLd } from "@/components/site/json-ld";

type Props = PageProps<"/subjects/[slug]">;

export async function generateStaticParams() {
  const subjects = await getSubjects();
  return subjects.length > 0 ? subjects.map(({ slug }) => ({ slug })) : [{ slug: "__none__" }];
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const subject = await getSubject((await params).slug);
  if (!subject) return {};
  const count = subject.courses.length;
  const universities = new Set(subject.courses.map((c) => c.university.slug)).size;
  const summary = count
    ? `Compare ${count} ${subject.name} ${count === 1 ? "course" : "courses"} at ${universities} ${universities === 1 ? "university" : "universities"} abroad`
    : `${subject.name} courses at universities abroad`;
  return pageMetadata({
    title: `${subject.name} courses abroad`,
    description: subject.description ?? `${summary}: fees, duration and intakes, with free application support from NRC.`,
    path: `/subjects/${subject.slug}`,
  });
}

// Params are read inside <Suspense>: with Partial Prefetching, an address that was not built ahead of
// time (a new record, or a page whose cache a content change refreshed) is generated on request, and
// reading params above the boundary makes that render fail.
export default function SubjectPage({ params }: Props) {
  return (
    <Suspense fallback={<main className="min-h-dvh" />}>
      <SubjectContent params={params} />
    </Suspense>
  );
}

async function SubjectContent({ params }: Pick<Props, "params">) {
  const subject = await getSubject((await params).slug);
  if (!subject) notFound();

  return (
    <main>
      <JsonLd
        data={[
          {
            "@type": "ItemList",
            name: `${subject.name} courses`,
            itemListElement: subject.courses.map((course, index) => ({
              "@type": "ListItem",
              position: index + 1,
              url: absoluteUrl(`/universities/${course.university.slug}/courses/${course.slug}`),
            })),
          },
          breadcrumbLd([
            { name: "Subjects", path: "/subjects" },
            { name: subject.name, path: `/subjects/${subject.slug}` },
          ]),
        ]}
      />
      <PageHero eyebrow="Subject" title={subject.name} highlight="courses">
        {subject.description ?? `${subject.courses.length} ${subject.courses.length === 1 ? "course" : "courses"} across our universities.`}
      </PageHero>

      <Section tint="sky">
        <nav aria-label="Breadcrumb" className="mb-8 text-sm text-muted">
          <Link href="/subjects" className="hover:text-brand-700">
            Subjects
          </Link>
          <span aria-hidden="true"> / </span>
          <span className="text-ink">{subject.name}</span>
        </nav>

        {subject.courses.length === 0 ? (
          <Card>No courses are listed for this subject yet. Ask a counsellor for options.</Card>
        ) : (
          <CourseList
            courses={subject.courses.map((course) => ({
              ...course,
              href: `/universities/${course.university.slug}/courses/${course.slug}`,
              detail: `${course.university.name}, ${course.university.country.name}`,
            }))}
          />
        )}
      </Section>

      <CtaBand title={`Want to study ${subject.name}?`} text="We shortlist the courses that match your grades and budget." />
    </main>
  );
}
