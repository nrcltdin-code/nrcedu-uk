import { DocumentUpload } from "@/components/dashboard/document-upload";
import { Badge } from "@/components/ui/badge";
import { buttonStyles } from "@/components/ui/button";
import type { Prisma } from "@/generated/prisma/client";
import { acceptsUpload, requestStatusLabels, requestStatusTones } from "@/lib/application-flow";
import { formatDate } from "@/lib/format";

// What an agent sees of a student's document requests: what NRC asked for, its status, the
// files sent, and an upload box while the slot is open. Reviews are NRC's job, so no buttons for that.

export const agentRequestSelect = {
  id: true,
  label: true,
  instructions: true,
  required: true,
  status: true,
  isOpen: true,
  dueAt: true,
  application: { select: { course: { select: { name: true, university: { select: { name: true } } } } } },
  documents: { orderBy: { createdAt: "desc" }, select: { id: true, name: true, status: true, reviewNote: true, createdAt: true } },
} satisfies Prisma.DocumentRequestSelect;

type Row = Prisma.DocumentRequestGetPayload<{ select: typeof agentRequestSelect }>;

const docLabels = { PENDING: "Being checked", APPROVED: "Approved", REJECTED: "Upload again" } as const;
const docTones = { PENDING: "accent", APPROVED: "success", REJECTED: "danger" } as const;

export function AgentRequestList({ studentId, requests, canUpload, storage }: { studentId: string; requests: Row[]; canUpload: boolean; storage: boolean }) {
  if (requests.length === 0) return <p className="text-sm text-muted">NRC has not asked for any documents yet.</p>;
  return (
    <ul className="grid gap-3">
      {requests.map((r) => (
        <li key={r.id} className="rounded-2xl border border-brand-900/10 p-4">
          <div className="flex flex-wrap items-start justify-between gap-2">
            <div className="min-w-0">
              <p className="font-semibold">{r.label}{!r.required && <span className="ml-2 text-xs font-normal text-muted">optional</span>}</p>
              <p className="text-xs text-muted">
                {[r.application ? `${r.application.course.name}, ${r.application.course.university.name}` : "For all applications", r.dueAt && `due ${formatDate(r.dueAt)}`].filter(Boolean).join(" · ")}
              </p>
              {r.instructions && <p className="mt-1 text-sm">{r.instructions}</p>}
            </div>
            <Badge tone={requestStatusTones[r.status]}>{requestStatusLabels[r.status]}</Badge>
          </div>
          {r.documents.length > 0 && (
            <ul className="mt-2 divide-y divide-brand-900/10 border-t border-brand-900/10">
              {r.documents.map((doc) => (
                <li key={doc.id} className="flex flex-wrap items-start justify-between gap-2 py-2">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">{doc.name}</p>
                    <p className="text-xs text-muted">{formatDate(doc.createdAt)}</p>
                    {doc.status === "REJECTED" && doc.reviewNote && <p className="mt-1 text-sm text-red-800">NRC says: {doc.reviewNote}</p>}
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge tone={docTones[doc.status]}>{docLabels[doc.status]}</Badge>
                    <a href={`/api/documents/${doc.id}`} className={buttonStyles({ variant: "glass", size: "sm" })}>Download</a>
                  </div>
                </li>
              ))}
            </ul>
          )}
          {canUpload && r.status !== "APPROVED" && r.status !== "WAIVED" && (
            <div className="mt-3 border-t border-brand-900/10 pt-3">
              {acceptsUpload(r) ? (
                <DocumentUpload studentId={studentId} requestId={r.id} enabled={storage} />
              ) : (
                <p className="text-sm text-muted">Upload is closed for now. NRC opens it when this is needed.</p>
              )}
            </div>
          )}
        </li>
      ))}
    </ul>
  );
}
