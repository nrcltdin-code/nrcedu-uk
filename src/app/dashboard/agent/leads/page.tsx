import type { Metadata } from "next";
import { Suspense } from "react";
import Link from "next/link";
import { PageHeader } from "@/components/dashboard/page-header";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/field";
import { InfoTip } from "@/components/ui/info-tip";
import type { LeadStatus, Prisma } from "@/generated/prisma/client";
import { requireAgentScope } from "@/lib/agent";
import { db } from "@/lib/db";
import { formatDate } from "@/lib/format";
import { leadStatuses, leadStatusLabels, leadStatusTones, studyLevelLabels } from "../../leads/labels";
import { AddLeadForm } from "./lead-forms";

export const metadata: Metadata = { title: "Leads", robots: { index: false } };

export default function AgentLeadsPage({ searchParams }: PageProps<"/dashboard/agent/leads">) {
  return (
    <>
      <PageHeader title="Leads" description="People interested in studying abroad: ones NRC routes to you from your country and ones you add. Follow up, keep notes, and turn them into students." />
      <Suspense fallback={<Card tone="solid">Loading…</Card>}>
        <AgentLeads searchParams={searchParams} />
      </Suspense>
    </>
  );
}

const first = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v) ?? "";

async function AgentLeads({ searchParams }: Pick<PageProps<"/dashboard/agent/leads">, "searchParams">) {
  const scope = await requireAgentScope("LEADS");
  const params = await searchParams;
  const status = first(params.status);
  const due = first(params.due) === "1";
  const q = first(params.q).trim();
  const now = new Date();

  const where: Prisma.LeadWhereInput = {
    ...scope.leads,
    ...(status in leadStatusLabels ? { status: status as LeadStatus } : status === "" && !due ? { status: { notIn: ["CONVERTED", "LOST"] } } : {}),
    ...(due && { status: { notIn: ["CONVERTED", "LOST"] }, followUpAt: { lte: now } }),
    ...(q && { OR: [{ name: { contains: q, mode: "insensitive" } }, { email: { contains: q, mode: "insensitive" } }, { phone: { contains: q } }] }),
  };
  const [leads, counts, dueCount, countries] = await Promise.all([
    db.lead.findMany({
      where,
      orderBy: [{ followUpAt: { sort: "asc", nulls: "last" } }, { createdAt: "desc" }],
      take: 200,
      select: {
        id: true,
        name: true,
        email: true,
        status: true,
        source: true,
        followUpAt: true,
        createdAt: true,
        studyLevel: true,
        destination: { select: { name: true } },
        agentUser: { select: { id: true, name: true } },
      },
    }),
    db.lead.groupBy({ by: ["status"], where: scope.leads, _count: true }),
    db.lead.count({ where: { ...scope.leads, status: { notIn: ["CONVERTED", "LOST"] }, followUpAt: { lte: now } } }),
    db.country.findMany({ orderBy: { name: "asc" }, select: { id: true, name: true } }),
  ]);
  const countOf = (s: LeadStatus) => counts.find((c) => c.status === s)?._count ?? 0;
  const tabs = [
    { href: "/dashboard/agent/leads", label: "Open", count: countOf("NEW") + countOf("CONTACTED") + countOf("QUALIFIED"), active: status === "" && !due },
    { href: "/dashboard/agent/leads?due=1", label: "Follow-up due", count: dueCount, active: due },
    ...leadStatuses.map((s) => ({ href: `/dashboard/agent/leads?status=${s}`, label: leadStatusLabels[s], count: countOf(s), active: status === s })),
  ];

  return (
    <div className="grid items-start gap-8 xl:grid-cols-[1.8fr_1fr]">
      <div className="min-w-0">
        <nav className="mb-4 flex flex-wrap gap-2" aria-label="Filter">
          {tabs.map((t) => (
            <Link key={t.href} href={t.href} aria-current={t.active ? "page" : undefined}
              className={t.active ? "rounded-full bg-brand-600 px-4 py-2 text-sm font-semibold text-white" : "glass rounded-full px-4 py-2 text-sm font-semibold text-brand-800 hover:bg-white/75"}>
              {t.label} ({t.count})
            </Link>
          ))}
        </nav>
        <form className="mb-4">
          {status && <input type="hidden" name="status" value={status} />}
          <Input name="q" defaultValue={q} placeholder="Search name, email or phone" aria-label="Search leads" />
        </form>
        <Card tone="solid" className="p-0">
          <ul className="divide-y divide-brand-900/10">
            {leads.map((l) => {
              const overdue = l.followUpAt && l.followUpAt <= now && l.status !== "CONVERTED" && l.status !== "LOST";
              return (
                <li key={l.id}>
                  <Link href={`/dashboard/agent/leads/${l.id}`} className="flex flex-wrap items-center justify-between gap-2 px-5 py-3 hover:bg-brand-600/5">
                    <span className="min-w-0">
                      <span className="block font-semibold">{l.name}</span>
                      <span className="block truncate text-sm text-muted">
                        {[l.email, l.studyLevel && studyLevelLabels[l.studyLevel], l.destination?.name, l.source === "AGENT" ? "added by you" : "from NRC", scope.can("ALL_STUDENTS") && l.agentUser ? l.agentUser.name : null].filter(Boolean).join(" · ")}
                      </span>
                    </span>
                    <span className="flex items-center gap-2">
                      {l.followUpAt && <span className={`text-xs ${overdue ? "font-semibold text-red-700" : "text-muted"}`}>follow up {formatDate(l.followUpAt)}</span>}
                      <Badge tone={leadStatusTones[l.status]}>{leadStatusLabels[l.status]}</Badge>
                    </span>
                  </Link>
                </li>
              );
            })}
            {leads.length === 0 && <li className="p-5 text-muted">No leads here.</li>}
          </ul>
        </Card>
      </div>
      <Card tone="solid">
        <h2 className="mb-4 flex items-center gap-1 text-xl font-bold">Add a lead <InfoTip text="Someone you are talking to who has not applied yet. Set a follow-up date to have them show under Follow-up due. When they are ready, turn them into a student from the lead's page." /></h2>
        <AddLeadForm countries={countries} levels={Object.entries(studyLevelLabels).map(([value, label]) => ({ value, label }))} />
      </Card>
    </div>
  );
}
