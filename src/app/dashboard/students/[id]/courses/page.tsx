import type { Metadata } from "next";
import { Suspense } from "react";
import { notFound } from "next/navigation";
import { CourseFinder, readFilters } from "@/components/dashboard/course-finder";
import { PageHeader } from "@/components/dashboard/page-header";
import { Card } from "@/components/ui/card";
import { db } from "@/lib/db";
import { getStudentFacts } from "@/lib/course-finder";
import { requirePermission } from "@/lib/session";

export const metadata: Metadata = { title: "Course finder", robots: { index: false } };

export default function StudentCoursesPage(props: PageProps<"/dashboard/students/[id]/courses">) {
  return (
    <Suspense fallback={<Card tone="solid">Loading…</Card>}>
      <StudentCourses {...props} />
    </Suspense>
  );
}

async function StudentCourses({ params, searchParams }: PageProps<"/dashboard/students/[id]/courses">) {
  await requirePermission("STUDENTS", "view");
  const { id } = await params;
  const [student, facts] = await Promise.all([
    db.studentProfile.findUnique({ where: { id }, select: { id: true, user: { select: { name: true } } } }),
    getStudentFacts(id),
  ]);
  if (!student || !facts) notFound();

  return (
    <>
      <PageHeader
        title={`Courses for ${student.user.name}`}
        description="Checked against the student's education and test scores. Requirements come from each course, else its university, else the usual level default."
        back={{ href: `/dashboard/students/${id}`, label: student.user.name }}
      />
      <CourseFinder
        facts={facts}
        filters={readFilters(await searchParams)}
        publishedOnly={false}
        showHidden
        applyHref={(courseId) => `/dashboard/students/${id}?course=${courseId}#applications`}
        selectAction={`/dashboard/students/${id}/applications/new`}
      />
    </>
  );
}
