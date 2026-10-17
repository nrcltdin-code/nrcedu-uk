import type { Metadata } from "next";
import { Suspense } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { NoteForm } from "@/components/dashboard/note-form";
import { PageHeader } from "@/components/dashboard/page-header";
import { WhatsAppLink } from "@/components/dashboard/whatsapp-link";
import { Badge } from "@/components/ui/badge";
import { Button, buttonStyles } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { InfoTip } from "@/components/ui/info-tip";
import { agencyPeople, requireAgentScope } from "@/lib/agent";
import { db } from "@/lib/db";
import { formatDate } from "@/lib/format";
import { leadStatusLabels, leadStatusTones, studyLevelLabels } from "../../../leads/labels";
import { addAgentLeadNote, convertAgentLead } from "../actions";
import { LeadStatusForm } from "../lead-forms";

export const metadata: Metadata = { title: "Lead", robots: { index: false } };

const dateTime = new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit", timeZone: "Europe/London" });
// For a datetime-local input, in London time.
const localInput = (date: Date | null) => {
  if (!date) return "";
  const parts = Object.fromEntries(new Intl.DateTimeFormat("en-GB", { timeZone: "Europe/London", year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", hourCycle: "h23" }).formatToParts(date).map((p) => [p.type, p.value]));
  return `${parts.year}-${parts.month}-${parts.day}T${parts.hour}:${parts.minute}`;
};

const errors: Record<string, string> = {
  known: "This person is already registered with NRC, so they cannot be added as your student. Contact NRC if they should be linked to you.",
  "no-access": "You do not have access to add students. Ask the agency owner.",
};

export default function AgentLeadPage({ params, searchParams }: PageProps<"/dashboard/agent/leads/[id]">) {
  return (
    <Suspense fallback={<Card tone="solid">Loading…</Card>}>
      <AgentLead params={params} searchParams={searchParams} />
    </Suspense>
  );
}

async function AgentLead({ params, searchParams }: PageProps<"/dashboard/agent/leads/[id]">) {
  const scope = await requireAgentScope("LEADS");
  const [{ id }, { error }] = await Promise.all([params, searchParams]);
  const lead = await db.lead.findFirst({
    where: { id, ...scope.leads },
    include: {
      country: { select: { name: true } },
      destination: { select: { name: true } },
      agentUser: { select: { name: true } },
      // Only the agency's own notes; NRC staff notes on the lead stay internal.
      notes: { where: { agentId: scope.agentId }, orderBy: { createdAt: "desc" }, include: { author: { select: { name: true } } } },
    },
  });
  if (!lead) notFound();
  const people = scope.can("ALL_STUDENTS") ? await agencyPeople(scope) : [];
  const errorText = typeof error === "string" ? errors[error] : undefined;

  const details = [
    ["Email", <a key="e" href={`mailto:${lead.email}`} className="text-brand-700 hover:underline">{lead.email}</a>],
    ["Phone", lead.phone && <span key="p" className="flex flex-wrap items-center gap-2">{lead.phone}<WhatsAppLink phone={lead.phone} message={`Hello ${lead.name.split(" ")[0]}, `} /></span>],
    ["Lives in", lead.country?.name],
    ["Wants to study in", lead.destination?.name],
    ["Study level", lead.studyLevel && studyLevelLabels[lead.studyLevel]],
    ["Came from", lead.source === "AGENT" ? "Added by your agency" : "Routed to you by NRC"],
    ["Handled by", lead.agentUser?.name],
    ["Added", formatDate(lead.createdAt)],
  ] as const;

  return (
    <>
      <PageHeader title={lead.name} back={{ href: "/dashboard/agent/leads", label: "Leads" }} actions={<Badge tone={leadStatusTones[lead.status]}>{leadStatusLabels[lead.status]}</Badge>} />
      {errorText && <p role="alert" className="mb-6 rounded-xl border border-red-500/25 bg-red-500/10 px-4 py-2.5 text-sm text-red-800">{errorText}</p>}
      <div className="grid items-start gap-6 lg:grid-cols-[1.5fr_1fr]">
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
            {lead.message && <p className="mt-4 whitespace-pre-line rounded-xl bg-brand-600/5 px-4 py-3 text-sm">{lead.message}</p>}
          </Card>
          <Card tone="solid">
            <h2 className="mb-4 flex items-center gap-1 text-xl font-bold">Notes <InfoTip text="Calls, messages and anything worth remembering. Your agency sees these; NRC staff can too. The student never does." /></h2>
            <NoteForm key={lead.notes.length} action={addAgentLeadNote} field={{ leadId: lead.id }} placeholder="Called, interested in UK master's for September…" />
            <ol className="mt-5 grid gap-4">
              {lead.notes.map((note) => (
                <li key={note.id} className="border-l-2 border-brand-600/25 pl-4">
                  <p className="text-xs text-muted">{dateTime.format(note.createdAt)} · {note.author?.name ?? "Someone"}</p>
                  <p className="mt-1 whitespace-pre-line">{note.body}</p>
                </li>
              ))}
              {lead.notes.length === 0 && <li className="text-sm text-muted">No notes yet.</li>}
            </ol>
          </Card>
        </div>
        <div className="grid gap-6">
          <Card tone="solid">
            <h2 className="mb-4 flex items-center gap-1 text-xl font-bold">Status and follow-up <InfoTip text="Move the lead along as you talk to them. A follow-up date puts them on your Follow-up due list on that day." /></h2>
            <LeadStatusForm
              key={`${lead.status}-${lead.followUpAt?.getTime()}`}
              lead={{ id: lead.id, status: lead.status, followUpAt: localInput(lead.followUpAt), agentUserId: lead.agentUserId, converted: lead.status === "CONVERTED" }}
              statuses={(["NEW", "CONTACTED", "QUALIFIED", "LOST"] as const).map((s) => ({ value: s, label: leadStatusLabels[s] }))}
              people={people}
            />
          </Card>
          <Card tone="solid">
            <h2 className="mb-3 flex items-center gap-1 text-xl font-bold">Student <InfoTip text="When they are ready to apply, make them your student. They get a student record with NRC, and you can then add documents and start applications." /></h2>
            {lead.studentId ? (
              <Link href={`/dashboard/agent/students/${lead.studentId}`} className={buttonStyles({ variant: "glass" })}>Open student</Link>
            ) : scope.can("APPLICATIONS") ? (
              <form action={convertAgentLead.bind(null, lead.id)}>
                <Button>Make them my student</Button>
              </form>
            ) : (
              <p className="text-sm text-muted">Ask the agency owner for Applications access to add students.</p>
            )}
          </Card>
        </div>
      </div>
    </>
  );
}
