import type { Metadata } from "next";
import { Suspense } from "react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { PageHeader } from "@/components/dashboard/page-header";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { InfoTip } from "@/components/ui/info-tip";
import { agentPermissionLabels, agentPermissions, requireAgentScope } from "@/lib/agent";
import { db } from "@/lib/db";
import { formatDate } from "@/lib/format";
import { AccessButton, AddTeamMemberForm, PermissionsForm, ReinviteButton } from "./team-forms";

export const metadata: Metadata = { title: "My team", robots: { index: false } };

export default function AgentTeamPage() {
  return (
    <>
      <PageHeader
        title="Team"
        description="People who work for your agency. Each signs in with their own account. Choose what each person can do; by default they only see the students they add themselves."
      />
      <Suspense fallback={<Card tone="solid">Loading…</Card>}>
        <AgentTeam />
      </Suspense>
    </>
  );
}

async function AgentTeam() {
  const scope = await requireAgentScope("TEAM");
  if (scope.kind !== "AGENCY") redirect("/dashboard");
  const members = await db.user.findMany({
    where: { agentTeamId: scope.agentId },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      name: true,
      email: true,
      status: true,
      agentPermissions: true,
      createdAt: true,
      accounts: { select: { id: true }, take: 1 },
      _count: { select: { addedStudents: true, submittedApps: true, agentLeads: true } },
    },
  });
  // Only the owner can give out Team access.
  const options = agentPermissions
    .filter((p) => scope.isOwner || p !== "TEAM")
    .map((p) => ({ value: p, ...agentPermissionLabels[p] }));

  return (
    <div className="grid items-start gap-8 xl:grid-cols-[1.8fr_1fr]">
      <Card tone="solid">
        <p className="text-sm text-muted">{members.length} {members.length === 1 ? "person" : "people"}</p>
        <ul className="mt-2 divide-y divide-brand-900/10">
          {members.map((m) => {
            const active = m.status === "ACTIVE";
            const joined = m.accounts.length > 0;
            const self = m.id === scope.userId;
            return (
              <li key={m.id} className="grid gap-3 py-4">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <span className="min-w-0">
                    <span className="block font-semibold">{m.name}{self && " (you)"}</span>
                    <span className="block truncate text-sm text-muted">{m.email} · added {formatDate(m.createdAt)}</span>
                    <span className="block text-sm">
                      <Link href={`/dashboard/agent/students?by=${m.id}`} className="text-brand-700 hover:underline">{m._count.addedStudents} students</Link>
                      {" · "}{m._count.submittedApps} applications · {m._count.agentLeads} leads
                    </span>
                  </span>
                  <Badge tone={!active ? "danger" : joined ? "success" : "accent"}>{!active ? "Access off" : joined ? "Active" : "Invite sent"}</Badge>
                </div>
                {!self && (
                  <>
                    <details>
                      <summary className="cursor-pointer text-sm font-semibold text-brand-700">
                        What they can do ({m.agentPermissions.length ? m.agentPermissions.map((p) => agentPermissionLabels[p].label).join(", ") : "only view their own students"})
                      </summary>
                      <div className="mt-3">
                        <PermissionsForm memberId={m.id} options={options} checked={m.agentPermissions} />
                      </div>
                    </details>
                    <div className="flex flex-wrap items-start gap-2">
                      {active && !joined && <ReinviteButton memberId={m.id} />}
                      <AccessButton memberId={m.id} active={active} />
                    </div>
                  </>
                )}
              </li>
            );
          })}
          {members.length === 0 && <li className="py-3 text-muted">No team members yet.</li>}
        </ul>
      </Card>
      <Card tone="solid">
        <h2 className="mb-4 flex items-center gap-1 text-xl font-bold">Add a team member <InfoTip text="They get an email to choose a password. Turning access off signs them out at once; the students they added stay with the agency." /></h2>
        <AddTeamMemberForm options={options} />
      </Card>
    </div>
  );
}
