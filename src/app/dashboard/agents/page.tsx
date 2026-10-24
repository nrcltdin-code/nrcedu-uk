import type { Metadata } from "next";
import { Suspense } from "react";
import Link from "next/link";
import { PageHeader } from "@/components/dashboard/page-header";
import { Badge } from "@/components/ui/badge";
import { buttonStyles } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { db } from "@/lib/db";
import { formatDate } from "@/lib/format";
import { requirePermission } from "@/lib/session";
import type { ApprovalStatus } from "@/generated/prisma/client";

export const metadata: Metadata = { title: "Agents", robots: { index: false } };

const tabs: { status: ApprovalStatus; label: string }[] = [
  { status: "PENDING", label: "Waiting" },
  { status: "CHANGES_REQUESTED", label: "Changes asked" },
  { status: "APPROVED", label: "Approved" },
  { status: "REJECTED", label: "Rejected" },
];

export default function AgentsPage({ searchParams }: PageProps<"/dashboard/agents">) {
  return (
    <>
      <PageHeader title="Agents" description="Individual agents and agencies who refer students to NRC. They register on the Become an Agent page, upload verification documents, and you review them here." />
      <Suspense fallback={<Card tone="solid">Loading agents…</Card>}>
        <AgentsList searchParams={searchParams} />
      </Suspense>
    </>
  );
}

async function AgentsList({ searchParams }: Pick<PageProps<"/dashboard/agents">, "searchParams">) {
  await requirePermission("AGENTS", "view");

  const { status: raw } = await searchParams;
  const status = tabs.find((tab) => tab.status === raw)?.status ?? "PENDING";

  const [counts, agents] = await Promise.all([
    db.agentProfile.groupBy({ by: ["approvalStatus"], _count: true }),
    db.agentProfile.findMany({
      where: { approvalStatus: status },
      orderBy: { createdAt: status === "PENDING" ? "asc" : "desc" },
      include: {
        user: { select: { id: true, name: true, email: true } },
        country: { select: { name: true } },
        approvedBy: { select: { name: true } },
        _count: { select: { students: true, verification: true, team: true } },
      },
    }),
  ]);
  const countOf = (s: ApprovalStatus) => counts.find((c) => c.approvalStatus === s)?._count ?? 0;
  const upgrades = await db.agentProfile.count({ where: { upgradeStatus: "PENDING" } });

  return (
    <>
      <div className="mb-6 flex flex-wrap gap-2">
        {tabs.map((tab) => (
          <Link
            key={tab.status}
            href={`/dashboard/agents?status=${tab.status}`}
            className={
              tab.status === status
                ? "rounded-full bg-brand-600 px-4 py-2 text-sm font-semibold text-white"
                : "glass rounded-full px-4 py-2 text-sm font-semibold text-brand-800 hover:bg-white/75"
            }
          >
            {tab.label} ({countOf(tab.status)})
          </Link>
        ))}
      </div>

      {upgrades > 0 && status !== "APPROVED" && (
        <p role="status" className="mb-4 rounded-xl border border-brand-600/20 bg-brand-600/8 px-4 py-3">
          {upgrades === 1 ? "1 approved agent wants" : `${upgrades} approved agents want`} to become an agency. <Link href="/dashboard/agents?status=APPROVED" className="font-semibold text-brand-700 hover:underline">See Approved</Link>
        </p>
      )}
      {agents.length === 0 && <Card tone="solid">No agents here.</Card>}

      <ul className="grid gap-4 xl:grid-cols-2">
        {agents.map((agent) => (
          <li key={agent.id}>
            <Card tone="solid" className="h-full">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  <Link href={`/dashboard/agents/${agent.id}`} className="font-display text-lg font-bold hover:underline">
                    {agent.companyName || agent.user.name}
                  </Link>
                  <p className="text-sm text-muted">
                    {[agent.kind === "AGENCY" ? `Agency${agent._count.team ? `, ${agent._count.team} staff` : ""}` : "Individual", agent.companyName && agent.user.name, agent.country?.name].filter(Boolean).join(" · ")}
                  </p>
                </div>
                {agent.upgradeStatus === "PENDING" && <Badge tone="accent">Wants to become an agency</Badge>}
                <Badge tone={status === "PENDING" && !agent.submittedAt ? "neutral" : "accent"}>
                  {status === "PENDING" ? (agent.submittedAt ? `Sent ${formatDate(agent.submittedAt)}` : "Still uploading") : `Registered ${formatDate(agent.createdAt)}`}
                </Badge>
              </div>

              <p className="mt-3 text-sm">
                <a href={`mailto:${agent.user.email}`} className="text-brand-700 hover:underline">{agent.user.email}</a>
                {agent.phone && <> · <a href={`tel:${agent.phone}`} className="text-brand-700 hover:underline">{agent.phone}</a></>}
              </p>
              {agent.about && <p className="mt-3 line-clamp-4 whitespace-pre-line text-sm text-muted">{agent.about}</p>}

              {status !== "PENDING" && (
                <p className="mt-3 text-xs text-muted">
                  {agent.approvedBy && agent.approvedAt && `${status === "APPROVED" ? "Approved" : "Rejected"} by ${agent.approvedBy.name} on ${formatDate(agent.approvedAt)}`}
                  {status === "APPROVED" && ` · ${agent._count.students} referred students`}
                </p>
              )}

              <div className="mt-4 flex items-center gap-3">
                <Link href={`/dashboard/agents/${agent.id}`} className={buttonStyles({ size: "sm", variant: status === "APPROVED" ? "glass" : "primary" })}>
                  {status === "APPROVED" ? "Open" : "Review"}
                </Link>
                <span className="text-xs text-muted">{agent._count.verification} documents</span>
              </div>
            </Card>
          </li>
        ))}
      </ul>
    </>
  );
}
