"use server";

import { revalidatePath } from "next/cache";
import type { DocumentType } from "@/generated/prisma/client";
import { applicationEvent } from "@/lib/applications";
import { db } from "@/lib/db";
import { documentTypeLabels } from "@/lib/documents";
import { link, queueEmail } from "@/lib/email";
import { checked, optionalDate, text } from "@/lib/form";
import { notify, studentSide } from "@/lib/notifications";
import type { FormState } from "@/lib/form";
import { requirePermission } from "@/lib/session";

// Document requests: the upload slots staff open on a student's portal. Students can upload
// only into an open slot (checked in /api/documents/start and /finish).

function refresh(request: { studentId: string; applicationId: string | null }) {
  revalidatePath(`/dashboard/students/${request.studentId}`);
  if (request.applicationId) revalidatePath(`/dashboard/applications/${request.applicationId}`);
}

const log = (userId: string, action: string, request: { id: string; applicationId: string | null; label: string }, note?: string) =>
  db.$transaction([
    db.activityLog.create({ data: { userId, action, entityType: "DocumentRequest", entityId: request.id } }),
    ...(request.applicationId
      ? [applicationEvent({ applicationId: request.applicationId, actorId: userId, type: action, note: note ?? request.label, visibleToStudent: true, meta: { requestId: request.id } })]
      : []),
  ]);

async function tellStudent(studentId: string, label: string, instructions: string | null, actorId: string) {
  const student = await db.studentProfile.findUnique({ where: { id: studentId }, select: { user: { select: { name: true, email: true } } } });
  const side = await studentSide(studentId);
  if (!student) return;
  notify([side?.userId], { type: "document.requested", title: `Please upload: ${label}`, body: instructions ?? undefined, href: "/dashboard/documents" }, actorId);
  notify(side?.agents ?? [], { type: "document.requested", title: `${student.user.name}: please upload ${label}`, href: `/dashboard/agent/students/${studentId}` }, actorId);
  queueEmail({
    to: student.user.email,
    subject: `Please upload: ${label}`,
    text: `Hello ${student.user.name},\n\nWe need one more document from you: ${label}.${instructions ? `\n\n${instructions}` : ""}\n\nUpload it here: ${link("/dashboard/documents")}`,
  });
}

export async function createDocumentRequest(_previous: FormState, form: FormData): Promise<FormState> {
  const user = await requirePermission("STUDENTS", "edit");
  const studentId = text(form, "studentId");
  const applicationId = text(form, "applicationId") || null;
  const type = text(form, "type") as DocumentType;
  const label = text(form, "label") || documentTypeLabels[type];
  const instructions = text(form, "instructions") || null;
  const dueAt = optionalDate(text(form, "dueAt"));

  if (!(type in documentTypeLabels)) return { error: "Choose what kind of document it is." };
  if (label.length > 120) return { error: "Keep the name under 120 characters." };
  if (instructions && instructions.length > 1000) return { error: "Keep the instructions under 1,000 characters." };
  if (dueAt === undefined) return { error: "The due date is not a valid date." };
  if (!(await db.studentProfile.count({ where: { id: studentId } }))) return { error: "This student no longer exists." };
  if (applicationId && !(await db.application.count({ where: { id: applicationId, studentId } }))) {
    return { error: "That application does not belong to this student." };
  }

  const request = await db.documentRequest.create({
    data: { studentId, applicationId, type, label, instructions, dueAt, required: checked(form, "required"), createdById: user.id },
    select: { id: true, studentId: true, applicationId: true, label: true },
  });
  await log(user.id, "request.created", request);
  await tellStudent(studentId, label, instructions, user.id);
  refresh(request);
  return { saved: true };
}

const findRequest = (id: string) =>
  db.documentRequest.findUnique({ where: { id }, select: { id: true, studentId: true, applicationId: true, label: true, instructions: true, status: true, isOpen: true, _count: { select: { documents: true } } } });

// Open or close the upload slot. Reopening tells the student again.
export async function setRequestOpen(id: string, isOpen: boolean) {
  const user = await requirePermission("STUDENTS", "edit");
  const request = await findRequest(id);
  if (!request || request.isOpen === isOpen) return;
  await db.documentRequest.update({ where: { id }, data: { isOpen } });
  await log(user.id, isOpen ? "request.opened" : "request.closed", request);
  if (isOpen) await tellStudent(request.studentId, request.label, request.instructions, user.id);
  refresh(request);
}

// Not needed after all (e.g. already on file). Undoing puts it back to waiting.
export async function setRequestWaived(id: string, waived: boolean) {
  const user = await requirePermission("STUDENTS", "edit");
  const request = await findRequest(id);
  if (!request) return;
  if (waived) {
    await db.documentRequest.update({ where: { id }, data: { status: "WAIVED", isOpen: false } });
    await log(user.id, "request.waived", request);
  } else if (request.status === "WAIVED") {
    await db.documentRequest.update({ where: { id }, data: { status: request._count.documents ? "UPLOADED" : "REQUESTED", isOpen: true } });
    await log(user.id, "request.opened", request);
  }
  refresh(request);
}

// Only requests nobody has uploaded to yet; otherwise waive it, so the file keeps its context.
export async function deleteDocumentRequest(id: string) {
  const user = await requirePermission("STUDENTS", "edit");
  const request = await findRequest(id);
  if (!request || request._count.documents) return;
  await db.documentRequest.delete({ where: { id } });
  await log(user.id, "request.deleted", request);
  refresh(request);
}
