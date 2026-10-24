import type { Metadata } from "next";
import { Suspense } from "react";
import { redirect } from "next/navigation";
import { DocumentUpload } from "@/components/dashboard/document-upload";
import { DeleteButton } from "@/components/dashboard/form-bits";
import { PageHeader } from "@/components/dashboard/page-header";
import { Badge } from "@/components/ui/badge";
import { buttonStyles } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { db } from "@/lib/db";
import { formatDate } from "@/lib/format";
import { requireRole } from "@/lib/session";
import { privateStorageEnabled } from "@/lib/storage";
import { deleteRequestedDocument } from "./actions";

export const metadata: Metadata = { title: "Documents for NRC", robots: { index: false } };

const docLabels = { PENDING: "Being checked", APPROVED: "Approved", REJECTED: "Please upload again" } as const;
const docTones = { PENDING: "accent", APPROVED: "success", REJECTED: "danger" } as const;

export default function RequestedDocumentsPage() {
  return (
    <>
      <PageHeader title="Documents for NRC" description="Files NRC asked you for. Upload each one in its box; we will tell you if anything needs fixing." />
      <Suspense fallback={<Card tone="solid">Loading…</Card>}>
        <Requests />
      </Suspense>
    </>
  );
}

async function Requests() {
  const user = await requireRole("AGENT");
  const profile = await db.agentProfile.findUnique({
    where: { userId: user.id },
    select: {
      id: true,
      approvalStatus: true,
      documentRequests: {
        where: { isOpen: true },
        orderBy: { createdAt: "asc" },
        select: { id: true, label: true, instructions: true, createdAt: true, documents: { orderBy: { createdAt: "desc" } } },
      },
    },
  });
  if (!profile || profile.approvalStatus === "REJECTED") redirect("/dashboard");
  if (profile.documentRequests.length === 0) return <Card tone="solid">Nothing to send right now. If NRC needs anything, it will appear here and you will get an email.</Card>;

  return (
    <ul className="grid max-w-3xl gap-6">
      {profile.documentRequests.map((request) => (
        <li key={request.id}>
          <Card tone="solid">
            <h2 className="text-xl font-bold">{request.label}</h2>
            <p className="text-sm text-muted">Asked on {formatDate(request.createdAt)}</p>
            {request.instructions && <p className="mt-2 whitespace-pre-line">{request.instructions}</p>}
            {request.documents.length > 0 && (
              <ul className="mt-4 divide-y divide-brand-900/10 border-t border-brand-900/10">
                {request.documents.map((doc) => (
                  <li key={doc.id} className="flex flex-wrap items-start justify-between gap-2 py-3">
                    <div className="min-w-0">
                      <p className="truncate font-semibold">{doc.name}</p>
                      <p className="text-sm text-muted">{formatDate(doc.createdAt)}</p>
                      {doc.status === "REJECTED" && doc.reviewNote && <p className="mt-1 text-sm text-red-800">NRC says: {doc.reviewNote}</p>}
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge tone={docTones[doc.status]}>{docLabels[doc.status]}</Badge>
                      <a href={`/api/agent-documents/${doc.id}`} className={buttonStyles({ variant: "glass", size: "sm" })}>Download</a>
                      {doc.status !== "APPROVED" && <DeleteButton action={deleteRequestedDocument.bind(null, doc.id)} question={`Remove ${doc.name}?`} />}
                    </div>
                  </li>
                ))}
              </ul>
            )}
            <div className="mt-4 border-t border-brand-900/10 pt-4">
              <DocumentUpload studentId={request.id} api="/api/agent-documents" requestId={request.id} enabled={privateStorageEnabled} />
            </div>
          </Card>
        </li>
      ))}
    </ul>
  );
}
