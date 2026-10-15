import type { Metadata } from "next";
import { Suspense } from "react";
import Link from "next/link";
import { PageHeader } from "@/components/dashboard/page-header";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { requireAgentOwner } from "@/lib/agent";
import { db } from "@/lib/db";
import { formatDate } from "@/lib/format";
import { AccessButton, AddTeamMemberForm, ReinviteButton } from "./team-forms";

export const metadata: Metadata = { title: "My team", robots: { index: false } };

export default function AgentTeamPage() {
  return (
    <>
      <PageHeader
        title="My team"
        description="People who work for you. Each one signs in with their own account and sees only the students they add; you see all of them."
      />
      <Suspense fallback={<Card tone="solid">Loading…</Card>}>
        <AgentTeam />
      </Suspense>
    </>
  );
}

async function AgentTeam() {
  const scope = await requireAgentOwner();
  const members = await db.user.findMany({
    where: { agentTeamId: scope.agentId },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      name: true,
      email: true,
      status: true,
      createdAt: true,
      accounts: { select: { id: true }, take: 1 },
      _count: { select: { addedStudents: true } },
    },
  });

  return (
    <div className="grid items-start gap-8 xl:grid-cols-[1.8fr_1fr]">
      <Card tone="solid">
        <p className="text-sm text-muted">{members.length} {members.length === 1 ? "person" : "people"}</p>
        <ul className="mt-2 divide-y divide-brand-900/10">
          {members.map((m) => {
            const active = m.status === "ACTIVE";
            const joined = m.accounts.length > 0;
            return (
              <li key={m.id} className="grid gap-3 py-4">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <span className="min-w-0">
                    <span className="block font-semibold">{m.name}</span>
                    <span className="block truncate text-sm text-muted">{m.email} · added {formatDate(m.createdAt)}</span>
                    <Link href={`/dashboard/agent/students?by=${m.id}`} className="text-sm text-brand-700 hover:underline">
                      {m._count.addedStudents} {m._count.addedStudents === 1 ? "student" : "students"}
                    </Link>
                  </span>
                  <Badge tone={!active ? "danger" : joined ? "success" : "accent"}>{!active ? "Access off" : joined ? "Active" : "Invite sent"}</Badge>
                </div>
                <div className="flex flex-wrap items-start gap-2">
                  {active && !joined && <ReinviteButton memberId={m.id} />}
                  <AccessButton memberId={m.id} active={active} />
                </div>
              </li>
            );
          })}
          {members.length === 0 && <li className="py-3 text-muted">No team members yet.</li>}
        </ul>
      </Card>
      <Card tone="solid">
        <h2 className="mb-4 text-xl font-bold">Add a team member</h2>
        <AddTeamMemberForm />
      </Card>
    </div>
  );
}
