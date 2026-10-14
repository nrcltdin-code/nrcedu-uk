import type { Metadata } from "next";
import { Suspense } from "react";
import Link from "next/link";
import { PageHeader } from "@/components/dashboard/page-header";
import { Badge } from "@/components/ui/badge";
import { buttonStyles } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import type { ApplicationStage } from "@/generated/prisma/client";
import { nextStepText } from "@/lib/applications";
import { db } from "@/lib/db";
import { formatDate } from "@/lib/format";
import { requireMyStudentId } from "@/lib/student";
import { stageLabels, stages, stageTones } from "../applications/labels";

export const metadata: Metadata = { title: "My applications", robots: { index: false } };

// The happy path shown as a progress bar; refused and withdrawn are shown as badges only.
const path: ApplicationStage[] = stages.filter((s) => s !== "VISA_REFUSED" && s !== "WITHDRAWN");

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

  // Staff notes are internal; students see stages and the notes staff wrote on stage changes.
  const applications = await db.application.findMany({
    where: { studentId },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      stage: true,
      course: { select: { name: true, university: { select: { name: true } } } },
      intake: { select: { name: true } },
      assignedStaff: { select: { name: true } },
      stageHistory: { orderBy: { createdAt: "desc" }, select: { id: true, stage: true, note: true, createdAt: true } },
    },
  });

  if (applications.length === 0) {
    return (
      <Card tone="solid">
        <p>You have not started an application yet. Find a course you like and press Apply on its page.</p>
        <Link href="/universities" className={buttonStyles({ className: "mt-4" })}>Browse universities</Link>
      </Card>
    );
  }

  return (
    <div className="grid gap-6">
      {typeof started === "string" && applications.some((a) => a.id === started) && (
        <p role="status" className="rounded-xl border border-emerald-500/25 bg-emerald-500/10 px-4 py-3 text-emerald-900">
          Application started. Your counsellor will be in touch. Meanwhile, complete your profile and upload your documents.
        </p>
      )}
      {applications.map((app) => {
        const step = path.indexOf(app.stage);
        return (
          <Card key={app.id} tone="solid">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <h2 className="text-xl font-bold">{app.course.name}</h2>
                <p className="text-muted">{[app.course.university.name, app.intake?.name].filter(Boolean).join(" · ")}</p>
              </div>
              <Badge tone={stageTones[app.stage]}>{stageLabels[app.stage]}</Badge>
            </div>

            {step >= 0 && (
              <ol className="mt-5 flex gap-1" aria-label="Progress">
                {path.map((s, i) => (
                  <li key={s} title={stageLabels[s]} className={`h-2 flex-1 rounded-full ${i <= step ? "bg-brand-600" : "bg-brand-900/10"}`}>
                    <span className="sr-only">{stageLabels[s]}{i <= step ? " (done)" : ""}</span>
                  </li>
                ))}
              </ol>
            )}

            <p className="mt-4 rounded-xl bg-brand-600/8 px-4 py-3 text-sm">
              <span className="font-semibold">What happens now: </span>
              {nextStepText[app.stage]}
            </p>
            {app.assignedStaff && <p className="mt-2 text-sm text-muted">Your counsellor: {app.assignedStaff.name}</p>}

            <details className="mt-4">
              <summary className="cursor-pointer text-sm font-semibold text-brand-700">History</summary>
              <ol className="mt-3 grid gap-3">
                {app.stageHistory.map((h) => (
                  <li key={h.id} className="border-l-2 border-brand-600/25 pl-4 text-sm">
                    <span className="text-muted">{formatDate(h.createdAt)}</span> · {stageLabels[h.stage]}
                    {h.note && <p className="mt-0.5">{h.note}</p>}
                  </li>
                ))}
              </ol>
            </details>
          </Card>
        );
      })}
    </div>
  );
}
