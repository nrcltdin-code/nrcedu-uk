"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { deletePrivateObject } from "@/lib/storage";
import { requireMyStudentId } from "@/lib/student";

// Students can remove their own documents until staff approve them.
export async function deleteMyDocument(id: string) {
  const studentId = await requireMyStudentId();
  const document = await db.document.findFirst({ where: { id, studentId, status: { not: "APPROVED" } }, select: { fileKey: true } });
  if (!document) return;

  await db.document.delete({ where: { id } });
  if (document.fileKey) await deletePrivateObject(document.fileKey).catch((error) => console.error("Document delete:", error));
  revalidatePath("/dashboard/documents");
}
