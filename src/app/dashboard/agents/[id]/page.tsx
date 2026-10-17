import type { Metadata } from "next";
import { Suspense } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { PageHeader } from "@/components/dashboard/page-header";
import { Badge } from "@/components/ui/badge";
import { buttonStyles } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { InfoTip } from "@/components/ui/info-tip";
import { agentDocumentLabels, agentPermissionLabels, requiredAgentDocuments } from "@/lib/agent";
import { db } from "@/lib/db";
import { formatDate } from "@/lib/format";
import { can, requirePermission } from "@/lib/session";
import { AgentDecisionForm, AgentDocumentReview } from "../agent-review-forms";
import { approvalLabels, approvalTones } from "../labels";

export const metadata: Metadata = { title: "Agent", robots: { index: false } };

const docLabels = { PENDING: "To check", APPROVED: "Approved", REJECTED: "Sent back" } as const;
const docTones = { PENDING: "accent", APPROVED: "success", REJECTED: "danger" } as const;

export default function AgentReviewPage({ params }: PageProps<"/dashboard/agents/[id]">) {
  return (
    <Suspense fallback={<Card tone="solid">Loading…</Card>}>
      <AgentReview params={params} />
    </Suspense>
  );
}

async function AgentReview({ params }: Pick<PageProps<"/dashboard/agents/[id]">, "params">) {
  const viewer = await requirePermission("AGENTS", "view");
  const canDecide = await can(viewer, "AGENTS", "edit");
  const { id } = await params;
  const agent = await db.agentProfile.findUnique({
    where: { id },
    include: {
      user: { select: { id: true, name: true, email: true, phone: true } },
      country: { select: { name: true } },
      approvedBy: { select: { name: true } },
      verification: { orderBy: { createdAt: "desc" }, include: { reviewedBy: { select: { name: true } } } },
      team: { orderBy: { name: "asc" }, select: { id: true, name: true, email: true, status: true, agentPermissions: true } },
      _count: { select: { students: true, applications: true, leads: true } },
    },
  });
  if (!agent) notFound();
  const required = requiredAgentDocuments(agent.kind);
  const approvedTypes = new Set(agent.verification.filter((d) => d.status === "APPROVED").map((d) => d.type));

  const details = [
    ["Type", agent.kind === "AGENCY" ? "Agency" : "Individual agent"],
    ["Contact", agent.user.name],
    ["Email", <a key="e" href={`mailto:${agent.user.email}`} className="text-brand-700 hover:underline">{agent.user.email}</a>],
    ["Phone", agent.phone ?? agent.user.phone],
    ["Country", agent.country?.name],
    ["Address", agent.address],
    ["Registration number", agent.registrationNumber],
    ["Website", agent.website && <a key="w" href={agent.website} target="_blank" rel="noopener noreferrer" className="text-brand-700 hover:underline">{agent.website}</a>],
    ["Years recruiting", agent.yearsActive?.toString()],
    ["Students per year", agent.studentsPerYear?.toString()],
    ["Registered", formatDate(agent.createdAt)],
    ["Sent for review", agent.submittedAt && formatDate(agent.submittedAt)],
  ] as const;

  return (
    <>
      <PageHeader
        title={agent.companyName || agent.user.name}
        back={{ href: "/dashboard/agents", label: "Agents" }}
        actions={<Badge tone={approvalTones[agent.approvalStatus]}>{approvalLabels[agent.approvalStatus]}</Badge>}
      />
      <div className="grid items-start gap-6 lg:grid-cols-[1.5fr_1fr]">
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
            {agent.about && <p className="mt-4 whitespace-pre-line rounded-xl bg-brand-600/5 px-4 py-3 text-sm">{agent.about}</p>}
          </Card>

          <Card tone="solid">
            <h2 className="mb-4 flex items-center gap-1 text-xl font-bold">Verification documents <InfoTip text="Check each file against the profile. Sending one back tells the agent what to fix. The required ones must all be approved before you can approve the agent." /></h2>
            <ul className="mb-4 grid gap-1 text-sm">
              {required.map((t) => (
                <li key={t}><span aria-hidden className={approvedTypes.has(t) ? "text-emerald-600" : "text-muted"}>{approvedTypes.has(t) ? "✓ " : "○ "}</span>{agentDocumentLabels[t]} <span className="text-muted">(required)</span></li>
              ))}
            </ul>
            <ul className="divide-y divide-brand-900/10 border-t border-brand-900/10">
              {agent.verification.map((doc) => (
                <li key={doc.id} className="py-3">
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="font-semibold">{agentDocumentLabels[doc.type]}</p>
                      <p className="truncate text-sm text-muted">{doc.name} · {formatDate(doc.createdAt)}</p>
                      {doc.reviewNote && <p className="mt-1 text-sm">“{doc.reviewNote}”{doc.reviewedBy && <span className="text-muted"> — {doc.reviewedBy.name}</span>}</p>}
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge tone={docTones[doc.status]}>{docLabels[doc.status]}</Badge>
                      <a href={`/api/agent-documents/${doc.id}`} className={buttonStyles({ variant: "glass", size: "sm" })}>Download</a>
                    </div>
                  </div>
                  {canDecide && doc.status === "PENDING" && <AgentDocumentReview id={doc.id} />}
                </li>
              ))}
              {agent.verification.length === 0 && <li className="py-3 text-muted">Nothing uploaded yet.</li>}
            </ul>
          </Card>

          {agent.kind === "AGENCY" && (
            <Card tone="solid">
              <h2 className="mb-4 flex items-center gap-1 text-xl font-bold">Team ({agent.team.length}) <InfoTip text="People the agency added. The agency owner decides what each can do." /></h2>
              <ul className="divide-y divide-brand-900/10">
                {agent.team.map((m) => (
                  <li key={m.id} className="flex flex-wrap items-center justify-between gap-2 py-2.5">
                    <span className="min-w-0">
                      <Link href={`/dashboard/users/${m.id}`} className="font-semibold hover:underline">{m.name}</Link>
                      <span className="block text-xs text-muted">{m.agentPermissions.map((p) => agentPermissionLabels[p].label).join(", ") || "Own students only"}</span>
                    </span>
                    <Badge tone={m.status === "ACTIVE" ? "success" : "neutral"}>{m.status === "ACTIVE" ? "Active" : "Access off"}</Badge>
                  </li>
                ))}
                {agent.team.length === 0 && <li className="py-2 text-muted">No team members.</li>}
              </ul>
            </Card>
          )}
        </div>

        <div className="grid gap-6 lg:sticky lg:top-6">
          {agent.approvalStatus === "APPROVED" && (
            <Card tone="solid">
              <dl className="grid grid-cols-3 gap-3 text-center">
                {[["Students", agent._count.students], ["Applications", agent._count.applications], ["Leads", agent._count.leads]].map(([label, n]) => (
                  <div key={label}><dt className="text-xs text-muted">{label}</dt><dd className="font-display text-2xl font-bold">{n}</dd></div>
                ))}
              </dl>
            </Card>
          )}
          {canDecide && agent.approvalStatus !== "REJECTED" && (
            <Card tone="solid">
              <h2 className="mb-4 flex items-center gap-1 text-xl font-bold">Decision <InfoTip text="Approve gives the agent their full portal. Ask for changes sends them back to onboarding with your note. Reject (or Revoke) signs them out and locks the account. The agent is emailed in every case." /></h2>
              {agent.reviewNote && <p className="mb-3 text-sm text-muted">Last note: “{agent.reviewNote}”</p>}
              <AgentDecisionForm id={agent.id} approved={agent.approvalStatus === "APPROVED"} />
            </Card>
          )}
          {agent.approvedBy && agent.approvedAt && (
            <p className="text-xs text-muted">Last decision by {agent.approvedBy.name} on {formatDate(agent.approvedAt)}.</p>
          )}
        </div>
      </div>
    </>
  );
}
