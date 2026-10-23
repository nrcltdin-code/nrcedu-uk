import type { Metadata } from "next";
import { Suspense } from "react";
import { InfoTip } from "@/components/ui/info-tip";
import { DocumentUpload } from "@/components/dashboard/document-upload";
import { DeleteButton } from "@/components/dashboard/form-bits";
import { PageHeader } from "@/components/dashboard/page-header";
import { Badge } from "@/components/ui/badge";
import { buttonStyles } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { acceptsUpload, requestStatusLabels, requestStatusTones } from "@/lib/application-flow";
import { db } from "@/lib/db";
import { documentTypeLabels } from "@/lib/documents";
import { formatDate } from "@/lib/format";
import { privateStorageEnabled } from "@/lib/storage";
import { requireMyStudentId } from "@/lib/student";
import { deleteMyDocument } from "./actions";
import { ScrollHere } from "./scroll-here";

export const metadata: Metadata = { title: "My documents", robots: { index: false } };

const statusLabels = { PENDING: "Being checked", APPROVED: "Approved", REJECTED: "Please upload again" } as const;
const statusTones = { PENDING: "accent", APPROVED: "success", REJECTED: "danger" } as const;

export default function DocumentsPage({ searchParams }: PageProps<"/dashboard/documents">) {
  return (
    <>
      <PageHeader title="My documents" description="Your counsellor asks for each document when it is needed. Upload clear scans or photos; each one is checked." />
      <Suspense fallback={<Card tone="solid">Loading…</Card>}>
        <Documents searchParams={searchParams} />
      </Suspense>
    </>
  );
}

