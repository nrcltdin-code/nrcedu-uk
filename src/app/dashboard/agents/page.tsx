import type { Metadata } from "next";
import { Suspense } from "react";
import Link from "next/link";
import { PageHeader } from "@/components/dashboard/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { db } from "@/lib/db";
import { formatDate } from "@/lib/format";
import { can, requirePermission } from "@/lib/session";
import type { ApprovalStatus } from "@/generated/prisma/client";
import { decideAgent } from "../users/actions";

export const metadata: Metadata = { title: "Agents", robots: { index: false } };

const tabs: { status: ApprovalStatus; label: string }[] = [
  { status: "PENDING", label: "Waiting" },
  { status: "APPROVED", label: "Approved" },
  { status: "REJECTED", label: "Rejected" },
];

export default function AgentsPage({ searchParams }: PageProps<"/dashboard/agents">) {
  return (
    <>
      <PageHeader title="Agents" description="Sub-agents who refer students to NRC. New applications come from the Become an Agent form." />
      <Suspense fallback={<Card tone="solid">Loading agents…</Card>}>
        <AgentsList searchParams={searchParams} />
      </Suspense>
    </>
  );
}

async function AgentsList({ searchParams }: Pick<PageProps<"/dashboard/agents">, "searchParams">) {
  const viewer = await requirePermission("AGENTS", "view");
  const canDecide = await can(viewer, "AGENTS", "edit");

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
        _count: { select: { students: true } },
      },
    }),
  ]);
  const countOf = (s: ApprovalStatus) => counts.find((c) => c.approvalStatus === s)?._count ?? 0;

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

      {agents.length === 0 && <Card tone="solid">No agents here.</Card>}

      <ul className="grid gap-4 xl:grid-cols-2">
        {agents.map((agent) => (
          <li key={agent.id}>
            <Card tone="solid" className="h-full">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  <Link href={`/dashboard/users/${agent.user.id}`} className="font-display text-lg font-bold hover:underline">
                    {agent.user.name}
                  </Link>
                  <p className="text-sm text-muted">
                    {[agent.companyName, agent.country?.name].filter(Boolean).join(" · ") || "No company given"}
                  </p>
                </div>
                <Badge tone="neutral">Applied {formatDate(agent.createdAt)}</Badge>
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

              {canDecide && (
                <div className="mt-4 flex gap-2">
                  {status !== "APPROVED" && (
                    <form action={decideAgent.bind(null, agent.user.id, "APPROVED")}>
                      <Button size="sm">Approve</Button>
                    </form>
                  )}
                  {status !== "REJECTED" && (
                    <form action={decideAgent.bind(null, agent.user.id, "REJECTED")}>
                      <Button size="sm" variant="ghost" className="text-red-700 hover:bg-red-500/10">
                        {status === "APPROVED" ? "Revoke" : "Reject"}
                      </Button>
                    </form>
                  )}
                </div>
              )}
            </Card>
          </li>
        ))}
      </ul>
    </>
  );
}
