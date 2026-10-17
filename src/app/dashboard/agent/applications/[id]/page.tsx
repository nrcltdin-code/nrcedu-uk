import type { Metadata } from "next";
import { Suspense } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ApplicationTimeline, eventSelect } from "@/components/dashboard/application-timeline";
import { PageHeader } from "@/components/dashboard/page-header";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { InfoTip } from "@/components/ui/info-tip";
import { isClosed, nextStepText, stageLabel, stages, stageTones } from "@/lib/application-flow";
import { requireAgentScope } from "@/lib/agent";
import { db } from "@/lib/db";
import { formatDate } from "@/lib/format";
import { privateStorageEnabled } from "@/lib/storage";
import { AgentRequestList, agentRequestSelect } from "../../request-list";

export const metadata: Metadata = { title: "Application", robots: { index: false } };

export default function AgentApplicationPage({ params }: PageProps<"/dashboard/agent/applications/[id]">) {
  return (
    <Suspense fallback={<Card tone="solid">Loading…</Card>}>
      <AgentApplication params={params} />
    </Suspense>
  );
}

async function AgentApplication({ params }: Pick<PageProps<"/dashboard/agent/applications/[id]">, "params">) {
  const scope = await requireAgentScope();
  const { id } = await params;

  // Same view as the student's, plus who handles it. Staff notes, internal events and money stay hidden.
  const app = await db.application.findFirst({
    where: { id, ...scope.applications },
    select: {
      id: true,
      stage: true,
      createdAt: true,
      universityRef: true,
      casNumber: true,
      student: { select: { id: true, user: { select: { name: true } } } },
      submittedBy: { select: { name: true } },
      assignedStaff: { select: { name: true } },
      course: { select: { name: true, university: { select: { name: true, confirmationName: true, skippedStages: true } } } },
      intake: { select: { name: true, startDate: true } },
      events: { where: { visibleToStudent: true }, orderBy: { createdAt: "desc" }, select: eventSelect },
      documentRequests: { orderBy: { createdAt: "asc" }, select: agentRequestSelect },
      conditions: { orderBy: { createdAt: "asc" }, select: { id: true, text: true, metAt: true } },
    },
  });
  if (!app) notFound();
  const { confirmationName, skippedStages } = app.course.university;
  const path = stages.filter((s) => !isClosed(s) && !skippedStages.includes(s)).concat("ENROLLED");
  const step = path.indexOf(app.stage);

  const details = [
    ["Student", <Link key="s" href={`/dashboard/agent/students/${app.student.id}`} className="text-brand-700 hover:underline">{app.student.user.name}</Link>],
    ["University", app.course.university.name],
    ["Intake", app.intake ? `${app.intake.name} (starts ${formatDate(app.intake.startDate)})` : null],
    ["NRC counsellor", app.assignedStaff?.name],
    ["Started by", `${app.submittedBy?.name ?? "—"} on ${formatDate(app.createdAt)}`],
    ["University applicant ID", app.universityRef],
    [`${confirmationName} number`, app.casNumber],
  ] as const;

  return (
    <>
      <PageHeader title={app.course.name} back={{ href: "/dashboard/agent/applications", label: "Applications" }} actions={<Badge tone={stageTones[app.stage]}>{stageLabel(app.stage, confirmationName)}</Badge>} />
      {step >= 0 && (
        <ol className="mb-6 flex gap-1" aria-label="Progress">
          {path.map((s, i) => (
            <li key={s} title={stageLabel(s, confirmationName)} className={`h-2 flex-1 rounded-full ${i <= step ? "bg-brand-600" : "bg-brand-900/10"}`}>
              <span className="sr-only">{stageLabel(s, confirmationName)}{i <= step ? " (done)" : ""}</span>
            </li>
          ))}
        </ol>
      )}
      <div className="grid items-start gap-6 lg:grid-cols-[1.5fr_1fr]">
        <div className="grid gap-6">
          <Card tone="solid">
            <p className="rounded-xl bg-brand-600/8 px-4 py-3 text-sm"><span className="font-semibold">What happens now: </span>{nextStepText[app.stage].replace("CAS", confirmationName)}</p>
            <dl className="mt-4 grid gap-x-6 gap-y-3 sm:grid-cols-2">
              {details.map(([label, value]) => (
                <div key={label}>
                  <dt className="text-xs font-semibold uppercase tracking-wider text-muted">{label}</dt>
                  <dd className="mt-0.5">{value || <span className="text-muted">—</span>}</dd>
                </div>
              ))}
            </dl>
          </Card>
          <Card tone="solid">
            <h2 className="mb-4 flex items-center gap-1 text-xl font-bold">Documents <InfoTip text="What this university needs. Upload into each one while it is open; NRC checks every file. General documents like the passport are on the student's page." /></h2>
            <AgentRequestList studentId={app.student.id} requests={app.documentRequests} canUpload={scope.can("DOCUMENTS")} storage={privateStorageEnabled} />
          </Card>
          <Card tone="solid">
            <h2 className="mb-4 flex items-center gap-1 text-xl font-bold">History <InfoTip text="Every step NRC took on this application, newest first. You also get an email at each stage change." /></h2>
            <ApplicationTimeline events={app.events} confirmationName={confirmationName} staffView={false} />
          </Card>
        </div>
        {app.conditions.length > 0 && (
          <Card tone="solid">
            <h2 className="mb-3 flex items-center gap-1 text-lg font-bold">Offer conditions <InfoTip text="What the student must do before the offer becomes unconditional. NRC ticks each one off when it is met." /></h2>
            <ul className="grid gap-2 text-sm">
              {app.conditions.map((c) => (
                <li key={c.id}><span aria-hidden className={c.metAt ? "text-emerald-600" : "text-muted"}>{c.metAt ? "✓ " : "○ "}</span>{c.text}{c.metAt && <span className="sr-only"> (met)</span>}</li>
              ))}
            </ul>
          </Card>
        )}
      </div>
    </>
  );
}
