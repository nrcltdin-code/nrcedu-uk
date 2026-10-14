"use server";

import { revalidatePath } from "next/cache";
import { text } from "@/lib/form";
import type { FormState } from "@/lib/form";
import { postMessage } from "@/lib/messages";
import { requirePermission, requireUser } from "@/lib/session";
import { requireMyStudentId } from "@/lib/student";

export async function sendMyMessage(_previous: FormState, form: FormData): Promise<FormState> {
  const user = await requireUser();
  const studentId = await requireMyStudentId();
  const result = await postMessage(studentId, user, text(form, "body"));
  if ("error" in result) return { error: result.error };
  revalidatePath("/dashboard/messages");
  return { saved: true };
}

export async function sendStaffMessage(_previous: FormState, form: FormData): Promise<FormState> {
  const user = await requirePermission("STUDENTS", "edit");
  const studentId = text(form, "studentId");
  const result = await postMessage(studentId, user, text(form, "body"));
  if ("error" in result) return { error: result.error };
  revalidatePath(`/dashboard/messages/${studentId}`);
  return { saved: true };
}
