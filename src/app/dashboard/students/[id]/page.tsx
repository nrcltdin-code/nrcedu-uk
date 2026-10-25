import { SendEmailButton } from "@/components/dashboard/send-email-button";
import { composeProps } from "@/lib/email-templates";
import type { Metadata } from "next";
import { Suspense } from "react";
import { InfoTip } from "@/components/ui/info-tip";
import Link from "next/link";
import { notFound } from "next/navigation";
import { NoteForm } from "@/components/dashboard/note-form";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { getAssigneeOptions } from "@/lib/assignees";
import { db } from "@/lib/db";
import { formatDate } from "@/lib/format";
import { can, requirePermission } from "@/lib/session";
import { RemindersCard } from "../../reminders/reminders-card";
import { stageLabels, stageTones } from "../../applications/labels";
import { studyLevelLabels } from "../../leads/labels";
import { addStudentNote, setCanStartApplications } from "../actions";
import { RequestForm } from "../request-form";
import { DocumentRequestList, requestSelect, WhatsAppButton } from "@/components/dashboard/document-requests";
import { Button } from "@/components/ui/button";
import { whatsappNumber } from "@/lib/whatsapp";
import { deleteDocument } from "../document-actions";
import { DocumentReview } from "../document-review";
import { PortalInvite } from "../portal-invite";
import { ConfirmSection } from "../confirm-section";
import { DeleteButton } from "@/components/dashboard/form-bits";
import { DocumentUpload } from "@/components/dashboard/document-upload";
import { EducationAndScores } from "@/components/dashboard/education-scores";
import { educationView, scoreView } from "@/lib/course-match";
import { buttonStyles } from "@/components/ui/button";
import { documentTypeLabels } from "@/lib/documents";
import { privateStorageEnabled } from "@/lib/storage";

const docLabels = { PENDING: "Waiting for review", APPROVED: "Approved", REJECTED: "Asked again" } as const;
const docTones = { PENDING: "accent", APPROVED: "success", REJECTED: "danger" } as const;
import { NewApplicationForm, StudentForm } from "../student-forms";

export const metadata: Metadata = { title: "Student", robots: { index: false } };

const dateTime = new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit", timeZone: "Europe/London" });
const isoDate = (date: Date | null) => (date ? date.toISOString().slice(0, 10) : "");

export default function StudentPage({ params, searchParams }: PageProps<"/dashboard/students/[id]">) {
  return (
    <>
      <Link href="/dashboard/students" className="text-sm font-medium text-brand-700 hover:underline">
        ← Students
      </Link>
      <Suspense fallback={<Card tone="solid" className="mt-6">Loading…</Card>}>
        <StudentDetail params={params} searchParams={searchParams} />
      </Suspense>
    </>
  );
}

