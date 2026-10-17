"use server";

import { revalidatePath } from "next/cache";
import { applicationEvent } from "@/lib/applications";
import { db } from "@/lib/db";
import { syncRequestStatus } from "@/lib/documents";
import { deletePrivateObject } from "@/lib/storage";
import { requireMyStudentId } from "@/lib/student";

// Students can remove their own documents until staff approve them.
export async function deleteMyDocument(id: string) {
  const studentId = await requireMyStudentId();
  const document = await db.document.findFirst({
    where: { id, studentId, status: { not: "APPROVED" } },
    select: { fileKey: true, name: true, applicationId: true, requestId: true, student: { select: { userId: true } } },
  });
  if (!document) return;

  await db.$transaction([
    db.document.delete({ where: { id } }),
    ...(document.applicationId
      ? [applicationEvent({ applicationId: document.applicationId, actorId: document.student.userId, type: "document.deleted", note: document.name, visibleToStudent: true, meta: { requestId: document.requestId } })]
      : []),
  ]);
  await syncRequestStatus(document.requestId);
  if (document.fileKey) await deletePrivateObject(document.fileKey).catch((error) => console.error("Document delete:", error));
  revalidatePath("/dashboard/documents");
}
