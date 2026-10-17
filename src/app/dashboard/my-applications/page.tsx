import type { Metadata } from "next";
import { Suspense } from "react";
import { InfoTip } from "@/components/ui/info-tip";
import Link from "next/link";
import { ApplicationTimeline, eventSelect } from "@/components/dashboard/application-timeline";
import { PageHeader } from "@/components/dashboard/page-header";
import { Badge } from "@/components/ui/badge";
import { buttonStyles } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { isClosed, nextStepText, requestStatusLabels, requestStatusTones, stageLabel, stages, stageTones } from "@/lib/application-flow";
import { db } from "@/lib/db";
import { requireMyStudentId } from "@/lib/student";

export const metadata: Metadata = { title: "My applications", robots: { index: false } };

export default function MyApplicationsPage({ searchParams }: PageProps<"/dashboard/my-applications">) {
  return (
    <>
      <PageHeader title="My applications" description="Where each application is and what happens next." />
      <Suspense fallback={<Card tone="solid">Loading…</Card>}>
        <MyApplications searchParams={searchParams} />
      </Suspense>
    </>
  );
}

async function MyApplications({ searchParams }: Pick<PageProps<"/dashboard/my-applications">, "searchParams">) {
  const studentId = await requireMyStudentId();
  const { started } = await searchParams;

  // Students see only events marked for them; staff notes and internal events stay internal.
  const [applications, profile] = await Promise.all([
    db.application.findMany({
      where: { studentId },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        stage: true,
        course: { select: { name: true, university: { select: { name: true, confirmationName: true, skippedStages: true } } } },
        intake: { select: { name: true } },
        assignedStaff: { select: { name: true } },
        events: { where: { visibleToStudent: true }, orderBy: { createdAt: "desc" }, select: eventSelect },
        documentRequests: { orderBy: { createdAt: "asc" }, select: { id: true, label: true, status: true, required: true } },
        conditions: { orderBy: { createdAt: "asc" }, select: { id: true, text: true, metAt: true } },
      },
    }),
    db.studentProfile.findUnique({ where: { id: studentId }, select: { canStartApplications: true } }),
  ]);

  const browse = profile?.canStartApplications ? (
    <Link href="/universities" className={buttonStyles({ variant: "glass", size: "sm" })}>Apply to another university</Link>
  ) : (
    <p className="text-sm text-muted">To add another university, message your counsellor.</p>
  );

  if (applications.length === 0) {
    return (
      <Card tone="solid">
        <p>You have not started an application yet. Find a course you like and press Apply on its page.</p>
        {profile?.canStartApplications ? (
          <Link href="/universities" className={buttonStyles({ className: "mt-4" })}>Browse universities</Link>
        ) : (
          <p className="mt-3 text-sm text-muted">Your counsellor will add applications for you.</p>
        )}
      </Card>
    );
  }

  return (
    <div className="grid gap-6">
      {typeof started === "string" && applications.some((a) => a.id === started) && (
        <p role="status" className="rounded-xl border border-emerald-500/25 bg-emerald-500/10 px-4 py-3 text-emerald-900">
          Application started. Your counsellor will be in touch. The documents this university needs are now on your Documents page.
        </p>
      )}
      <div className="flex justify-end">{browse}</div>
      {applications.map((app) => {
        const { confirmationName, skippedStages } = app.course.university;
        const path = stages.filter((s) => !isClosed(s) && !skippedStages.includes(s)).concat("ENROLLED");
        const step = path.indexOf(app.stage);
        const waiting = app.documentRequests.filter((r) => r.status === "REQUESTED" || r.status === "NEEDS_REUPLOAD");
        return (
          <Card key={app.id} tone="solid">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <h2 className="text-xl font-bold">{app.course.name}</h2>
                <p className="text-muted">{[app.course.university.name, app.intake?.name].filter(Boolean).join(" · ")}</p>
              </div>
              <Badge tone={stageTones[app.stage]}>{stageLabel(app.stage, confirmationName)}</Badge>
            </div>

            {step >= 0 && (
              <ol className="mt-5 flex gap-1" aria-label="Progress">
                {path.map((s, i) => (
                  <li key={s} title={stageLabel(s, confirmationName)} className={`h-2 flex-1 rounded-full ${i <= step ? "bg-brand-600" : "bg-brand-900/10"}`}>
                    <span className="sr-only">{stageLabel(s, confirmationName)}{i <= step ? " (done)" : ""}</span>
                  </li>
                ))}
              </ol>
            )}

            <p className="mt-4 rounded-xl bg-brand-600/8 px-4 py-3 text-sm">
              <span className="font-semibold">What happens now: </span>
              {nextStepText[app.stage].replace("CAS", confirmationName)}
            </p>
            {app.assignedStaff && <p className="mt-2 text-sm text-muted">Your counsellor: {app.assignedStaff.name}</p>}

            {waiting.length > 0 && (
              <p className="mt-3 text-sm">
                <span className="font-semibold">{waiting.length} document{waiting.length === 1 ? "" : "s"} to upload. </span>
                <Link href="/dashboard/documents" className="text-brand-700 hover:underline">Go to Documents</Link>
              </p>
            )}

            {app.conditions.length > 0 && (
              <div className="mt-4">
                <h3 className="flex items-center gap-1 text-sm font-semibold">Offer conditions <InfoTip text="What the university needs from you before your offer becomes unconditional. Your counsellor ticks each one off when it is met." /></h3>
                <ul className="mt-2 grid gap-1 text-sm">
                  {app.conditions.map((c) => (
                    <li key={c.id}><span aria-hidden className={c.metAt ? "text-emerald-600" : "text-muted"}>{c.metAt ? "✓ " : "○ "}</span>{c.text}{c.metAt && <span className="sr-only"> (met)</span>}</li>
                  ))}
                </ul>
              </div>
            )}

            {app.documentRequests.length > 0 && (
              <details className="mt-4">
                <summary className="cursor-pointer text-sm font-semibold text-brand-700">Documents for this application</summary>
                <ul className="mt-3 grid gap-2 text-sm">
                  {app.documentRequests.map((r) => (
                    <li key={r.id} className="flex flex-wrap items-center justify-between gap-2">
                      <span>{r.label}{!r.required && <span className="text-muted"> (optional)</span>}</span>
                      <Badge tone={requestStatusTones[r.status]}>{requestStatusLabels[r.status]}</Badge>
                    </li>
                  ))}
                </ul>
              </details>
            )}

            <details className="mt-4">
              <summary className="cursor-pointer text-sm font-semibold text-brand-700">History</summary>
              <div className="mt-3">
                <ApplicationTimeline events={app.events} confirmationName={confirmationName} staffView={false} />
              </div>
            </details>
          </Card>
        );
      })}
    </div>
  );
}
