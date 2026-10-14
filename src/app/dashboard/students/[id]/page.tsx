import type { Metadata } from "next";
import { Suspense } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { NoteForm } from "@/components/dashboard/note-form";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { getAssigneeOptions } from "@/lib/assignees";
import { db } from "@/lib/db";
import { formatDate } from "@/lib/format";
import { can, requirePermission } from "@/lib/session";
import { stageLabels, stageTones } from "../../applications/labels";
import { studyLevelLabels } from "../../leads/labels";
import { addStudentNote } from "../actions";
import { NewApplicationForm, StudentForm } from "../student-forms";

export const metadata: Metadata = { title: "Student", robots: { index: false } };

const dateTime = new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit", timeZone: "Europe/London" });
const isoDate = (date: Date | null) => (date ? date.toISOString().slice(0, 10) : "");

export default function StudentPage({ params }: PageProps<"/dashboard/students/[id]">) {
  return (
    <>
      <Link href="/dashboard/students" className="text-sm font-medium text-brand-700 hover:underline">
        ← Students
      </Link>
      <Suspense fallback={<Card tone="solid" className="mt-6">Loading…</Card>}>
        <StudentDetail params={params} />
      </Suspense>
    </>
  );
}

async function StudentDetail({ params }: Pick<PageProps<"/dashboard/students/[id]">, "params">) {
  const user = await requirePermission("STUDENTS", "view");
  const [canEdit, canSeeApps, canStartApps] = await Promise.all([
    can(user, "STUDENTS", "edit"),
    can(user, "APPLICATIONS", "view"),
    can(user, "APPLICATIONS", "edit"),
  ]);

  const { id } = await params;
  const student = await db.studentProfile.findUnique({
    where: { id },
    include: {
      user: { select: { name: true, email: true, accounts: { select: { id: true }, take: 1 } } },
      country: { select: { name: true } },
      counsellor: { select: { name: true } },
      agent: { select: { user: { select: { name: true } } } },
      lead: { select: { id: true } },
      educationRecords: true,
      testScores: true,
      applications: {
        orderBy: { createdAt: "desc" },
        include: { course: { select: { name: true, university: { select: { name: true } } } }, intake: { select: { name: true } } },
      },
      notes: { orderBy: { createdAt: "desc" }, include: { author: { select: { name: true } } } },
    },
  });
  if (!student) notFound();

  const [countries, people, courses, intakes] = await Promise.all([
    canEdit ? db.country.findMany({ orderBy: { name: "asc" }, select: { id: true, name: true } }) : [],
    canEdit ? getAssigneeOptions() : { staff: [], agents: [] },
    canStartApps
      ? db.course.findMany({
          orderBy: [{ university: { name: "asc" } }, { name: "asc" }],
          select: { id: true, name: true, universityId: true, university: { select: { name: true } } },
        })
      : [],
    canStartApps
      ? db.intake.findMany({ where: { isOpen: true }, orderBy: { startDate: "asc" }, select: { id: true, name: true, universityId: true, courseId: true } })
      : [],
  ]);

  const hasLogin = student.user.accounts.length > 0;

  return (
    <>
      <div className="mt-2 flex flex-wrap items-center gap-3">
        <h1 className="text-3xl font-bold">{student.user.name}</h1>
        <Badge tone={hasLogin ? "success" : "neutral"}>{hasLogin ? "Has portal login" : "No portal login yet"}</Badge>
      </div>
      <p className="mt-1 text-muted">
        {student.user.email}
        {student.lead && (
          <>
            {" · "}
            <Link href={`/dashboard/leads/${student.lead.id}`} className="text-brand-700 hover:underline">from a lead</Link>
          </>
        )}
      </p>

      <div className="mt-6 grid items-start gap-6 lg:grid-cols-[1.5fr_1fr]">
        <div className="grid gap-6">
          {canSeeApps && (
            <Card tone="solid">
              <h2 className="mb-4 text-xl font-bold">Applications</h2>
              <ul className="divide-y divide-brand-900/10">
                {student.applications.map((app) => (
                  <li key={app.id}>
                    <Link href={`/dashboard/applications/${app.id}`} className="flex flex-wrap items-center justify-between gap-2 rounded-xl px-2 py-3 hover:bg-brand-600/5">
                      <span className="min-w-0">
                        <span className="block font-semibold">{app.course.name}</span>
                        <span className="block text-sm text-muted">{[app.course.university.name, app.intake?.name].filter(Boolean).join(" · ")}</span>
                      </span>
                      <Badge tone={stageTones[app.stage]}>{stageLabels[app.stage]}</Badge>
                    </Link>
                  </li>
                ))}
                {student.applications.length === 0 && <li className="py-2 text-muted">No applications yet.</li>}
              </ul>
              {canStartApps && (
                <details className="mt-4 border-t border-brand-900/10 pt-4" open={student.applications.length === 0}>
                  <summary className="cursor-pointer font-semibold text-brand-700">Start an application</summary>
                  <div className="mt-4">
                    <NewApplicationForm
                      studentId={student.id}
                      courses={courses.map((c) => ({ id: c.id, name: c.name, universityId: c.universityId, university: c.university.name }))}
                      intakes={intakes}
                    />
                  </div>
                </details>
              )}
            </Card>
          )}

          <Card tone="solid">
            <h2 className="mb-4 text-xl font-bold">Profile</h2>
            {canEdit ? (
              <StudentForm
                student={{
                  id: student.id,
                  name: student.user.name,
                  phone: student.phone,
                  countryId: student.countryId,
                  counsellorId: student.counsellorId,
                  agentId: student.agentId,
                  dateOfBirth: isoDate(student.dateOfBirth),
                  gender: student.gender,
                  nationality: student.nationality,
                  passportNumber: student.passportNumber,
                  passportExpiry: isoDate(student.passportExpiry),
                  address: student.address,
                }}
                countries={countries}
                counsellors={people.staff}
                agents={people.agents}
              />
            ) : (
              <dl className="grid gap-3 sm:grid-cols-2">
                {[
                  ["Phone", student.phone],
                  ["Lives in", student.country?.name],
                  ["Nationality", student.nationality],
                  ["Date of birth", student.dateOfBirth && formatDate(student.dateOfBirth)],
                  ["Counsellor", student.counsellor?.name],
                  ["Agent", student.agent?.user.name],
                ].map(([label, value]) => (
                  <div key={label}>
                    <dt className="text-xs font-semibold uppercase tracking-wider text-muted">{label}</dt>
                    <dd className="mt-0.5">{value || <span className="text-muted">—</span>}</dd>
                  </div>
                ))}
              </dl>
            )}
          </Card>

          <Card tone="solid">
            <h2 className="text-xl font-bold">Education and test scores</h2>
            {student.educationRecords.length === 0 && student.testScores.length === 0 ? (
              <p className="mt-2 text-sm text-muted">None yet. The student adds these in their portal (task 4.4).</p>
            ) : (
              <ul className="mt-3 grid gap-2 text-sm">
                {student.educationRecords.map((r) => (
                  <li key={r.id}>{[studyLevelLabels[r.level], r.fieldOfStudy, r.institution, r.result, r.yearCompleted].filter(Boolean).join(" · ")}</li>
                ))}
                {student.testScores.map((t) => (
                  <li key={t.id}>{[t.test, t.score, t.takenAt && formatDate(t.takenAt)].filter(Boolean).join(" · ")}</li>
                ))}
              </ul>
            )}
          </Card>
        </div>

        <Card tone="solid">
          <h2 className="mb-4 text-xl font-bold">Notes</h2>
          {canEdit && <NoteForm key={student.notes.length} action={addStudentNote} field={{ studentId: student.id }} />}
          <ol className="mt-5 grid gap-4">
            {student.notes.map((note) => (
              <li key={note.id} className="border-l-2 border-brand-600/25 pl-4">
                <p className="text-xs text-muted">{dateTime.format(note.createdAt)} · {note.author?.name ?? "Someone"}</p>
                <p className="mt-1 whitespace-pre-line">{note.body}</p>
              </li>
            ))}
            {student.notes.length === 0 && <li className="text-sm text-muted">No notes yet.</li>}
          </ol>
        </Card>
      </div>
    </>
  );
}
