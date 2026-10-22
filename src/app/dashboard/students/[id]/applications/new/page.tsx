import type { Metadata } from "next";
import { Suspense } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { HowToApply } from "@/components/dashboard/how-to-apply";
import { PageHeader } from "@/components/dashboard/page-header";
import { Badge } from "@/components/ui/badge";
import { buttonStyles } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Label, Select } from "@/components/ui/field";
import { db } from "@/lib/db";
import { levelNames } from "@/lib/data/catalogue";
import { findCourses, getStudentFacts } from "@/lib/course-finder";
import { formatDate } from "@/lib/format";
import { requirePermission } from "@/lib/session";
import { BulkApplyForm } from "./bulk-form";

export const metadata: Metadata = { title: "Apply to selected courses", robots: { index: false } };

const statusBadge = {
  ELIGIBLE: { text: "Eligible", tone: "success" },
  CONDITIONAL: { text: "Conditional", tone: "accent" },
  NOT_ELIGIBLE: { text: "Not eligible", tone: "danger" },
} as const;

export default function ApplySelectedPage(props: PageProps<"/dashboard/students/[id]/applications/new">) {
  return (
    <Suspense fallback={<Card tone="solid">Loading…</Card>}>
      <ApplySelected {...props} />
    </Suspense>
  );
}

async function ApplySelected({ params, searchParams }: PageProps<"/dashboard/students/[id]/applications/new">) {
  await requirePermission("APPLICATIONS", "edit");
  const { id } = await params;
  const { c } = await searchParams;
  const ids = (Array.isArray(c) ? c : c ? [c] : []).slice(0, 20);
  const finder = `/dashboard/students/${id}/courses`;

  const [student, facts] = await Promise.all([
    db.studentProfile.findUnique({ where: { id }, select: { id: true, user: { select: { name: true } } } }),
    getStudentFacts(id),
  ]);
  if (!student || !facts) notFound();

  const header = (
    <PageHeader
      title="Apply to selected courses"
      description={`For ${student.user.name}. Check each university's process and pick an intake.`}
      back={{ href: finder, label: "Course finder" }}
    />
  );
  if (ids.length === 0) {
    return (
      <>
        {header}
        <Card tone="solid">
          <p>No courses selected.</p>
          <Link href={finder} className={buttonStyles({ className: "mt-4" })}>Find courses</Link>
        </Card>
      </>
    );
  }

  const [matches, details, open] = await Promise.all([
    findCourses(facts, { ids }, false),
    db.course.findMany({
      where: { id: { in: ids } },
      select: {
        id: true,
        universityId: true,
        university: {
          select: {
            name: true,
            applicationMethod: true,
            applicationUrl: true,
            applicationEmail: true,
            processNotes: true,
            requirements: { orderBy: [{ sortOrder: "asc" }, { label: "asc" }], select: { id: true, label: true, required: true } },
          },
        },
      },
    }),
    db.application.findMany({
      where: { studentId: id, courseId: { in: ids }, stage: { notIn: ["WITHDRAWN", "REJECTED", "OFFER_DECLINED", "VISA_REFUSED"] } },
      select: { courseId: true },
    }),
  ]);
  const intakes = await db.intake.findMany({
    where: { isOpen: true, universityId: { in: details.map((d) => d.universityId) } },
    orderBy: { startDate: "asc" },
    select: { id: true, name: true, universityId: true, courseId: true, applicationDeadline: true },
  });

  // One section per university, holding its selected courses.
  const byUniversity = new Map<string, typeof matches>();
  for (const m of matches) byUniversity.set(m.university.id, [...(byUniversity.get(m.university.id) ?? []), m]);

  return (
    <>
      {header}
      <BulkApplyForm studentId={id} count={matches.length}>
        {[...byUniversity.entries()].map(([universityId, courses]) => {
          const uni = details.find((d) => d.universityId === universityId)!.university;
          return (
            <Card key={universityId} tone="solid">
              <h2 className="text-xl font-bold">{uni.name}</h2>
              <p className="mb-4 text-sm text-muted">{courses[0].university.country}</p>
              <div className="grid gap-4 lg:grid-cols-2">
                <div className="grid content-start gap-4">
                  <HowToApply name={uni.name} method={uni.applicationMethod} url={uni.applicationUrl} email={uni.applicationEmail} notes={uni.processNotes} />
                  <div className="text-sm">
                    <p className="font-semibold">Documents this university asks for</p>
                    {uni.requirements.length ? (
                      <ul className="mt-1 list-disc pl-5">
                        {uni.requirements.map((r) => <li key={r.id}>{r.label}{r.required ? "" : " (optional)"}</li>)}
                      </ul>
                    ) : (
                      <p className="mt-1 text-muted">No checklist saved; ask for documents on the application by hand.</p>
                    )}
                  </div>
                </div>
                <ul className="grid content-start gap-3">
                  {courses.map((course) => {
                    const courseIntakes = intakes.filter((i) => i.universityId === universityId && (!i.courseId || i.courseId === course.id));
                    const alreadyOpen = open.some((a) => a.courseId === course.id);
                    return (
                      <li key={course.id} className="rounded-xl border border-brand-900/10 p-3">
                        <label className="flex items-start gap-2">
                          <input type="checkbox" name="course" value={course.id} defaultChecked={!alreadyOpen} className="mt-1 size-4 shrink-0 accent-brand-600" />
                          <span>
                            <span className="font-semibold">{course.name}</span>{" "}
                            <Badge tone={statusBadge[course.status].tone}>{statusBadge[course.status].text}</Badge>
                            <span className="block text-sm text-muted">{levelNames[course.level]}</span>
                          </span>
                        </label>
                        <input type="hidden" name={`name-${course.id}`} value={`${course.name}, ${uni.name}`} />
                        {alreadyOpen && <p className="mt-1 text-sm text-accent-600">The student already has an open application for this course.</p>}
                        {course.checks.filter((ch) => ch.status !== "ELIGIBLE").map((ch) => (
                          <p key={ch.label} className="mt-1 text-sm"><span className="font-semibold">{ch.label}:</span> {ch.detail}</p>
                        ))}
                        <div className="mt-2">
                          <Label htmlFor={`intake-${course.id}`}>Intake</Label>
                          <Select id={`intake-${course.id}`} name={`intake-${course.id}`} defaultValue={courseIntakes[0]?.id ?? ""}>
                            <option value="">{courseIntakes.length ? "Not decided" : "No open intakes listed"}</option>
                            {courseIntakes.map((i) => (
                              <option key={i.id} value={i.id}>{i.name}{i.applicationDeadline ? ` (apply by ${formatDate(i.applicationDeadline)})` : ""}</option>
                            ))}
                          </Select>
                        </div>
                      </li>
                    );
                  })}
                </ul>
              </div>
            </Card>
          );
        })}
      </BulkApplyForm>
    </>
  );
}
