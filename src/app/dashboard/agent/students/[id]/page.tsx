import type { Metadata } from "next";
import { Suspense } from "react";
import { notFound } from "next/navigation";
import Link from "next/link";
import { EducationAndScores } from "@/components/dashboard/education-scores";
import { educationView, scoreView } from "@/lib/course-match";
import { PageHeader } from "@/components/dashboard/page-header";
import { Badge } from "@/components/ui/badge";
import { InfoTip } from "@/components/ui/info-tip";
import { Card } from "@/components/ui/card";
import { requireAgentScope } from "@/lib/agent";
import { nextStepText, stageLabel, stageTones } from "@/lib/application-flow";
import { db } from "@/lib/db";
import { privateStorageEnabled } from "@/lib/storage";
import { AgentRequestList, agentRequestSelect } from "../../request-list";
import { studyLevelLabels } from "../../../leads/labels";
import { MyDetailsForm } from "../../../profile/details-form";
import { NewApplicationForm } from "../../../students/student-forms";
import { applyForMyStudent, updateMyStudent } from "../../actions";

export const metadata: Metadata = { title: "Student", robots: { index: false } };

const isoDate = (date: Date | null) => (date ? date.toISOString().slice(0, 10) : "");

export default function AgentStudentPage({ params }: PageProps<"/dashboard/agent/students/[id]">) {
  return (
    <Suspense fallback={<Card tone="solid">Loading…</Card>}>
      <AgentStudent params={params} />
    </Suspense>
  );
}

async function AgentStudent({ params }: Pick<PageProps<"/dashboard/agent/students/[id]">, "params">) {
  const scope = await requireAgentScope();
  const { id } = await params;

  // Only students this agent referred; anyone else's id is simply "not found".
  // Staff notes, counsellor contact details and commission are deliberately not loaded.
  const student = await db.studentProfile.findFirst({
    where: { id, ...scope.students },
    include: {
      user: { select: { name: true, email: true } },
      educationRecords: { orderBy: { yearCompleted: "desc" } },
      testScores: { orderBy: { takenAt: "desc" } },
      // Only applications this agency started; the requests shown are general ones and those of these applications.
      applications: {
        where: scope.applications,
        orderBy: { createdAt: "desc" },
        select: { id: true, stage: true, course: { select: { name: true, university: { select: { name: true, confirmationName: true } } } }, intake: { select: { name: true } } },
      },
      documentRequests: { where: { OR: [{ applicationId: null }, { application: scope.applications }] }, orderBy: { createdAt: "asc" }, select: agentRequestSelect },
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
            <h2 className="mb-4 flex items-center gap-1 text-xl font-bold">Applications <InfoTip text="Applications your agency started for this student. Open one to see its stages, documents and history. NRC moves the stages and emails you at each step." /></h2>
            <ul className="grid gap-4">
              {student.applications.map((app) => (
                <li key={app.id}>
                  <Link href={`/dashboard/agent/applications/${app.id}`} className="block rounded-2xl border border-brand-900/10 p-4 hover:bg-brand-600/5">
                    <span className="flex flex-wrap items-start justify-between gap-2">
                      <span>
                        <span className="block font-semibold">{app.course.name}</span>
                        <span className="block text-sm text-muted">{[app.course.university.name, app.intake?.name].filter(Boolean).join(" · ")}</span>
                      </span>
                      <Badge tone={stageTones[app.stage]}>{stageLabel(app.stage, app.course.university.confirmationName)}</Badge>
                    </span>
                    <span className="mt-2 block text-sm text-muted">{nextStepText[app.stage].replace("CAS", app.course.university.confirmationName)}</span>
                  </Link>
                </li>
              ))}
              {student.applications.length === 0 && <li className="text-muted">No applications yet.</li>}
            </ul>
            {scope.can("APPLICATIONS") && <details className="mt-4 border-t border-brand-900/10 pt-4" open={student.applications.length === 0}>
              <summary className="cursor-pointer font-semibold text-brand-700">Apply for a course</summary>
              <div className="mt-4">
                <NewApplicationForm
                  studentId={student.id}
                  submit={applyForMyStudent}
                  courses={courses.map((c) => ({ id: c.id, name: c.name, universityId: c.universityId, university: c.university.name }))}
                  intakes={intakes}
                />
              </div>
            </details>}
          </Card>

          <Card tone="solid">
            <h2 className="mb-4 flex items-center gap-1 text-xl font-bold">Documents <InfoTip text="What NRC needs from this student. Upload into each document while it is open; NRC checks every file and tells you here if something needs redoing." /></h2>
            <AgentRequestList studentId={student.id} requests={student.documentRequests} canUpload={scope.can("DOCUMENTS")} storage={privateStorageEnabled} />
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
              education={educationView(student.educationRecords)}
              englishMedium={student.englishMedium}
              scores={scoreView(student.testScores)}
            />
          </Card>
        </div>
      </div>
    </>
  );
}
