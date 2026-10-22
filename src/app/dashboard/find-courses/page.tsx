import type { Metadata } from "next";
import { Suspense } from "react";
import Link from "next/link";
import { CourseFinder, readFilters } from "@/components/dashboard/course-finder";
import { PageHeader } from "@/components/dashboard/page-header";
import { Card } from "@/components/ui/card";
import { getStudentFacts } from "@/lib/course-finder";
import { requireMyStudentId } from "@/lib/student";

export const metadata: Metadata = { title: "Find courses", robots: { index: false } };

export default function FindCoursesPage({ searchParams }: PageProps<"/dashboard/find-courses">) {
  return (
    <>
      <PageHeader
        title="Find courses"
        description={<>Courses you are likely to get into, based on <Link href="/dashboard/profile" className="text-brand-700 hover:underline">your profile</Link>. Your counsellor makes the final check.</>}
      />
      <Suspense fallback={<Card tone="solid">Loading…</Card>}>
        <Finder searchParams={searchParams} />
      </Suspense>
    </>
  );
}

async function Finder({ searchParams }: Pick<PageProps<"/dashboard/find-courses">, "searchParams">) {
  const studentId = await requireMyStudentId();
  const facts = await getStudentFacts(studentId);
  if (!facts) return null;
  return (
    <CourseFinder
      facts={facts}
      filters={readFilters(await searchParams)}
      publishedOnly
      applyHref={(courseId) => `/dashboard/apply?course=${courseId}`}
    />
  );
}
