"use server";

import { revalidatePath } from "next/cache";
import { applicationEvent, missingRequiredDocuments } from "@/lib/applications";
import { db } from "@/lib/db";
import { documentTypeLabels, syncRequestStatus } from "@/lib/documents";
import { link, queueEmail } from "@/lib/email";
import { text } from "@/lib/form";
import { counsellorOrStaff, notify, studentSide } from "@/lib/notifications";
import type { FormState } from "@/lib/form";
import { requirePermission } from "@/lib/session";
import { deletePrivateObject } from "@/lib/storage";

export async function reviewDocument(_previous: FormState, form: FormData): Promise<FormState> {
  const user = await requirePermission("STUDENTS", "edit");

  const id = text(form, "id");
  const decision = text(form, "decision");
  const note = text(form, "note");
  if (decision !== "APPROVED" && decision !== "REJECTED") return { error: "Choose approve or ask again." };
  if (decision === "REJECTED" && note.length < 3) return { error: "Say what is wrong, so the student knows what to upload." };
  if (note.length > 500) return { error: "Keep the note under 500 characters." };

  const document = await db.document.findUnique({
    where: { id },
    select: {
      studentId: true,
      applicationId: true,
      requestId: true,
      name: true,
      type: true,
      request: { select: { label: true } },
      student: { select: { user: { select: { name: true, email: true } }, agent: { select: { user: { select: { email: true } } } } } },
    },
  });
  if (!document) return { error: "This document no longer exists." };

  await db.$transaction([
    db.document.update({
      where: { id },
      data: { status: decision, reviewNote: note || null, reviewedById: user.id, reviewedAt: new Date() },
    }),
    db.activityLog.create({ data: { userId: user.id, action: `document.${decision.toLowerCase()}`, entityType: "Document", entityId: id } }),
    ...(document.applicationId
      ? [applicationEvent({
          applicationId: document.applicationId,
          actorId: user.id,
          type: `document.${decision.toLowerCase()}`,
          note: `${document.request?.label ?? documentTypeLabels[document.type]}: ${document.name}${note ? ` (${note})` : ""}`,
          visibleToStudent: true,
          meta: { documentId: id, requestId: document.requestId },
        })]
      : []),
  ]);
  await syncRequestStatus(document.requestId);

  // Once every required document on the application is approved, the counsellor can submit it.
  if (decision === "APPROVED" && document.applicationId && (await missingRequiredDocuments(document.applicationId)) === 0) {
    const app = await db.application.findUnique({ where: { id: document.applicationId }, select: { assignedStaffId: true, stage: true } });
    if (app && (app.stage === "NEW" || app.stage === "DOCUMENTS_PENDING")) {
      notify(await counsellorOrStaff(app.assignedStaffId, "APPLICATIONS"), {
        type: "application.documents-complete",
        title: `All documents approved: ${document.student.user.name}`,
        body: "The application can move to Ready to submit.",
        href: `/dashboard/applications/${document.applicationId}`,
      });
    }
  }

  const side = await studentSide(document.studentId);
  const what = document.request?.label ?? documentTypeLabels[document.type];
  const notice = decision === "APPROVED"
    ? { type: "document.approved", title: `${what} approved`, body: "No action needed." }
    : { type: "document.rejected", title: `Please upload the ${what} again`, body: note };
  // Rejections send their own email below, with what to fix.
  const email = decision === "APPROVED";
  notify([side?.userId], { ...notice, href: "/dashboard/documents", email }, user.id);
  notify(side?.agents ?? [], { ...notice, email, title: `${document.student.user.name}: ${notice.title}`, href: `/dashboard/agent/students/${document.studentId}` }, user.id);

  if (decision === "REJECTED") {
    const { name, email } = document.student.user;
    const agentEmail = document.student.agent?.user.email;
    queueEmail({
      to: email,
      subject: `Please upload your ${what} again`,
      text: `Hello ${name},\n\nWe checked your ${what} and need a new copy.\n\nWhat to fix: ${note}\n\nUpload it here: ${link("/dashboard/documents")}`,
    });
    if (agentEmail) {
      queueEmail({
        to: agentEmail,
        subject: `${name}: please upload the ${what} again`,
        text: `We checked the ${what} of ${name} and need a new copy.\n\nWhat to fix: ${note}\n\nUpload it here: ${link(`/dashboard/agent/students/${document.studentId}`)}`,
      });
    }
  }
  revalidatePath(`/dashboard/students/${document.studentId}`);
  if (document.applicationId) revalidatePath(`/dashboard/applications/${document.applicationId}`);
  return { saved: true };
}

export async function deleteDocument(id: string) {
  const user = await requirePermission("STUDENTS", "edit");
  const document = await db.document.findUnique({ where: { id }, select: { studentId: true, applicationId: true, requestId: true, name: true, fileKey: true } });
  if (!document) return;

  await db.$transaction([
    db.document.delete({ where: { id } }),
    db.activityLog.create({ data: { userId: user.id, action: "document.delete", entityType: "Document", entityId: id } }),
    ...(document.applicationId
      ? [applicationEvent({ applicationId: document.applicationId, actorId: user.id, type: "document.deleted", note: document.name, meta: { requestId: document.requestId } })]
      : []),
  ]);
  await syncRequestStatus(document.requestId);
  if (document.fileKey) await deletePrivateObject(document.fileKey).catch((error) => console.error("Document delete:", error));
  revalidatePath(`/dashboard/students/${document.studentId}`);
}
