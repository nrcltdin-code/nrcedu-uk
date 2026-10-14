import type { Metadata } from "next";
import { Suspense } from "react";
import { notFound } from "next/navigation";
import { DocumentUpload } from "@/components/dashboard/document-upload";
import { EducationAndScores } from "@/components/dashboard/education-scores";
import { PageHeader } from "@/components/dashboard/page-header";
import { Badge } from "@/components/ui/badge";
import { buttonStyles } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { requireMyAgentId } from "@/lib/agent";
import { nextStepText } from "@/lib/applications";
import { db } from "@/lib/db";
import { documentTypeLabels } from "@/lib/documents";
import { formatDate } from "@/lib/format";
import { privateStorageEnabled } from "@/lib/storage";
import { stageLabels, stageTones } from "../../../applications/labels";
import { studyLevelLabels } from "../../../leads/labels";
import { MyDetailsForm } from "../../../profile/details-form";
import { NewApplicationForm } from "../../../students/student-forms";
import { applyForMyStudent, updateMyStudent } from "../../actions";

export const metadata: Metadata = { title: "Student", robots: { index: false } };

const isoDate = (date: Date | null) => (date ? date.toISOString().slice(0, 10) : "");
const docLabels = { PENDING: "Being checked", APPROVED: "Approved", REJECTED: "Upload again" } as const;
const docTones = { PENDING: "accent", APPROVED: "success", REJECTED: "danger" } as const;

export default function AgentStudentPage({ params }: PageProps<"/dashboard/agent/students/[id]">) {
  return (
    <Suspense fallback={<Card tone="solid">Loading…</Card>}>
      <AgentStudent params={params} />
    </Suspense>
  );
}

async function AgentStudent({ params }: Pick<PageProps<"/dashboard/agent/students/[id]">, "params">) {
  const agentId = await requireMyAgentId();
  const { id } = await params;

  // Only students this agent referred; anyone else's id is simply "not found".
  // Staff notes, counsellor contact details and commission are deliberately not loaded.
  const student = await db.studentProfile.findFirst({
    where: { id, agentId },
    include: {
      user: { select: { name: true, email: true } },
      educationRecords: { orderBy: { yearCompleted: "desc" } },
      testScores: { orderBy: { takenAt: "desc" } },
      documents: { orderBy: { createdAt: "desc" }, select: { id: true, type: true, name: true, status: true, reviewNote: true, createdAt: true } },
      applications: {
        orderBy: { createdAt: "desc" },
        select: { id: true, stage: true, course: { select: { name: true, university: { select: { name: true } } } }, intake: { select: { name: true } } },
      },
    },
  });
  if (!student) notFound();

  const [countries, courses, intakes] = await Promise.all([
    db.country.findMany({ orderBy: { name: "asc" }, select: { id: true, name: true } }),
    db.course.findMany({
      where: { isPublished: true, university: { isPublished: true } },
      orderBy: [{ university: { name: "asc" } }, { name: "asc" }],
      select: { id: true, name: true, universityId: true, university: { select: { name: true } } },
    }),
    db.intake.findMany({ where: { isOpen: true }, orderBy: { startDate: "asc" }, select: { id: true, name: true, universityId: true, courseId: true } }),
  ]);

  return (
    <>
      <PageHeader title={student.user.name} description={student.user.email} back={{ href: "/dashboard/agent/students", label: "My students" }} />
      <div className="grid items-start gap-6 xl:grid-cols-2">
        <div className="grid gap-6">
          <Card tone="solid">
            <h2 className="mb-4 text-xl font-bold">Applications</h2>
            <ul className="grid gap-4">
              {student.applications.map((app) => (
                <li key={app.id} className="rounded-2xl border border-brand-900/10 p-4">
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <span>
                      <span className="block font-semibold">{app.course.name}</span>
                      <span className="block text-sm text-muted">{[app.course.university.name, app.intake?.name].filter(Boolean).join(" · ")}</span>
                    </span>
                    <Badge tone={stageTones[app.stage]}>{stageLabels[app.stage]}</Badge>
                  </div>
                  <p className="mt-2 text-sm text-muted">{nextStepText[app.stage]}</p>
                </li>
              ))}
              {student.applications.length === 0 && <li className="text-muted">No applications yet.</li>}
            </ul>
            <details className="mt-4 border-t border-brand-900/10 pt-4" open={student.applications.length === 0}>
              <summary className="cursor-pointer font-semibold text-brand-700">Apply for a course</summary>
              <div className="mt-4">
                <NewApplicationForm
                  studentId={student.id}
                  submit={applyForMyStudent}
                  courses={courses.map((c) => ({ id: c.id, name: c.name, universityId: c.universityId, university: c.university.name }))}
                  intakes={intakes}
                />
              </div>
            </details>
          </Card>

          <Card tone="solid">
            <h2 className="mb-4 text-xl font-bold">Documents</h2>
            <ul className="divide-y divide-brand-900/10">
              {student.documents.map((doc) => (
                <li key={doc.id} className="flex flex-wrap items-start justify-between gap-3 py-3">
                  <div className="min-w-0">
                    <p className="font-semibold">{documentTypeLabels[doc.type]}</p>
                    <p className="truncate text-sm text-muted">{doc.name} · {formatDate(doc.createdAt)}</p>
                    {doc.status === "REJECTED" && doc.reviewNote && <p className="mt-1 text-sm text-red-800">NRC says: {doc.reviewNote}</p>}
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge tone={docTones[doc.status]}>{docLabels[doc.status]}</Badge>
                    <a href={`/api/documents/${doc.id}`} className={buttonStyles({ variant: "glass", size: "sm" })}>Download</a>
                  </div>
                </li>
              ))}
              {student.documents.length === 0 && <li className="py-2 text-muted">No documents yet.</li>}
            </ul>
            <div className="mt-4 border-t border-brand-900/10 pt-4">
              <DocumentUpload
                studentId={student.id}
                enabled={privateStorageEnabled}
                types={Object.entries(documentTypeLabels).map(([value, label]) => ({ value, label }))}
                applications={student.applications.map((a) => ({ id: a.id, name: `${a.course.name}, ${a.course.university.name}` }))}
              />
            </div>
          </Card>
        </div>

        <div className="grid gap-6">
          <Card tone="solid">
            <h2 className="mb-4 text-xl font-bold">Details</h2>
            <MyDetailsForm
              studentId={student.id}
              submit={updateMyStudent}
              countries={countries}
              details={{
                name: student.user.name,
                email: student.user.email,
                phone: student.phone,
                countryId: student.countryId,
                dateOfBirth: isoDate(student.dateOfBirth),
                gender: student.gender,
                nationality: student.nationality,
                passportNumber: student.passportNumber,
                passportExpiry: isoDate(student.passportExpiry),
                address: student.address,
              }}
            />
          </Card>
          <Card tone="solid">
            <h2 className="mb-4 text-xl font-bold">Education and test scores</h2>
            <EducationAndScores
              studentId={student.id}
              canEdit
              levels={Object.entries(studyLevelLabels).map(([value, label]) => ({ value, label }))}
              education={student.educationRecords}
              scores={student.testScores.map((s) => ({ id: s.id, test: s.test, score: s.score, takenAt: s.takenAt ? isoDate(s.takenAt) : null }))}
            />
          </Card>
        </div>
      </div>
    </>
  );
}
