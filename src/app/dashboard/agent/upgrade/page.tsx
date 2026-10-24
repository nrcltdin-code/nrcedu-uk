import type { Metadata } from "next";
import { Suspense } from "react";
import { redirect } from "next/navigation";
import { DocumentUpload } from "@/components/dashboard/document-upload";
import { DeleteButton } from "@/components/dashboard/form-bits";
import { PageHeader } from "@/components/dashboard/page-header";
import { Badge } from "@/components/ui/badge";
import { buttonStyles } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { InfoTip } from "@/components/ui/info-tip";
import { agentDocumentLabels, requireAgentOwner } from "@/lib/agent";
import { db } from "@/lib/db";
import { formatDate } from "@/lib/format";
import { privateStorageEnabled } from "@/lib/storage";
import { deleteUpgradeDocument } from "./actions";
import { UpgradeRequestForm } from "./upgrade-form";

export const metadata: Metadata = { title: "Become an agency", robots: { index: false } };

const docLabels = { PENDING: "Being checked", APPROVED: "Approved", REJECTED: "Please upload again" } as const;
const docTones = { PENDING: "accent", APPROVED: "success", REJECTED: "danger" } as const;

export default function UpgradePage() {
  return (
    <>
      <PageHeader title="Become an agency" description="Have staff who help you? As an agency you can add your team and decide what each person can see and do. NRC checks your business first." />
      <Suspense fallback={<Card tone="solid">Loading…</Card>}>
        <Upgrade />
      </Suspense>
    </>
  );
}

async function Upgrade() {
  const scope = await requireAgentOwner();
  if (scope.kind !== "INDIVIDUAL") redirect("/dashboard/agent/team");
  const profile = await db.agentProfile.findUniqueOrThrow({
    where: { id: scope.agentId },
    select: {
      companyName: true,
      registrationNumber: true,
      upgradeStatus: true,
      upgradeCompanyName: true,
      upgradeRegistrationNumber: true,
      upgradeNote: true,
      upgradeRequestedAt: true,
      verification: { where: { type: "BUSINESS_REGISTRATION" }, orderBy: { createdAt: "desc" } },
    },
  });
  const status = profile.upgradeStatus;

  return (
    <div className="grid max-w-3xl gap-6">
      {status === "PENDING" && (
        <p role="status" className="rounded-xl border border-brand-600/20 bg-brand-600/8 px-4 py-3">
          Request sent on {formatDate(profile.upgradeRequestedAt!)}. We usually reply within 2 working days. Your account works as usual meanwhile.
        </p>
      )}
      {status === "CHANGES_REQUESTED" && (
        <p role="alert" className="rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-amber-950">
          <span className="font-semibold">NRC asked for changes: </span>{profile.upgradeNote} Fix them, then send the request again.
        </p>
      )}
      {status === "REJECTED" && (
        <p role="alert" className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-red-900">
          <span className="font-semibold">We could not approve your last request: </span>{profile.upgradeNote} You can still work as an individual agent, or send a new request.
        </p>
      )}

      <Card tone="solid">
        <h2 className="mb-4 flex items-center gap-1 text-xl font-bold">1. Business registration <InfoTip text="Your company's registration certificate (PDF, JPG or PNG, up to 10 MB). Only NRC staff see it. You can remove a file until it is approved." /></h2>
        <ul className="divide-y divide-brand-900/10">
          {profile.verification.map((doc) => (
            <li key={doc.id} className="flex flex-wrap items-start justify-between gap-2 py-3">
              <div className="min-w-0">
                <p className="truncate font-semibold">{doc.name}</p>
                <p className="text-sm text-muted">{formatDate(doc.createdAt)}</p>
                {doc.status === "REJECTED" && doc.reviewNote && <p className="mt-1 text-sm text-red-800">NRC says: {doc.reviewNote}</p>}
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <Badge tone={docTones[doc.status]}>{docLabels[doc.status]}</Badge>
                <a href={`/api/agent-documents/${doc.id}`} className={buttonStyles({ variant: "glass", size: "sm" })}>Download</a>
                {doc.status !== "APPROVED" && <DeleteButton action={deleteUpgradeDocument.bind(null, doc.id)} question={`Remove ${doc.name}?`} />}
              </div>
            </li>
          ))}
          {profile.verification.length === 0 && <li className="py-2 text-muted">Nothing uploaded yet.</li>}
        </ul>
        <div className="mt-4 border-t border-brand-900/10 pt-4">
          <DocumentUpload
            studentId={scope.agentId}
            api="/api/agent-documents"
            enabled={privateStorageEnabled}
            types={[{ value: "BUSINESS_REGISTRATION", label: agentDocumentLabels.BUSINESS_REGISTRATION }]}
          />
        </div>
      </Card>

      <Card tone="solid">
        <h2 className="mb-4 flex items-center gap-1 text-xl font-bold">2. Agency details and request <InfoTip text="Once NRC approves, your account becomes an agency and the Team page appears. Your students, applications and commission stay exactly as they are." /></h2>
        {status === "PENDING" ? (
          <p className="text-muted">Waiting for NRC: {profile.upgradeCompanyName}{profile.upgradeRegistrationNumber && ` (${profile.upgradeRegistrationNumber})`}.</p>
        ) : (
          <UpgradeRequestForm
            companyName={profile.upgradeCompanyName ?? profile.companyName ?? ""}
            registrationNumber={profile.upgradeRegistrationNumber ?? profile.registrationNumber ?? ""}
            again={Boolean(status)}
          />
        )}
      </Card>
    </div>
  );
}
