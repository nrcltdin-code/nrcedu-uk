"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { documentTypeLabels } from "@/lib/documents";
import { link, queueEmail } from "@/lib/email";
import { text } from "@/lib/form";
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
      type: true,
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
  ]);

  if (decision === "REJECTED") {
    const { name, email } = document.student.user;
    const what = documentTypeLabels[document.type];
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
  return { saved: true };
}

export async function deleteDocument(id: string) {
  const user = await requirePermission("STUDENTS", "edit");
  const document = await db.document.findUnique({ where: { id }, select: { studentId: true, fileKey: true } });
  if (!document) return;

  await db.$transaction([
    db.document.delete({ where: { id } }),
    db.activityLog.create({ data: { userId: user.id, action: "document.delete", entityType: "Document", entityId: id } }),
  ]);
  if (document.fileKey) await deletePrivateObject(document.fileKey).catch((error) => console.error("Document delete:", error));
  revalidatePath(`/dashboard/students/${document.studentId}`);
}
