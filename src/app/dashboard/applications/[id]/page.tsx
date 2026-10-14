import type { Metadata } from "next";
import { Suspense } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { DeleteButton } from "@/components/dashboard/form-bits";
import { NoteForm } from "@/components/dashboard/note-form";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { getAssigneeOptions } from "@/lib/assignees";
import { db } from "@/lib/db";
import { formatDate, formatMoney } from "@/lib/format";
import { can, requirePermission } from "@/lib/session";
import { addApplicationNote, deleteApplication } from "../actions";
import { AssignForm, StageForm } from "../application-forms";
import { stageLabels, stageTones } from "../labels";
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
  const [canEdit, canSeeMoney, canEditMoney] = await Promise.all([
    can(user, "APPLICATIONS", "edit"),
    can(user, "COMMISSIONS", "view"),
    can(user, "COMMISSIONS", "edit"),
  ]);

  const [{ id }, { error }] = await Promise.all([params, searchParams]);
  const app = await db.application.findUnique({
    where: { id },
    include: {
      student: { select: { id: true, user: { select: { name: true, email: true } } } },
      course: { select: { name: true, level: true, currency: true, university: { select: { name: true } } } },
      intake: { select: { name: true, startDate: true, applicationDeadline: true } },
      agent: { select: { user: { select: { name: true } } } },
      submittedBy: { select: { name: true } },
      stageHistory: { orderBy: { createdAt: "desc" }, include: { changedBy: { select: { name: true } } } },
      notes: { orderBy: { createdAt: "desc" }, include: { author: { select: { name: true } } } },
    },
  });
  if (!app) notFound();
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

  const details = [
    ["Student", <Link key="s" href={`/dashboard/students/${app.student.id}`} className="text-brand-700 hover:underline">{app.student.user.name}</Link>],
    ["University", app.course.university.name],
    ["Intake", app.intake ? `${app.intake.name} (starts ${formatDate(app.intake.startDate)})` : null],
    ["Deadline", app.intake?.applicationDeadline ? formatDate(app.intake.applicationDeadline) : null],
    ["Agent", app.agent?.user.name],
    ["Started by", app.submittedBy ? `${app.submittedBy.name} on ${formatDate(app.createdAt)}` : formatDate(app.createdAt)],
  ] as const;

  return (
    <>
      <div className="mt-2 flex flex-wrap items-center gap-3">
        <h1 className="text-3xl font-bold">{app.course.name}</h1>
        <Badge tone={stageTones[app.stage]}>{stageLabels[app.stage]}</Badge>
      </div>
      {error === "has-commission" && (
        <p role="alert" className="mt-4 rounded-xl border border-red-500/25 bg-red-500/10 px-4 py-2.5 text-sm text-red-800">
          This application has commission records, so it cannot be deleted. Set it to Withdrawn instead.
        </p>
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
          </Card>

          <Card tone="solid">
            <h2 className="mb-4 text-xl font-bold">Stage history</h2>
            <ol className="grid gap-4">
              {app.stageHistory.map((h) => (
                <li key={h.id} className="border-l-2 border-brand-600/25 pl-4">
                  <p className="text-xs text-muted">{dateTime.format(h.createdAt)} · {h.changedBy?.name ?? "Someone"}</p>
                  <p className="mt-1"><Badge tone={stageTones[h.stage]}>{stageLabels[h.stage]}</Badge></p>
                  {h.note && <p className="mt-1 text-sm">{h.note}</p>}
                </li>
              ))}
            </ol>
          </Card>

          {canSeeMoney && (
            <Card tone="solid">
              <h2 className="mb-1 text-xl font-bold">Commission</h2>
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

          <Card tone="solid">
            <h2 className="mb-4 text-xl font-bold">Notes</h2>
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
          <Card tone="solid" className="grid gap-6">
            <div>
              <h2 className="mb-4 text-xl font-bold">Move to a stage</h2>
              <StageForm key={app.stageHistory.length} id={app.id} stage={app.stage} />
            </div>
            <div className="border-t border-brand-900/10 pt-5">
              <AssignForm id={app.id} assignedStaffId={app.assignedStaffId} staff={people.staff} />
            </div>
            {user.role === "ADMIN" && (
              <div className="border-t border-brand-900/10 pt-5">
                <DeleteButton action={deleteApplication.bind(null, app.id)} question="Delete this application? For mistakes only; use Withdrawn otherwise." />
              </div>
            )}
          </Card>
        )}
      </div>
    </>
  );
}
