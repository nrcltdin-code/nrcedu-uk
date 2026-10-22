import type { Metadata } from "next";
import { Suspense } from "react";
import { InfoTip } from "@/components/ui/info-tip";
import Link from "next/link";
import { notFound } from "next/navigation";
import { DeleteButton } from "@/components/dashboard/form-bits";
import { PageHeader } from "@/components/dashboard/page-header";
import { Badge } from "@/components/ui/badge";
import { Button, buttonStyles } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { db } from "@/lib/db";
import { courseLevelNames, levelNames } from "@/lib/data/catalogue";
import { formatDate, formatDuration } from "@/lib/format";
import { requirePermission } from "@/lib/session";
import { skippableStages, stageLabels } from "@/lib/application-flow";
import { documentTypeLabels } from "@/lib/documents";
import { studyLevelLabels } from "../../leads/labels";
import { applicationMethodLabels } from "@/lib/application-method";
import { deleteCourse, deleteIntake, deleteRequirement, deleteUniversity, setIntakeOpen } from "../actions";
import { CourseForm, IntakeForm, ProcessForm, RequirementForm, UniversityForm } from "../forms";

export const metadata: Metadata = { title: "Edit university", robots: { index: false } };

type DecimalLike = { toString(): string } | null;
const entryStrings = (r: { minGradePercent: DecimalLike; minIelts: DecimalLike; minIeltsBand: DecimalLike }) => ({
  minGradePercent: r.minGradePercent?.toString() ?? null,
  minIelts: r.minIelts?.toString() ?? null,
  minIeltsBand: r.minIeltsBand?.toString() ?? null,
});

const errors: Record<string, string> = {
  "in-use": "This university has courses with student applications, so it cannot be deleted. Untick “Show on the website” to hide it instead.",
  "course-in-use": "That course has student applications, so it cannot be deleted. Untick “Show on the website” to hide it instead.",
};

export default function EditUniversityPage({ params, searchParams }: PageProps<"/dashboard/universities/[id]">) {
  return (
    <Suspense fallback={<Card tone="solid">Loading…</Card>}>
      <EditUniversity params={params} searchParams={searchParams} />
    </Suspense>
  );
}

