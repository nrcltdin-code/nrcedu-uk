import type { Metadata } from "next";
import { Suspense } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { DeleteButton } from "@/components/dashboard/form-bits";
import { NoteForm } from "@/components/dashboard/note-form";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import type { LeadStatus } from "@/generated/prisma/client";
import { db } from "@/lib/db";
import { can, requirePermission } from "@/lib/session";
import { Button, buttonStyles } from "@/components/ui/button";
import { convertLead } from "../../students/actions";
import { addLeadNote, deleteLead } from "../actions";
import { leadSourceLabels, leadStatusLabels, leadStatusTones, studyLevelLabels } from "../labels";
import { LeadUpdateForm } from "../lead-forms";
import { getAssigneeOptions } from "@/lib/assignees";

export const metadata: Metadata = { title: "Lead", robots: { index: false } };

const dateTime = new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit", timeZone: "Europe/London" });

export default function LeadPage({ params, searchParams }: PageProps<"/dashboard/leads/[id]">) {
  return (
    <>
      <Link href="/dashboard/leads" className="text-sm font-medium text-brand-700 hover:underline">
        ← Leads
      </Link>
      <Suspense fallback={<Card tone="solid" className="mt-6">Loading…</Card>}>
        <LeadDetail params={params} searchParams={searchParams} />
      </Suspense>
    </>
  );
}

type Change = { from: string | null; to: string | null };

