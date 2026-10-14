import type { Metadata } from "next";
import { Suspense } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { db } from "@/lib/db";
import { formatDate } from "@/lib/format";
import { can, requirePermission } from "@/lib/session";
import { decideAgent } from "../actions";
import { roleLabels, statusLabels, statusTones } from "../labels";
import { AccessForm, PermissionsForm } from "../user-forms";
import type { PermissionLevel } from "../user-forms";

export const metadata: Metadata = { title: "User", robots: { index: false } };

export default function UserPage({ params }: PageProps<"/dashboard/users/[id]">) {
  return (
    <>
      <Link href="/dashboard/users" className="text-sm font-medium text-brand-700 hover:underline">
        ← Users
      </Link>
      <Suspense fallback={<Card tone="solid" className="mt-6">Loading…</Card>}>
        <UserDetail params={params} />
      </Suspense>
    </>
  );
}

async function UserDetail({ params }: Pick<PageProps<"/dashboard/users/[id]">, "params">) {
  const viewer = await requirePermission("USERS", "view");
  const isAdmin = viewer.role === "ADMIN";
  const canApprove = await can(viewer, "AGENTS", "edit");

  const { id } = await params;
  const user = await db.user.findUnique({
    where: { id },
    include: {
      staffPermissions: true,
      agentProfile: { include: { country: { select: { name: true } }, approvedBy: { select: { name: true } } } },
    },
  });
  if (!user) notFound();

  const levels: Record<string, PermissionLevel> = Object.fromEntries(
    user.staffPermissions.map((p) => [p.module, !p.canView ? "none" : p.canEdit ? "edit" : "view"]),
  );
  const agent = user.agentProfile;

  return (
    <>
      <div className="mt-2 flex flex-wrap items-center gap-3">
        <h1 className="text-3xl font-bold">{user.name}</h1>
        <Badge tone="neutral">{roleLabels[user.role]}</Badge>
        <Badge tone={statusTones[user.status]}>{statusLabels[user.status]}</Badge>
      </div>
      <p className="mt-1 text-muted">
        {user.email}
        {user.phone && ` · ${user.phone}`} · joined {formatDate(user.createdAt)}
      </p>

      <div className="mt-8 grid items-start gap-6 lg:grid-cols-2">
        {isAdmin ? (
          <Card tone="solid">
            <h2 className="mb-4 text-xl font-bold">Role and status</h2>
            <AccessForm key={`${user.role}-${user.status}`} id={user.id} role={user.role} status={user.status} />
          </Card>
        ) : (
          <Card tone="solid">Only administrators can change roles, status and module access.</Card>
        )}

        {isAdmin && user.role === "STAFF" && (
          <Card tone="solid">
            <h2 className="text-xl font-bold">Module access</h2>
            <p className="mb-4 mt-1 text-sm text-muted">Staff can view and edit everything unless limited here.</p>
            <PermissionsForm id={user.id} levels={levels} />
          </Card>
        )}

        {agent && (
          <Card tone="solid">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-xl font-bold">Agent application</h2>
              <Badge tone={agent.approvalStatus === "APPROVED" ? "success" : agent.approvalStatus === "REJECTED" ? "danger" : "accent"}>
                {agent.approvalStatus === "APPROVED" ? "Approved" : agent.approvalStatus === "REJECTED" ? "Rejected" : "Waiting"}
              </Badge>
            </div>
            <dl className="mt-4 grid gap-2 text-sm">
              {agent.companyName && <div><dt className="inline font-semibold">Company: </dt><dd className="inline">{agent.companyName}</dd></div>}
              {agent.country && <div><dt className="inline font-semibold">Works in: </dt><dd className="inline">{agent.country.name}</dd></div>}
              {agent.address && <div><dt className="inline font-semibold">Address: </dt><dd className="inline">{agent.address}</dd></div>}
              {agent.about && <div><dt className="font-semibold">About</dt><dd className="mt-1 whitespace-pre-line text-muted">{agent.about}</dd></div>}
              {agent.approvedBy && agent.approvedAt && (
                <div className="text-muted">Decided by {agent.approvedBy.name} on {formatDate(agent.approvedAt)}</div>
              )}
            </dl>
            {canApprove && (
              <div className="mt-4 flex gap-2">
                {agent.approvalStatus !== "APPROVED" && (
                  <form action={decideAgent.bind(null, user.id, "APPROVED")}>
                    <Button size="sm">Approve</Button>
                  </form>
                )}
                {agent.approvalStatus !== "REJECTED" && (
                  <form action={decideAgent.bind(null, user.id, "REJECTED")}>
                    <Button size="sm" variant="ghost" className="text-red-700 hover:bg-red-500/10">Reject</Button>
                  </form>
                )}
              </div>
            )}
          </Card>
        )}
      </div>
    </>
  );
}