async function EditUniversity({ params, searchParams }: PageProps<"/dashboard/universities/[id]">) {
  await requirePermission("CONTENT", "edit");

  const { id } = await params;
  const { course: courseParam, error } = await searchParams;

  const [university, countries, subjects] = await Promise.all([
    db.university.findUnique({
      where: { id },
      include: {
        country: { select: { slug: true } },
        courses: { orderBy: [{ level: "asc" }, { name: "asc" }], include: { subject: { select: { name: true } } } },
        intakes: { orderBy: { startDate: "asc" }, include: { course: { select: { name: true } } } },
        requirements: { orderBy: [{ sortOrder: "asc" }, { label: "asc" }] },
      },
    }),
    db.country.findMany({ orderBy: { name: "asc" }, select: { id: true, name: true } }),
    db.subject.findMany({ orderBy: { name: "asc" }, select: { id: true, name: true } }),
  ]);
  if (!university) notFound();

  const { courses, intakes, requirements, ...uni } = university;
  const editingCourse = courses.find((course) => course.id === courseParam) ?? null;
  const showCourseForm = courseParam === "new" || editingCourse !== null;
  const levels = courseLevelNames.map(([value, label]) => ({ value, label }));
  const qualificationLevels = Object.entries(studyLevelLabels).filter(([value]) => value !== "OTHER").map(([value, label]) => ({ value, label }));
  const errorText = typeof error === "string" ? errors[error] : undefined;

  return (
    <>
      <PageHeader
        title={uni.name}
        back={{ href: "/dashboard/universities", label: "Universities" }}
        actions={
          <div className="flex items-center gap-2">
            {uni.isPublished && (
              <Link href={`/universities/${uni.slug}`} target="_blank" className={buttonStyles({ variant: "glass", size: "sm" })}>
                View on website
              </Link>
            )}
            <DeleteButton action={deleteUniversity.bind(null, uni.id)} question={`Delete ${uni.name} with all its courses and intakes?`} />
          </div>
        }
      />

      {errorText && (
        <p role="alert" className="mb-6 rounded-xl border border-red-500/25 bg-red-500/10 px-4 py-2.5 text-sm text-red-800">{errorText}</p>
      )}

      <Card tone="solid">
        <h2 className="mb-4 text-xl font-bold">Details</h2>
        <UniversityForm
          university={{
            ...uni,
            nrcCommissionRate: uni.nrcCommissionRate?.toString() ?? null,
            agentCommissionRate: uni.agentCommissionRate?.toString() ?? null,
            ...entryStrings(uni),
          }}
          countries={countries}
        />
      </Card>

      <section id="courses" className="mt-8 scroll-mt-20">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-2xl font-bold">Courses ({courses.length})</h2>
          {!showCourseForm && (
            <Link href={`/dashboard/universities/${uni.id}?course=new#courses`} className={buttonStyles({ variant: "glass", size: "sm" })}>
              Add course
            </Link>
          )}
        </div>

        {showCourseForm && (
          <Card tone="solid" className="mb-4">
            <h3 className="mb-4 text-lg font-bold">{editingCourse ? `Edit ${editingCourse.name}` : "Add a course"}</h3>
            <CourseForm
              key={editingCourse?.id ?? "new"}
              universityId={uni.id}
              course={editingCourse && { ...editingCourse, ...entryStrings(editingCourse), tuitionFee: editingCourse.tuitionFee?.toString() ?? null }}
              qualificationLevels={qualificationLevels}
              subjects={subjects}
              levels={levels}
            />
          </Card>
        )}

        <Card tone="solid" className="p-0">
          <ul className="divide-y divide-brand-900/10">
            {courses.length === 0 && <li className="p-5 text-muted">No courses yet.</li>}
            {courses.map((course) => (
              <li key={course.id} className="flex flex-wrap items-center justify-between gap-3 px-5 py-3">
                <div className="min-w-0">
                  <p className="font-semibold">{course.name}</p>
                  <p className="text-sm text-muted">
                    {[
                      levelNames[course.level],
                      course.subject?.name,
                      course.durationMonths && formatDuration(course.durationMonths),
                      course.tuitionFee && `${course.currency} ${Number(course.tuitionFee).toLocaleString("en-GB")}`,
                    ].filter(Boolean).join(" · ")}
                  </p>
                </div>
                <div className="flex items-center gap-1">
                  {!course.isPublished && <Badge tone="neutral">Hidden</Badge>}
                  <Link href={`/dashboard/universities/${uni.id}?course=${course.id}#courses`} className={buttonStyles({ variant: "glass", size: "sm" })}>
                    Edit
                  </Link>
                  <DeleteButton action={deleteCourse.bind(null, uni.id, course.id)} question={`Delete ${course.name}?`} />
                </div>
              </li>
            ))}
          </ul>
        </Card>
      </section>

      <section id="process" className="mt-8 grid scroll-mt-20 items-start gap-6 lg:grid-cols-[1.3fr_1fr]">
        <div>
          <h2 className="mb-1 flex items-center gap-1 text-2xl font-bold">Document checklist ({requirements.length}) <InfoTip text="Documents this university always asks for. When an application starts, each becomes an upload slot on the student's portal. Changing the list only affects new applications." /></h2>
          <p className="mb-4 text-sm text-muted">Copied onto every new application to this university as documents the student must upload. Staff can add more per application.</p>
          <Card tone="solid" className="p-0">
            <ul className="divide-y divide-brand-900/10">
              {requirements.length === 0 && <li className="p-5 text-muted">No checklist yet. Staff ask for documents by hand.</li>}
              {requirements.map((q) => (
                <li key={q.id} className="flex flex-wrap items-center justify-between gap-3 px-5 py-3">
                  <div className="min-w-0">
                    <p className="font-semibold">{q.label}{!q.required && <span className="ml-2 text-xs font-normal text-muted">optional</span>}</p>
                    <p className="text-sm text-muted">{[documentTypeLabels[q.type], q.instructions].filter(Boolean).join(" · ")}</p>
                  </div>
                  <DeleteButton action={deleteRequirement.bind(null, uni.id, q.id)} question={`Remove ${q.label} from the checklist? Applications already started keep it.`} />
                </li>
              ))}
            </ul>
            <div className="border-t border-brand-900/10 p-5">
              <RequirementForm key={requirements.length} universityId={uni.id} types={Object.entries(documentTypeLabels).map(([value, label]) => ({ value, label }))} />
            </div>
          </Card>
        </div>
        <Card tone="solid" className="lg:mt-12">
          <h3 className="flex items-center gap-1 mb-4 text-lg font-bold">Application process <InfoTip text="How this university differs. The confirmation name replaces CAS everywhere (I-20 in the US, CoE in Australia, LOA in Canada). Skipped steps are hidden from the stage list and the student's progress bar. Notes show on every application to this university, for staff only." /></h3>
          <ProcessForm
            universityId={uni.id}
            confirmationName={uni.confirmationName}
            processNotes={uni.processNotes}
            method={{ value: uni.applicationMethod, url: uni.applicationUrl, email: uni.applicationEmail }}
            methods={Object.entries(applicationMethodLabels).map(([value, label]) => ({ value, label }))}
            skipped={uni.skippedStages}
            stages={skippableStages.map((s) => ({ value: s, label: stageLabels[s] }))}
          />
        </Card>
      </section>

      <section id="intakes" className="mt-8 grid scroll-mt-20 items-start gap-6 lg:grid-cols-[1.3fr_1fr]">
        <div>
          <h2 className="mb-4 text-2xl font-bold">Intakes ({intakes.length})</h2>
          <Card tone="solid" className="p-0">
            <ul className="divide-y divide-brand-900/10">
              {intakes.length === 0 && <li className="p-5 text-muted">No intakes yet.</li>}
              {intakes.map((intake) => (
                <li key={intake.id} className="flex flex-wrap items-center justify-between gap-3 px-5 py-3">
                  <div className="min-w-0">
                    <p className="font-semibold">{intake.name}</p>
                    <p className="text-sm text-muted">
                      {intake.course?.name ?? "All courses"} · starts {formatDate(intake.startDate)}
                      {intake.applicationDeadline && ` · apply by ${formatDate(intake.applicationDeadline)}`}
                    </p>
                  </div>
                  <div className="flex items-center gap-1">
                    <Badge tone={intake.isOpen ? "success" : "neutral"}>{intake.isOpen ? "Open" : "Closed"}</Badge>
                    <form action={setIntakeOpen.bind(null, uni.id, intake.id, !intake.isOpen)}>
                      <Button variant="ghost" size="sm">{intake.isOpen ? "Close" : "Reopen"}</Button>
                    </form>
                    <DeleteButton action={deleteIntake.bind(null, uni.id, intake.id)} question={`Delete the ${intake.name} intake?`} />
                  </div>
                </li>
              ))}
            </ul>
          </Card>
        </div>
        <Card tone="solid" className="lg:mt-12">
          <h3 className="mb-4 text-lg font-bold">Add an intake</h3>
          <IntakeForm universityId={uni.id} courses={courses.map(({ id, name }) => ({ id, name }))} />
        </Card>
      </section>
    </>
  );
}