async function StudentDetail({ params, searchParams }: PageProps<"/dashboard/students/[id]">) {
  const user = await requirePermission("STUDENTS", "view");
  const [canEdit, canSeeApps, canStartApps] = await Promise.all([
    can(user, "STUDENTS", "edit"),
    can(user, "APPLICATIONS", "view"),
    can(user, "APPLICATIONS", "edit"),
  ]);

  const { id } = await params;
  const { course: courseParam, started } = await searchParams;
  const startedCount = typeof started === "string" ? Number(started) || 0 : 0;
  const chosenCourse = typeof courseParam === "string" ? courseParam : "";
  const student = await db.studentProfile.findUnique({
    where: { id },
    include: {
      user: { select: { name: true, email: true, phone: true, accounts: { select: { id: true }, take: 1 } } },
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
      // All requests live here: general ones, then one group per application.
      documentRequests: { orderBy: { createdAt: "asc" }, select: { ...requestSelect, applicationId: true } },
      // Files outside any request (staff uploads); request files are shown under their request.
      documents: {
        where: { requestId: null },
        orderBy: { createdAt: "desc" },
        include: { uploadedBy: { select: { name: true } }, reviewedBy: { select: { name: true } }, application: { select: { course: { select: { name: true } } } } },
      },
    },
  });
  if (!student) notFound();
  const compose = canEdit ? await composeProps(user) : null;

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
  const whatsapp = Boolean(whatsappNumber(student.phone ?? student.user.phone));
  const documentTypes = Object.entries(documentTypeLabels).map(([value, label]) => ({ value, label }));
  const applicationNames = student.applications.map((a) => ({ id: a.id, name: `${a.course.name}, ${a.course.university.name}` }));
  const documentGroups = [
    { id: null, name: "General", hint: "Used for every application, e.g. passport and transcripts." },
    ...applicationNames.map((a) => ({ ...a, hint: null })),
  ].map((g) => ({ ...g, requests: student.documentRequests.filter((r) => r.applicationId === g.id) }));

  return (
    <>
      <div className="mt-2 flex flex-wrap items-center gap-3">
        <h1 className="text-3xl font-bold">{student.user.name}</h1>
        <Badge tone={hasLogin ? "success" : "neutral"}>{hasLogin ? "Has portal login" : "No portal login yet"}</Badge>
        <WhatsAppButton href={`/api/whatsapp?student=${student.id}`} enabled={whatsapp} purpose="student" />
        {compose && <SendEmailButton target="student" id={student.id} recipient={{ name: student.user.name, email: student.user.email }} {...compose} />}
      </div>
      <p className="mt-1 text-muted">
        {student.user.email}
        {student.lead && (
          <>
            {" · "}
            <Link href={`/dashboard/leads/${student.lead.id}`} className="text-brand-700 hover:underline">from a lead</Link>
          </>
        )}
        {" · "}
        <Link href={`/dashboard/messages/${student.id}`} className="text-brand-700 hover:underline">Messages</Link>
      </p>

      <div className="mt-6 grid items-start gap-6 lg:grid-cols-[1.5fr_1fr]">
        <div className="grid gap-6">
          {canSeeApps && (
            <Card tone="solid" id="applications" className="scroll-mt-20">
              <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
              <h2 className="flex items-center gap-1 text-xl font-bold">Applications <InfoTip text="Every university this student applies to. Open one to manage its stages and documents. Pausing new applications stops the student starting more from the website; staff can still add them." /></h2>
                <Link href={`/dashboard/students/${student.id}/courses`} className={buttonStyles({ variant: "glass", size: "sm" })}>Find matching courses</Link>
              </div>
              {startedCount > 0 && (
                <p role="status" className="mb-4 rounded-xl border border-emerald-500/25 bg-emerald-500/10 px-4 py-2.5 text-sm text-emerald-800">
                  Started {startedCount} application{startedCount === 1 ? "" : "s"}. Open each one to send it to the university.
                </p>
              )}
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
              <div className="mt-4 flex flex-wrap items-center justify-between gap-2 rounded-xl bg-brand-600/5 px-3 py-2 text-sm">
                <span>
                  {student.canStartApplications
                    ? "The student can apply to more universities from the website."
                    : "Paused: the student cannot start new applications. Staff still can."}
                </span>
                {canEdit && (
                  <form action={setCanStartApplications.bind(null, student.id, !student.canStartApplications)}>
                    <Button variant="ghost" size="sm">{student.canStartApplications ? "Pause new applications" : "Allow new applications"}</Button>
                  </form>
                )}
              </div>
              {canStartApps && (
                <details className="mt-4 border-t border-brand-900/10 pt-4" open={student.applications.length === 0 || Boolean(chosenCourse)}>
                  <summary className="cursor-pointer font-semibold text-brand-700">Start an application</summary>
                  <div className="mt-4">
                    <NewApplicationForm
                      studentId={student.id}
                      courses={courses.map((c) => ({ id: c.id, name: c.name, universityId: c.universityId, university: c.university.name }))}
                      intakes={intakes}
                      initialCourseId={chosenCourse}
                    />
                  </div>
                </details>
              )}
            </Card>
          )}

          <Card tone="solid">
            <h2 className="flex items-center gap-1 mb-1 text-xl font-bold">Documents <InfoTip text="Every document for this student, in one place: general ones first, then one group per application. Ask for a document to open an upload slot on the student's portal." /></h2>
            {!whatsapp && <p className="mb-2 text-xs text-muted">Add a phone number with the country code (e.g. +44…) to chat on WhatsApp.</p>}
            <div className="grid gap-6">
              {documentGroups.map((g) => (
                <section key={g.id ?? "general"} id={g.id ? `docs-${g.id}` : "docs-general"} className="scroll-mt-20 border-t border-brand-900/10 pt-4 first:border-t-0 first:pt-2">
                  <div className="mb-2 flex flex-wrap items-baseline justify-between gap-2">
                    <h3 className="font-semibold">
                      {g.id ? <Link href={`/dashboard/applications/${g.id}`} className="hover:underline">{g.name}</Link> : g.name}
                    </h3>
                    {g.hint && <span className="text-xs text-muted">{g.hint}</span>}
                  </div>
                  {g.requests.length > 0 && (() => {
                    const approved = g.requests.filter((r) => r.status === "APPROVED");
                    const waiting = g.requests.filter((r) => r.status !== "APPROVED" && r.status !== "WAIVED").length;
                    return (
                      <p className="mb-3 rounded-xl bg-emerald-600/5 px-3 py-2 text-sm">
                        <span className="font-semibold text-emerald-700">Approved:</span>{" "}
                        {approved.length ? approved.map((r) => r.label).join(", ") : <span className="text-muted">none yet</span>}
                        {waiting > 0 && <span className="text-muted"> · {waiting} still to do</span>}
                      </p>
                    );
                  })()}
                  {g.requests.length > 0
                    ? <DocumentRequestList studentId={student.id} requests={g.requests} canEdit={canEdit} whatsapp={whatsapp} storage={privateStorageEnabled} />
                    : <p className="text-sm text-muted">Nothing asked for yet.</p>}
                  {canEdit && (
                    <details className="mt-2">
                      <summary className="cursor-pointer text-sm font-semibold text-brand-700">Ask for a document{g.id ? " for this application" : ""}</summary>
                      <div className="mt-3">
                        <RequestForm key={g.requests.length} studentId={student.id} applicationId={g.id ?? undefined} types={documentTypes} />
                      </div>
                    </details>
                  )}
                </section>
              ))}
            </div>

            {(student.documents.length > 0 || canEdit) && (
              <>
                <h3 className="flex items-center gap-1 mb-2 mt-6 font-semibold">Other files <InfoTip text="Files staff uploaded directly, not in answer to a request." /></h3>
                <ul className="divide-y divide-brand-900/10">
                  {student.documents.map((doc) => (
                    <li key={doc.id} className="py-3">
                      <div className="flex flex-wrap items-start justify-between gap-2">
                        <div className="min-w-0">
                          <p className="font-semibold">{documentTypeLabels[doc.type]}</p>
                          <p className="truncate text-sm text-muted">
                            {[doc.name, doc.application?.course.name, `${doc.uploadedBy?.name ?? "Someone"}, ${formatDate(doc.createdAt)}`].filter(Boolean).join(" · ")}
                          </p>
                          {doc.reviewNote && <p className="mt-1 text-sm">“{doc.reviewNote}”{doc.reviewedBy && <span className="text-muted"> — {doc.reviewedBy.name}</span>}</p>}
                        </div>
                        <div className="flex flex-wrap items-center gap-2">
                          <Badge tone={docTones[doc.status]}>{docLabels[doc.status]}</Badge>
                          <a href={`/api/documents/${doc.id}`} className={buttonStyles({ variant: "glass", size: "sm" })}>Download</a>
                          <WhatsAppButton href={`/api/whatsapp?document=${doc.id}`} enabled={whatsapp} purpose="document" />
                          {canEdit && <DeleteButton action={deleteDocument.bind(null, doc.id)} question={`Delete ${doc.name}? The file is removed for good.`} />}
                        </div>
                      </div>
                      {canEdit && doc.status === "PENDING" && <DocumentReview id={doc.id} />}
                    </li>
                  ))}
                  {student.documents.length === 0 && <li className="py-2 text-sm text-muted">None.</li>}
                </ul>
                {canEdit && (
                  <details className="mt-3">
                    <summary className="cursor-pointer text-sm font-semibold text-brand-700">Upload a file directly</summary>
                    <div className="mt-3">
                      <DocumentUpload studentId={student.id} enabled={privateStorageEnabled} types={documentTypes} applications={applicationNames} />
                    </div>
                  </details>
                )}
              </>
            )}
          </Card>

          <Card tone="solid">
            <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
              <h2 className="flex items-center gap-1 text-xl font-bold">Profile <InfoTip text="The student's personal details. The phone number needs its country code (e.g. +44…) for the WhatsApp buttons to work. Press Confirm once you have checked them; any later change clears it." /></h2>
              <ConfirmSection studentId={student.id} section="profile" confirmedAt={student.profileConfirmedAt} confirmedBy={student.profileConfirmedBy} canEdit={canEdit} />
            </div>
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
            <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
              <h2 className="flex items-center gap-1 text-xl font-bold">Education and test scores <InfoTip text="Past study and test results (IELTS, PTE and so on), used when checking entry requirements. Press Confirm once you have checked them; any later change clears it." /></h2>
              <ConfirmSection studentId={student.id} section="education" confirmedAt={student.educationConfirmedAt} confirmedBy={student.educationConfirmedBy} canEdit={canEdit} />
            </div>
            <EducationAndScores
              studentId={student.id}
              canEdit={canEdit}
              levels={Object.entries(studyLevelLabels).map(([value, label]) => ({ value, label }))}
              education={educationView(student.educationRecords)}
              englishMedium={student.englishMedium}
              scores={scoreView(student.testScores)}
            />
          </Card>
        </div>

        <div className="grid gap-6">
        {canEdit && !hasLogin && (
          <Card tone="solid">
            <h2 className="flex items-center gap-1 mb-3 text-xl font-bold">Portal access <InfoTip text="The student has no login yet. Send an invite so they can upload documents and follow their applications." /></h2>
            <PortalInvite studentId={student.id} />
          </Card>
        )}
        <RemindersCard link={{ studentId: student.id }} user={user} canEdit={canEdit} />
        <Card tone="solid">
          <h2 className="flex items-center gap-1 mb-4 text-xl font-bold">Notes <InfoTip text="Internal notes for staff. The student never sees these." /></h2>
          <p className="-mt-2 mb-4 text-xs text-muted">Only staff see these notes.</p>
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
      </div>
    </>
  );
}
