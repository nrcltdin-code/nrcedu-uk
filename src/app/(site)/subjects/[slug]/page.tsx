import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { CourseList } from "@/components/site/course-list";
import { CtaBand } from "@/components/site/cta-band";
import { PageHero } from "@/components/site/page-hero";
import { Card } from "@/components/ui/card";
import { Section } from "@/components/ui/section";
import { getSubject, getSubjects } from "@/lib/data/catalogue";

type Props = PageProps<"/subjects/[slug]">;

export async function generateStaticParams() {
  const subjects = await getSubjects();
  return subjects.length > 0 ? subjects.map(({ slug }) => ({ slug })) : [{ slug: "__none__" }];
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const subject = await getSubject((await params).slug);
  if (!subject) return {};
  return {
    title: `${subject.name} courses`,
    description: subject.description ?? `${subject.name} courses at universities abroad. Compare fees and apply through NRC Educational Consultants.`,
  };
}

export default async function SubjectPage({ params }: Props) {
  const subject = await getSubject((await params).slug);
  if (!subject) notFound();

  return (
    <main>
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