async function LeadDetail({ params, searchParams }: Pick<PageProps<"/dashboard/leads/[id]">, "params" | "searchParams">) {
  const user = await requirePermission("LEADS", "view");
  const [canEdit, canConvert] = await Promise.all([can(user, "LEADS", "edit"), can(user, "STUDENTS", "edit")]);

  const [{ id }, { error }] = await Promise.all([params, searchParams]);
  const lead = await db.lead.findUnique({
    where: { id },
    include: {
      country: { select: { name: true } },
      destination: { select: { name: true } },
      assignedStaff: { select: { name: true } },
      assignedAgent: { select: { user: { select: { name: true } } } },
      notes: { orderBy: { createdAt: "desc" }, include: { author: { select: { name: true } } } },
    },
  });
  if (!lead) notFound();

  const [options, logs] = await Promise.all([
    getAssigneeOptions(),
    db.activityLog.findMany({
      where: { entityType: "Lead", entityId: id },
      orderBy: { createdAt: "desc" },
      take: 50,
      include: { user: { select: { name: true } } },
    }),
  ]);

  // Names for ids in the history, including people who have since left the dropdowns.
  const ids = new Set<string>();
  for (const entry of logs) {
    const meta = (entry.meta ?? {}) as Record<string, Change>;
    for (const key of ["assignedStaffId", "assignedAgentId"]) {
      if (meta[key]?.from) ids.add(meta[key].from!);
      if (meta[key]?.to) ids.add(meta[key].to!);
    }
  }
  const [people, agentPeople] = await Promise.all([
    db.user.findMany({ where: { id: { in: [...ids] } }, select: { id: true, name: true } }),
    db.agentProfile.findMany({ where: { id: { in: [...ids] } }, select: { id: true, user: { select: { name: true } } } }),
  ]);
  const nameOf = (value: string | null) =>
    !value ? "nobody" : (people.find((p) => p.id === value)?.name ?? agentPeople.find((a) => a.id === value)?.user.name ?? "a removed user");

  const describe = (action: string, meta: Record<string, Change>) => {
    if (action === "lead.create") return "added this lead";
    const parts: string[] = [];
    if (meta.status) parts.push(`moved it from ${leadStatusLabels[meta.status.from as LeadStatus]} to ${leadStatusLabels[meta.status.to as LeadStatus]}`);
    if (meta.assignedStaffId) parts.push(`assigned it to ${nameOf(meta.assignedStaffId.to)}`);
    if (meta.assignedAgentId) parts.push(`set the agent to ${nameOf(meta.assignedAgentId.to)}`);
    return parts.join(", ") || "updated it";
  };

  const timeline = [
    ...lead.notes.map((n) => ({ id: n.id, at: n.createdAt, who: n.author?.name ?? "Someone", note: n.body, text: null as string | null })),
    ...logs.map((l) => ({ id: l.id, at: l.createdAt, who: l.user?.name ?? "Someone", note: null as string | null, text: describe(l.action, (l.meta ?? {}) as Record<string, Change>) })),
    { id: "received", at: lead.createdAt, who: null, note: null, text: `Received from the ${leadSourceLabels[lead.source].toLowerCase()}` },
  ].sort((a, b) => b.at.getTime() - a.at.getTime());

  const details = [
    ["Email", <a key="e" href={`mailto:${lead.email}`} className="text-brand-700 hover:underline">{lead.email}</a>],
    ["Phone", lead.phone ? <a key="p" href={`tel:${lead.phone.replace(/[^\d+]/g, "")}`} className="text-brand-700 hover:underline">{lead.phone}</a> : null],
    ["Lives in", lead.country?.name],
    ["Wants to study in", lead.destination?.name],
    ["Study level", lead.studyLevel ? studyLevelLabels[lead.studyLevel] : null],
    ["Source", leadSourceLabels[lead.source]],
    ["Received", dateTime.format(lead.createdAt)],
  ] as const;

  return (
    <>
      <div className="mt-2 flex flex-wrap items-center gap-3">
        <h1 className="text-3xl font-bold">{lead.name}</h1>
        <Badge tone={leadStatusTones[lead.status]}>{leadStatusLabels[lead.status]}</Badge>
      </div>

      <div className="mt-6 grid items-start gap-6 lg:grid-cols-[1.5fr_1fr]">
        <div className="grid gap-6">
          <Card tone="solid">
            <dl className="grid gap-x-6 gap-y-3 sm:grid-cols-2">
              {details.map(([label, value]) => (
                <div key={label}>
                  <dt className="text-xs font-semibold uppercase tracking-wider text-muted">{label}</dt>
                  <dd className="mt-0.5 break-words">{value || <span className="text-muted">—</span>}</dd>
                </div>
              ))}
            </dl>
            {lead.message && (
              <div className="mt-5 border-t border-brand-900/10 pt-4">
                <h2 className="text-xs font-semibold uppercase tracking-wider text-muted">Their message</h2>
                <p className="mt-1 whitespace-pre-line">{lead.message}</p>
              </div>
            )}
          </Card>

          <Card tone="solid">
            <h2 className="mb-4 text-xl font-bold">Notes and history</h2>
            {canEdit && <NoteForm key={lead.notes.length} action={addLeadNote} field={{ leadId: lead.id }} />}
            <ol className="mt-5 grid gap-4">
              {timeline.map((item) => (
                <li key={item.id} className="border-l-2 border-brand-600/25 pl-4">
                  <p className="text-xs text-muted">
                    {dateTime.format(item.at)}
                    {item.who && ` · ${item.who}`}
                  </p>
                  {item.note ? <p className="mt-1 whitespace-pre-line">{item.note}</p> : <p className="mt-1 text-sm text-muted">{item.text}</p>}
                </li>
              ))}
            </ol>
          </Card>
        </div>

        <Card tone="solid">
          <h2 className="mb-4 text-xl font-bold">Status and owner</h2>
          {canEdit ? (
            <LeadUpdateForm lead={lead} staff={options.staff} agents={options.agents} />
          ) : (
            <p className="text-sm">
              Counsellor: {lead.assignedStaff?.name ?? "not assigned"}
              <br />
              Agent: {lead.assignedAgent?.user.name ?? "none"}
            </p>
          )}
          <div className="mt-5 border-t border-brand-900/10 pt-4">
            {lead.studentId ? (
              <Link href={`/dashboard/students/${lead.studentId}`} className={buttonStyles({ variant: "glass", size: "sm" })}>
                Open student record
              </Link>
            ) : canConvert ? (
              <form action={convertLead.bind(null, lead.id)}>
                <Button size="sm">Convert to student</Button>
                <p className="mt-2 text-xs text-muted">Creates a student record with this person&apos;s details and marks the lead Converted.</p>
              </form>
            ) : null}
            {error === "email-taken" && (
              <p role="alert" className="mt-3 rounded-xl border border-red-500/25 bg-red-500/10 px-3 py-2 text-sm text-red-800">
                This email belongs to a staff or agent account, so it cannot become a student.
              </p>
            )}
          </div>
          {canEdit && user.role === "ADMIN" && (
            <div className="mt-4">
              <DeleteButton action={deleteLead.bind(null, lead.id)} question="Delete this lead and its notes? Use this for spam and duplicates." />
            </div>
          )}
        </Card>
      </div>
    </>
  );
}
