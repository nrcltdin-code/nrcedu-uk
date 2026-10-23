import type { Metadata } from "next";
import { HowToApply } from "@/components/dashboard/how-to-apply";
import { Suspense } from "react";
import { InfoTip } from "@/components/ui/info-tip";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ApplicationTimeline, eventSelect } from "@/components/dashboard/application-timeline";
import { requestSelect, WhatsAppButton } from "@/components/dashboard/document-requests";
import { DeleteButton } from "@/components/dashboard/form-bits";
import { NoteForm } from "@/components/dashboard/note-form";
import { Badge } from "@/components/ui/badge";
import { Button, buttonStyles } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { allowedMoves, isClosed, needsReason, requestStatusLabels, requestStatusTones, stageLabel, stages, stageTones } from "@/lib/application-flow";
import { getAssigneeOptions } from "@/lib/assignees";
import { db } from "@/lib/db";
import { formatDate, formatMoney } from "@/lib/format";
import { can, requirePermission } from "@/lib/session";
import { whatsappNumber } from "@/lib/whatsapp";
import { RemindersCard } from "../../reminders/reminders-card";
import { addApplicationNote, deleteApplication, deleteCondition, setConditionMet } from "../actions";
import { AssignForm, ConditionForm, DetailsForm, StageForm } from "../application-forms";
import { AddCommissionForm, CommissionRowForm, ExpectedCommissionsButton } from "../../commissions/commission-forms";
import { commissionStatusLabels, commissionStatusTones, directionLabels } from "../../commissions/labels";

export const metadata: Metadata = { title: "Application", robots: { index: false } };

const dateTime = new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit", timeZone: "Europe/London" });

export default function ApplicationPage({ params, searchParams }: PageProps<"/dashboard/applications/[id]">) {
  return (
    <>
      <Link href="/dashboard/applications" className="text-sm font-medium text-brand-700 hover:underline">
        ← Applications
      </Link>
      <Suspense fallback={<Card tone="solid" className="mt-6">Loading…</Card>}>
        <ApplicationDetail params={params} searchParams={searchParams} />
      </Suspense>
    </>
  );
}

