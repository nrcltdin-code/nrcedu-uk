import type { Metadata } from "next";
import { Suspense } from "react";
import Link from "next/link";
import { PageHeader } from "@/components/dashboard/page-header";
import { buttonStyles } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { db } from "@/lib/db";
import { formatDate } from "@/lib/format";
import { requireUser } from "@/lib/session";
import { ApplyForm } from "./apply-form";

export const metadata: Metadata = { title: "Apply", robots: { index: false } };

// Where every "Apply" button on the website leads (?course=…).
export default function ApplyPage({ searchParams }: PageProps<"/dashboard/apply">) {
  return (
    <>
      <PageHeader title="Apply" />
      <Suspense fallback={<Card tone="solid">Loading…</Card>}>
        <Apply searchParams={searchParams} />
      </Suspense>
    </>
  );
}

async function Apply({ searchParams }: Pick<PageProps<"/dashboard/apply">, "searchParams">) {
  const user = await requireUser();
  const { course: courseParam } = await searchParams;
  const courseId = typeof courseParam === "string" ? courseParam : "";

  if (user.role !== "STUDENT") {
    return (
      <Card tone="solid">
        <p>Applications here are for student accounts. Staff start applications from a student&apos;s page{user.role === "AGENT" ? ", and agents from their students list once the agent portal opens" : ""}.</p>
      </Card>
    );
  }

  const course = courseId
    ? await db.course.findFirst({
        where: { id: courseId, isPublished: true, university: { isPublished: true } },
        select: {
          id: true,
          name: true,
          universityId: true,
          university: { select: { name: true, slug: true, country: { select: { name: true } } } },
        },
      })
    : null;

  if (!course) {
    return (
      <Card tone="solid">
        <p>Choose a course on the website first, then press Apply on its page.</p>
        <Link href="/universities" className={buttonStyles({ className: "mt-4" })}>Browse universities</Link>
      </Card>
    );
  }

  const profile = await db.studentProfile.findUnique({ where: { userId: user.id }, select: { canStartApplications: true } });
  if (profile && !profile.canStartApplications) {
    return (
      <Card tone="solid" className="max-w-2xl">
        <h2 className="text-2xl font-bold">{course.name}</h2>
        <p className="mt-3 text-muted">
          New applications are paused on your account while your counsellor works on the ones you have. To add {course.university.name}, send your counsellor a message and they will add it for you.
        </p>
        <Link href="/dashboard/my-applications" className={buttonStyles({ className: "mt-4" })}>My applications</Link>
      </Card>
    );
  }

  const intakes = await db.intake.findMany({
    where: { isOpen: true, universityId: course.universityId, OR: [{ courseId: null }, { courseId: course.id }] },
    orderBy: { startDate: "asc" },
    select: { id: true, name: true, applicationDeadline: true },
  });

  return (
    <Card tone="solid" className="max-w-2xl">
      <p className="text-sm font-semibold uppercase tracking-wider text-brand-700">{course.university.name} · {course.university.country.name}</p>
      <h2 className="mt-1 text-2xl font-bold">{course.name}</h2>
      <p className="mt-3 text-muted">
        Starting an application tells your counsellor you want this course. They check your documents and submit it to the university for you. It is free.
      </p>
      <div className="mt-6">
        <ApplyForm
          courseId={course.id}
          intakes={intakes.map((i) => ({ id: i.id, label: i.applicationDeadline ? `${i.name} (apply by ${formatDate(i.applicationDeadline)})` : i.name }))}
        />
      </div>
    </Card>
  );
}
