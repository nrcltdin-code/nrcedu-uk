import type { Metadata } from "next";
import { Suspense } from "react";
import { DocumentUpload } from "@/components/dashboard/document-upload";
import { DeleteButton } from "@/components/dashboard/form-bits";
import { PageHeader } from "@/components/dashboard/page-header";
import { Badge } from "@/components/ui/badge";
import { buttonStyles } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { db } from "@/lib/db";
import { documentTypeLabels } from "@/lib/documents";
import { formatDate } from "@/lib/format";
import { privateStorageEnabled } from "@/lib/storage";
import { requireMyStudentId } from "@/lib/student";
import { deleteMyDocument } from "./actions";

export const metadata: Metadata = { title: "My documents", robots: { index: false } };

const statusLabels = { PENDING: "Being checked", APPROVED: "Approved", REJECTED: "Please upload again" } as const;
const statusTones = { PENDING: "accent", APPROVED: "success", REJECTED: "danger" } as const;

// The usual set for a university application; shown so students know what to prepare.
const checklist = ["PASSPORT", "TRANSCRIPT", "CERTIFICATE", "ENGLISH_TEST", "SOP", "RECOMMENDATION_LETTER", "CV"] as const;

export default function DocumentsPage() {
  return (
    <>
      <PageHeader title="My documents" description="Upload clear scans or photos. Your counsellor checks each one and tells you if anything needs redoing." />
      <Suspense fallback={<Card tone="solid">Loading…</Card>}>
        <Documents />
      </Suspense>
    </>
  );
}

async function Documents() {
  const studentId = await requireMyStudentId();
  const [documents, applications] = await Promise.all([
    db.document.findMany({
      where: { studentId },
      orderBy: { createdAt: "desc" },
      select: { id: true, type: true, name: true, status: true, reviewNote: true, createdAt: true, application: { select: { course: { select: { name: true } } } } },
    }),
    db.application.findMany({
      where: { studentId, stage: { notIn: ["WITHDRAWN", "VISA_REFUSED"] } },
      select: { id: true, course: { select: { name: true, university: { select: { name: true } } } } },
    }),
  ]);
  const has = new Set(documents.filter((d) => d.status !== "REJECTED").map((d) => d.type));

  return (
    <div className="grid items-start gap-6 lg:grid-cols-[1.5fr_1fr]">
      <Card tone="solid">
        <ul className="divide-y divide-brand-900/10">
          {documents.map((doc) => (
            <li key={doc.id} className="flex flex-wrap items-start justify-between gap-3 py-3">
              <div className="min-w-0">
                <p className="font-semibold">{documentTypeLabels[doc.type]}</p>
                <p className="truncate text-sm text-muted">{[doc.name, doc.application?.course.name, formatDate(doc.createdAt)].filter(Boolean).join(" · ")}</p>
                {doc.status === "REJECTED" && doc.reviewNote && <p className="mt-1 text-sm text-red-800">Your counsellor says: {doc.reviewNote}</p>}
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <Badge tone={statusTones[doc.status]}>{statusLabels[doc.status]}</Badge>
                <a href={`/api/documents/${doc.id}`} className={buttonStyles({ variant: "glass", size: "sm" })}>Download</a>
                {doc.status !== "APPROVED" && <DeleteButton action={deleteMyDocument.bind(null, doc.id)} question={`Remove ${doc.name}?`} />}
              </div>
            </li>
          ))}
          {documents.length === 0 && <li className="py-2 text-muted">You have not uploaded anything yet.</li>}
        </ul>
        <div className="mt-4 border-t border-brand-900/10 pt-4">
          <DocumentUpload
            studentId={studentId}
            enabled={privateStorageEnabled}
            types={Object.entries(documentTypeLabels).map(([value, label]) => ({ value, label }))}
            applications={applications.map((a) => ({ id: a.id, name: `${a.course.name}, ${a.course.university.name}` }))}
          />
        </div>
      </Card>

      <Card tone="solid">
        <h2 className="text-lg font-bold">Usually needed</h2>
        <ul className="mt-3 grid gap-2 text-sm">
          {checklist.map((type) => (
            <li key={type} className="flex items-center gap-2">
              <span aria-hidden className={has.has(type) ? "text-emerald-600" : "text-muted"}>{has.has(type) ? "✓" : "○"}</span>
              <span className={has.has(type) ? "" : "text-muted"}>{documentTypeLabels[type]}</span>
            </li>
          ))}
        </ul>
        <p className="mt-4 text-xs text-muted">Your counsellor will tell you if your university asks for anything else.</p>
      </Card>
    </div>
  );
}