async function Documents({ searchParams }: Pick<PageProps<"/dashboard/documents">, "searchParams">) {
  const studentId = await requireMyStudentId();
  // Set by the link in the request email or WhatsApp message.
  const picked = (await searchParams).request;
  const [requests, others] = await Promise.all([
    db.documentRequest.findMany({
      where: { studentId },
      orderBy: [{ createdAt: "asc" }],
      select: {
        id: true,
        type: true,
        label: true,
        instructions: true,
        required: true,
        status: true,
        isOpen: true,
        dueAt: true,
        application: { select: { course: { select: { name: true, university: { select: { name: true } } } } } },
        documents: { orderBy: { createdAt: "desc" }, select: { id: true, name: true, status: true, reviewNote: true, createdAt: true } },
      },
    }),
    // Files staff added directly, outside any request.
    db.document.findMany({
      where: { studentId, requestId: null },
      orderBy: { createdAt: "desc" },
      select: { id: true, type: true, name: true, status: true, createdAt: true },
    }),
  ]);
  const todo = requests.filter((r) => r.status !== "APPROVED" && r.status !== "WAIVED");
  const finished = requests.filter((r) => r.status === "APPROVED" || r.status === "WAIVED");

  const fileRow = (doc: { id: string; name: string; status: keyof typeof statusLabels; reviewNote?: string | null; createdAt: Date }) => (
    <li key={doc.id} className="flex flex-wrap items-start justify-between gap-2 py-2">
      <div className="min-w-0">
        <p className="truncate text-sm font-medium">{doc.name}</p>
        <p className="text-xs text-muted">{formatDate(doc.createdAt)}</p>
        {doc.status === "REJECTED" && doc.reviewNote && <p className="mt-1 text-sm text-red-800">Your counsellor says: {doc.reviewNote}</p>}
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <Badge tone={statusTones[doc.status]}>{statusLabels[doc.status]}</Badge>
        <a href={`/api/documents/${doc.id}`} className={buttonStyles({ variant: "glass", size: "sm" })}>Download</a>
        {doc.status !== "APPROVED" && <DeleteButton action={deleteMyDocument.bind(null, doc.id)} question={`Remove ${doc.name}?`} />}
      </div>
    </li>
  );

  return (
    <div className="grid items-start gap-6 lg:grid-cols-[1.5fr_1fr]">
      <div className="grid gap-6">
        <Card tone="solid">
          <h2 className="mb-4 flex items-center gap-1 text-xl font-bold">Asked for you {todo.length > 0 && <span className="text-muted">({todo.length})</span>} <InfoTip text="Documents your counsellor needs from you. Upload into each one while it is open. If the upload is closed, your counsellor will open it when it is needed." /></h2>
          <ul className="grid gap-3">
            {todo.map((r) => (
              <li key={r.id} id={`request-${r.id}`} className={`scroll-mt-24 rounded-2xl border p-4 ${r.id === picked ? "border-brand-600 ring-2 ring-brand-600/30" : "border-brand-900/10"}`}>
                {r.id === picked && <ScrollHere />}
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="font-semibold">{r.label}{!r.required && <span className="ml-2 text-xs font-normal text-muted">optional</span>}</p>
                    <p className="text-xs text-muted">
                      {[r.application ? `${r.application.course.name}, ${r.application.course.university.name}` : "For all applications", r.dueAt && `please send by ${formatDate(r.dueAt)}`].filter(Boolean).join(" · ")}
                    </p>
                    {r.instructions && <p className="mt-1 text-sm">{r.instructions}</p>}
                  </div>
                  <Badge tone={requestStatusTones[r.status]}>{requestStatusLabels[r.status]}</Badge>
                </div>
                {r.documents.length > 0 && <ul className="mt-2 divide-y divide-brand-900/10 border-t border-brand-900/10">{r.documents.map(fileRow)}</ul>}
                <div className="mt-3 border-t border-brand-900/10 pt-3">
                  {acceptsUpload(r) ? (
                    <DocumentUpload studentId={studentId} requestId={r.id} enabled={privateStorageEnabled} />
                  ) : (
                    <p className="text-sm text-muted">Upload is closed for now. Your counsellor opens it when this is needed.</p>
                  )}
                </div>
              </li>
            ))}
            {todo.length === 0 && <li className="text-muted">Nothing to upload right now. We will let you know when we need something.</li>}
          </ul>
        </Card>

        {(finished.length > 0 || others.length > 0) && (
          <Card tone="solid">
            <h2 className="flex items-center gap-1 mb-2 text-xl font-bold">Done <InfoTip text="Documents your counsellor has approved or no longer needs. Approved files cannot be removed." /></h2>
            <ul className="divide-y divide-brand-900/10">
              {finished.map((r) => (
                <li key={r.id} className="py-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="font-semibold">{r.label}</p>
                    <Badge tone={requestStatusTones[r.status]}>{requestStatusLabels[r.status]}</Badge>
                  </div>
                  {r.documents.length > 0 && <ul className="divide-y divide-brand-900/10">{r.documents.filter((d) => d.status === "APPROVED").map(fileRow)}</ul>}
                </li>
              ))}
              {others.map((doc) => (
                <li key={doc.id} className="py-3">
                  <p className="font-semibold">{documentTypeLabels[doc.type]}</p>
                  <ul>{fileRow(doc)}</ul>
                </li>
              ))}
            </ul>
          </Card>
        )}
      </div>

      <Card tone="solid">
        <h2 className="flex items-center gap-1 text-lg font-bold">How it works <InfoTip text="Each document opens for upload only when your counsellor needs it." /></h2>
        <ol className="mt-3 grid list-decimal gap-2 pl-5 text-sm">
          <li>Your counsellor asks for a document. It appears here, open for upload, and you get an email.</li>
          <li>Upload a PDF, JPG or PNG (up to 10 MB). You can remove it until it is checked.</li>
          <li>Your counsellor approves it, or tells you what to fix so you can upload it again.</li>
        </ol>
        <p className="mt-4 text-xs text-muted">Each university asks for different documents, so your list follows the universities you apply to.</p>
      </Card>
    </div>
  );
}