async function ApplicationDetail({ params, searchParams }: Pick<PageProps<"/dashboard/applications/[id]">, "params" | "searchParams">) {
  const user = await requirePermission("APPLICATIONS", "view");
  const [canEdit, canEditDocs, canSeeMoney, canEditMoney] = await Promise.all([
    can(user, "APPLICATIONS", "edit"),
    can(user, "STUDENTS", "edit"),
    can(user, "COMMISSIONS", "view"),
    can(user, "COMMISSIONS", "edit"),
  ]);

  const [{ id }, { error, submitted }] = await Promise.all([params, searchParams]);
  const app = await db.application.findUnique({
    where: { id },
    include: {
      student: { select: { id: true, phone: true, user: { select: { name: true, email: true, phone: true } } } },
      course: {
        select: {
          name: true,
          level: true,
          currency: true,
          university: { select: { id: true, name: true, confirmationName: true, skippedStages: true, processNotes: true, applicationMethod: true, applicationUrl: true, applicationEmail: true } },
        },
      },
      intake: { select: { name: true, startDate: true, applicationDeadline: true } },
      agent: { select: { user: { select: { name: true } } } },
      submittedBy: { select: { name: true } },
      events: { orderBy: { createdAt: "desc" }, select: eventSelect },
      documentRequests: { orderBy: { createdAt: "asc" }, select: requestSelect },
      conditions: { orderBy: { createdAt: "asc" }, include: { metBy: { select: { name: true } } } },
      notes: { orderBy: { createdAt: "desc" }, include: { author: { select: { name: true } } } },
    },
  });
  if (!app) notFound();
  const { confirmationName, skippedStages, processNotes } = app.course.university;

  const [people, commissions] = await Promise.all([
    canEdit ? getAssigneeOptions() : { staff: [] },
    canSeeMoney
      ? db.commission.findMany({
          where: { applicationId: id },
          orderBy: { createdAt: "asc" },
          select: { id: true, direction: true, amount: true, currency: true, status: true, note: true, ratePercent: true },
        })
      : [],
  ]);

  const options = allowedMoves(app.stage, skippedStages, user.role === "ADMIN").map((s) => ({ value: s, label: stageLabel(s, confirmationName), closed: isClosed(s), needsNote: needsReason.includes(s) }));
  const path = stages.filter((s) => !isClosed(s) && !skippedStages.includes(s)).concat("ENROLLED");
  const step = path.indexOf(app.stage);
  const required = app.documentRequests.filter((r) => r.required);
  const done = required.filter((r) => r.status === "APPROVED" || r.status === "WAIVED").length;
  const showConditions = app.conditions.length > 0 || stages.indexOf(app.stage) >= stages.indexOf("SUBMITTED_TO_UNIVERSITY");
  const whatsapp = Boolean(whatsappNumber(app.student.phone ?? app.student.user.phone));

  const details = [
    ["Student", <Link key="s" href={`/dashboard/students/${app.student.id}`} className="text-brand-700 hover:underline">{app.student.user.name}</Link>],
    ["University", <Link key="u" href={`/dashboard/universities/${app.course.university.id}`} className="text-brand-700 hover:underline">{app.course.university.name}</Link>],
    ["Intake", app.intake ? `${app.intake.name} (starts ${formatDate(app.intake.startDate)})` : null],
    ["Deadline", app.intake?.applicationDeadline ? formatDate(app.intake.applicationDeadline) : null],
    ["Agent", app.agent?.user.name],
    ["Started by", app.submittedBy ? `${app.submittedBy.name} on ${formatDate(app.createdAt)}` : formatDate(app.createdAt)],
  ] as const;

  return (
    <>
      <div className="mt-2 flex flex-wrap items-center gap-3">
        <h1 className="text-3xl font-bold">{app.course.name}</h1>
        <Badge tone={stageTones[app.stage]}>{stageLabel(app.stage, confirmationName)}</Badge>
        <WhatsAppButton href={`/api/whatsapp?student=${app.student.id}`} enabled={whatsapp} purpose="student" />
      </div>
      {submitted && (
        <p role="status" className="mt-4 rounded-xl border border-emerald-500/25 bg-emerald-500/10 px-4 py-2.5 text-sm text-emerald-800">
          {submitted === "email" ? "Application emailed to the university and moved to Submitted." : "Submission recorded and the application moved to Submitted."}
        </p>
      )}
      {error === "has-commission" && (
        <p role="alert" className="mt-4 rounded-xl border border-red-500/25 bg-red-500/10 px-4 py-2.5 text-sm text-red-800">
          This application has commission records, so it cannot be deleted. Set it to Withdrawn instead.
        </p>
      )}

      {step >= 0 && (
        <ol className="mt-5 flex gap-1" aria-label="Progress">
          {path.map((s, i) => (
            <li key={s} title={stageLabel(s, confirmationName)} className={`h-2 flex-1 rounded-full ${i <= step ? "bg-brand-600" : "bg-brand-900/10"}`}>
              <span className="sr-only">{stageLabel(s, confirmationName)}{i <= step ? " (done)" : ""}</span>
            </li>
          ))}
        </ol>
      )}

      <div className="mt-6 grid items-start gap-6 lg:grid-cols-[1.5fr_1fr]">
        <div className="grid gap-6">
          <Card tone="solid">
            <dl className="grid gap-x-6 gap-y-3 sm:grid-cols-2">
              {details.map(([label, value]) => (
                <div key={label}>
                  <dt className="text-xs font-semibold uppercase tracking-wider text-muted">{label}</dt>
                  <dd className="mt-0.5">{value || <span className="text-muted">—</span>}</dd>
                </div>
              ))}
            </dl>
            <div className="mt-4">
              <HowToApply
                name={app.course.university.name}
                method={app.course.university.applicationMethod}
                url={app.course.university.applicationUrl}
                email={app.course.university.applicationEmail}
                notes={processNotes}
              />
              <Link href={`/dashboard/applications/${app.id}/submit`} className={buttonStyles({ size: "sm", className: "mt-3" })}>
                {stages.indexOf(app.stage) < stages.indexOf("SUBMITTED_TO_UNIVERSITY") ? "Prepare submission" : "Submission details and documents"}
              </Link>
            </div>
          </Card>

          <Card tone="solid">
            <div className="mb-4 flex flex-wrap items-baseline justify-between gap-2">
              <h2 className="flex items-center gap-1 text-xl font-bold">Documents <InfoTip text="Documents this university needs for this application. They are managed on the student's page, with all their other documents. Required ones must be approved or marked not needed before the application can be submitted." /></h2>
              {required.length > 0 && <span className="text-sm text-muted">{done} of {required.length} required approved</span>}
            </div>
            {app.documentRequests.length > 0 ? (
              <ul className="divide-y divide-brand-900/10">
                {app.documentRequests.map((r) => (
                  <li key={r.id} className="flex flex-wrap items-center justify-between gap-2 py-2 text-sm">
                    <span>{r.label}{!r.required && <span className="ml-2 text-xs text-muted">optional</span>}</span>
                    <Badge tone={requestStatusTones[r.status]}>{requestStatusLabels[r.status]}</Badge>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-muted">Nothing asked for yet.</p>
            )}
            <Link href={`/dashboard/students/${app.student.id}#docs-${app.id}`} className={buttonStyles({ variant: "glass", size: "sm", className: "mt-4" })}>
              {canEditDocs ? "Review and ask for documents" : "Open the documents"} →
            </Link>
          </Card>

          {showConditions && (
            <Card tone="solid">
              <h2 className="flex items-center gap-1 mb-1 text-xl font-bold">Offer conditions <InfoTip text="Conditions from a conditional offer, e.g. an English test score. The student sees them. Tick each off when met; the application can only move to Unconditional offer once all are met." /></h2>
              <p className="mb-4 text-xs text-muted">All must be met before moving to Unconditional offer. The student sees these.</p>
              <ul className="grid gap-2">
                {app.conditions.map((c) => (
                  <li key={c.id} className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-brand-900/10 px-3 py-2">
                    <span className="min-w-0 text-sm">
                      <span aria-hidden className={c.metAt ? "text-emerald-600" : "text-muted"}>{c.metAt ? "✓ " : "○ "}</span>
                      <span className={c.metAt ? "line-through decoration-brand-900/30" : ""}>{c.text}</span>
                      {c.metAt && <span className="block text-xs text-muted">Met {formatDate(c.metAt)}{c.metBy && `, ticked by ${c.metBy.name}`}</span>}
                    </span>
                    {canEdit && (
                      <span className="flex items-center gap-1">
                        <form action={setConditionMet.bind(null, app.id, c.id, !c.metAt)}>
                          <Button variant="ghost" size="sm">{c.metAt ? "Not met" : "Mark met"}</Button>
                        </form>
                        <DeleteButton action={deleteCondition.bind(null, app.id, c.id)} question="Remove this condition?" />
                      </span>
                    )}
                  </li>
                ))}
                {app.conditions.length === 0 && <li className="text-sm text-muted">No conditions recorded.</li>}
              </ul>
              {canEdit && !isClosed(app.stage) && <div className="mt-4"><ConditionForm key={app.conditions.length} applicationId={app.id} /></div>}
            </Card>
          )}

          <Card tone="solid">
            <h2 className="flex items-center gap-1 mb-4 text-xl font-bold">History <InfoTip text="Everything that happened to this application, newest first: stage moves, document requests, uploads, reviews, conditions, detail changes and WhatsApp chats. Nothing here can be edited or deleted. Items marked internal are hidden from the student." /></h2>
            <ApplicationTimeline events={app.events} confirmationName={confirmationName} staffView />
          </Card>

          {canSeeMoney && (
            <Card tone="solid">
              <h2 className="flex items-center gap-1 mb-1 text-xl font-bold">Commission <InfoTip text="Money for this application. University to NRC is what the university pays us; NRC to agent is what we owe the referring agent. Agents only see their own part." /></h2>
              <p className="mb-4 text-xs text-muted">Staff only. Agents see only what NRC owes them.</p>
              <ul className="grid gap-4">
                {commissions.map((c) => (
                  <li key={c.id} className="rounded-2xl border border-brand-900/10 p-4">
                    <div className="mb-2 flex flex-wrap items-center gap-2">
                      <span className="font-semibold">{directionLabels[c.direction]}</span>
                      <Badge tone={commissionStatusTones[c.status]}>{commissionStatusLabels[c.direction][c.status]}</Badge>
                      {c.ratePercent && <span className="text-xs text-muted">{c.ratePercent.toString()}% of tuition</span>}
                    </div>
                    {canEditMoney ? (
                      <CommissionRowForm row={{ id: c.id, direction: c.direction, amount: c.amount.toString(), currency: c.currency, status: c.status, note: c.note }} />
                    ) : (
                      <p className="text-sm">{formatMoney(Number(c.amount), c.currency)}{c.note && ` · ${c.note}`}</p>
                    )}
                  </li>
                ))}
                {commissions.length === 0 && <li className="text-sm text-muted">Nothing recorded yet.</li>}
              </ul>
              {canEditMoney && (
                <div className="mt-4 grid gap-3 border-t border-brand-900/10 pt-4">
                  <ExpectedCommissionsButton applicationId={app.id} />
                  <AddCommissionForm applicationId={app.id} hasAgent={Boolean(app.agentId)} currency={app.course.currency} />
                </div>
              )}
            </Card>
          )}

          <RemindersCard link={{ applicationId: app.id }} user={user} canEdit={canEdit} />

          <Card tone="solid">
            <h2 className="flex items-center gap-1 mb-1 text-xl font-bold">Notes <InfoTip text="Internal notes for staff. The student and agents never see these. Adding one is also recorded in the history." /></h2>
            <p className="mb-4 text-xs text-muted">Only staff see these notes.</p>
            {canEdit && <NoteForm key={app.notes.length} action={addApplicationNote} field={{ applicationId: app.id }} placeholder="Emailed admissions about the conditional offer…" />}
            <ol className="mt-5 grid gap-4">
              {app.notes.map((note) => (
                <li key={note.id} className="border-l-2 border-brand-600/25 pl-4">
                  <p className="text-xs text-muted">{dateTime.format(note.createdAt)} · {note.author?.name ?? "Someone"}</p>
                  <p className="mt-1 whitespace-pre-line">{note.body}</p>
                </li>
              ))}
              {app.notes.length === 0 && <li className="text-sm text-muted">No notes yet.</li>}
            </ol>
          </Card>
        </div>

        {canEdit && (
          <div className="grid gap-6 lg:sticky lg:top-6">
            <Card tone="solid" className="grid gap-6">
              <div>
                <h2 className="flex items-center gap-1 mb-4 text-xl font-bold">Move to a stage <InfoTip text="Only the stages allowed from where the application is now are listed: forward, back one step, or close it. Some moves need something first (approved documents, met conditions, the CAS number). The student is told about every move, along with your note." /></h2>
                <StageForm key={app.events.length} id={app.id} current={app.stage} track={path.map((s) => ({ value: s, label: stageLabel(s, confirmationName) }))} options={options} />
              </div>
              <div className="border-t border-brand-900/10 pt-5">
                <AssignForm key={app.assignedStaffId ?? "none"} id={app.id} assignedStaffId={app.assignedStaffId} staff={people.staff} />
              </div>
            </Card>
            <Card tone="solid">
              <h2 className="flex items-center gap-1 mb-4 text-xl font-bold">Key details <InfoTip text="Reference numbers and the deposit, filled in as the application moves along. Every change is recorded in the history with the old and new value." /></h2>
              <DetailsForm
                key={app.updatedAt.getTime()}
                details={{
                  id: app.id,
                  universityRef: app.universityRef,
                  casNumber: app.casNumber,
                  visaReference: app.visaReference,
                  depositAmount: app.depositAmount?.toString() ?? null,
                  currency: app.course.currency,
                  confirmationName,
                }}
              />
            </Card>
            {user.role === "ADMIN" && (
              <Card tone="solid">
                <DeleteButton action={deleteApplication.bind(null, app.id)} question="Delete this application? For mistakes only; use Withdrawn otherwise." />
              </Card>
            )}
          </div>
        )}
      </div>
    </>
  );
}
