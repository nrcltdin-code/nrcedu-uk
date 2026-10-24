"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { requireRole } from "@/lib/session";
import { deletePrivateObject } from "@/lib/storage";

// Remove a file sent for an open request, until NRC approves it (e.g. the wrong file).
export async function deleteRequestedDocument(id: string) {
  const user = await requireRole("AGENT");
  const document = await db.agentDocument.findFirst({
    where: { id, agent: { userId: user.id }, status: { not: "APPROVED" }, request: { isOpen: true } },
    select: { fileKey: true },
  });
  if (!document) return;
  await db.agentDocument.delete({ where: { id } });
  await deletePrivateObject(document.fileKey).catch((error) => console.error("Agent document delete:", error));
  revalidatePath("/dashboard/agent/documents");
}
