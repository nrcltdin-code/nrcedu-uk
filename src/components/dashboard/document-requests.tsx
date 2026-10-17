import type { Prisma } from "@/generated/prisma/client";
import { DocumentUpload } from "@/components/dashboard/document-upload";
import { DeleteButton } from "@/components/dashboard/form-bits";
import { Badge } from "@/components/ui/badge";
import { Icon } from "@/components/ui/icon";
import { InfoTip } from "@/components/ui/info-tip";
import { Button, buttonStyles } from "@/components/ui/button";
import { requestStatusLabels, requestStatusTones } from "@/lib/application-flow";
import { documentTypeLabels } from "@/lib/documents";
import { formatDate } from "@/lib/format";
import { deleteDocument } from "@/app/dashboard/students/document-actions";
import { DocumentReview } from "@/app/dashboard/students/document-review";
import { deleteDocumentRequest, setRequestOpen, setRequestWaived } from "@/app/dashboard/students/request-actions";

// Staff view of a student's document requests (upload slots) with the files sent for each.

export const requestSelect = {
  id: true,
  type: true,
  label: true,
  instructions: true,
  required: true,
  status: true,
  isOpen: true,
  dueAt: true,
  createdAt: true,
  createdBy: { select: { name: true } },
  documents: {
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      name: true,
      status: true,
      reviewNote: true,
      createdAt: true,
      uploadedBy: { select: { name: true } },
      reviewedBy: { select: { name: true } },
    },
  },
} satisfies Prisma.DocumentRequestSelect;

export type RequestRow = Prisma.DocumentRequestGetPayload<{ select: typeof requestSelect }>;

const docLabels = { PENDING: "Waiting for review", APPROVED: "Approved", REJECTED: "Sent back" } as const;
const docTones = { PENDING: "accent", APPROVED: "success", REJECTED: "danger" } as const;

// What each WhatsApp button does, shown when hovering (or focusing) its ⓘ icon.
export const whatsappHelp = {
  document: "Opens a WhatsApp chat with the student about this file, with a message already typed. The file stays here on the portal; the message links to it. The click is logged.",
  request: "Opens a WhatsApp chat asking the student to upload this document, with a link to their Documents page. The click is logged.",
  student: "Opens a WhatsApp chat with this student. The click is logged.",
} as const;

export function WhatsAppButton({ href, enabled, purpose }: { href: string; enabled: boolean; purpose: keyof typeof whatsappHelp }) {
  const help = enabled ? whatsappHelp[purpose] : "Add the student's phone number with its country code (e.g. +44 7700 900123) on their profile to chat on WhatsApp.";
  return (
    <span className="inline-flex items-center">
      {enabled ? (
        <a href={href} target="_blank" rel="noopener noreferrer" className="inline-flex h-9 items-center gap-1.5 rounded-full bg-[#25D366] px-3.5 text-sm font-semibold text-white hover:bg-[#1ebe5b]">
          <Icon name="chat" className="size-4" />
          WhatsApp
        </a>
      ) : (
        <span aria-disabled className="inline-flex h-9 cursor-not-allowed items-center gap-1.5 rounded-full bg-brand-900/8 px-3.5 text-sm font-semibold text-muted">
          <Icon name="chat" className="size-4" />
          WhatsApp
        </span>
      )}
      <InfoTip text={help} align="right" />
    </span>
  );
}

type Props = {
  studentId: string;
  requests: RequestRow[];
  canEdit: boolean;
  whatsapp: boolean;
  storage: boolean;
};

export function DocumentRequestList({ studentId, requests, canEdit, whatsapp, storage }: Props) {
  if (requests.length === 0) return <p className="text-sm text-muted">No documents requested yet.</p>;

  return (
    <ul className="grid gap-3">
      {requests.map((r) => (
        <li key={r.id} className="rounded-2xl border border-brand-900/10 p-4">
          <div className="flex flex-wrap items-start justify-between gap-2">
            <div className="min-w-0">
              <p className="font-semibold">
                {r.label}
                {!r.required && <span className="ml-2 text-xs font-normal text-muted">optional</span>}
              </p>
              <p className="text-xs text-muted">
                {[documentTypeLabels[r.type], r.dueAt && `due ${formatDate(r.dueAt)}`, `asked by ${r.createdBy?.name ?? "NRC"} on ${formatDate(r.createdAt)}`].filter(Boolean).join(" · ")}
              </p>
              {r.instructions && <p className="mt-1 text-sm">{r.instructions}</p>}
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Badge tone={requestStatusTones[r.status]}>{requestStatusLabels[r.status]}</Badge>
              {r.status !== "WAIVED" && r.status !== "APPROVED" && (
                <Badge tone={r.isOpen ? "success" : "neutral"}>{r.isOpen ? "Upload open" : "Upload closed"}</Badge>
              )}
            </div>
          </div>

          {r.documents.length > 0 && (
            <ul className="mt-3 divide-y divide-brand-900/10 border-t border-brand-900/10">
              {r.documents.map((doc) => (
                <li key={doc.id} className="py-2.5">
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium">{doc.name}</p>
                      <p className="text-xs text-muted">{doc.uploadedBy?.name ?? "Someone"}, {formatDate(doc.createdAt)}</p>
                      {doc.reviewNote && <p className="mt-1 text-sm">“{doc.reviewNote}”{doc.reviewedBy && <span className="text-muted"> — {doc.reviewedBy.name}</span>}</p>}
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge tone={docTones[doc.status]}>{docLabels[doc.status]}</Badge>
                      <a href={`/api/documents/${doc.id}`} className={buttonStyles({ variant: "glass", size: "sm" })}>Download</a>
                      <WhatsAppButton href={`/api/whatsapp?document=${doc.id}`} enabled={whatsapp} purpose="document" />
                      {canEdit && <DeleteButton action={deleteDocument.bind(null, doc.id)} question={`Delete ${doc.name}? The file is removed for good.`} />}
                    </div>
                  </div>
                  {canEdit && doc.status === "PENDING" && <DocumentReview id={doc.id} />}
                </li>
              ))}
            </ul>
          )}

          {canEdit && (
            <div className="mt-3 flex flex-wrap items-center gap-1 border-t border-brand-900/10 pt-3">
              {r.status !== "APPROVED" && r.status !== "WAIVED" && (
                <form action={setRequestOpen.bind(null, r.id, !r.isOpen)}>
                  <Button variant="ghost" size="sm">{r.isOpen ? "Close upload" : "Open upload"}</Button>
                </form>
              )}
              {r.status !== "APPROVED" && (
                <form action={setRequestWaived.bind(null, r.id, r.status !== "WAIVED")}>
                  <Button variant="ghost" size="sm">{r.status === "WAIVED" ? "Needed after all" : "Not needed"}</Button>
                </form>
              )}
              {r.status !== "APPROVED" && r.status !== "WAIVED" && <WhatsAppButton href={`/api/whatsapp?request=${r.id}`} enabled={whatsapp} purpose="request" />}
              {r.documents.length === 0 && <DeleteButton action={deleteDocumentRequest.bind(null, r.id)} question={`Remove the request for ${r.label}?`} />}
              {r.status !== "APPROVED" && r.status !== "WAIVED" && (
                <details className="w-full">
                  <summary className="mt-1 cursor-pointer text-sm font-semibold text-brand-700">Upload on the student’s behalf</summary>
                  <div className="mt-3">
                    <DocumentUpload studentId={studentId} requestId={r.id} enabled={storage} />
                  </div>
                </details>
              )}
            </div>
          )}
        </li>
      ))}
    </ul>
  );
}
