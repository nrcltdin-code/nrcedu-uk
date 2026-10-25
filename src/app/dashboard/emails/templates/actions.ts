"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { optionalInt, text } from "@/lib/form";
import type { FormState } from "@/lib/form";
import { requirePermission } from "@/lib/session";

function read(form: FormData) {
  return { name: text(form, "name"), subject: text(form, "subject"), body: text(form, "body"), sortOrder: optionalInt(text(form, "sortOrder")) };
}

function check(t: ReturnType<typeof read>) {
  if (t.name.length < 2 || t.name.length > 60) return "Give the template a name (up to 60 characters).";
  if (t.subject.length < 2 || t.subject.length > 150) return "Write a subject (up to 150 characters).";
  if (t.body.length < 2 || t.body.length > 10_000) return "Write the message (up to 10,000 characters).";
  if (t.sortOrder === undefined) return "The order must be a whole number.";
  return null;
}

export async function saveTemplate(_previous: FormState, form: FormData): Promise<FormState> {
  const user = await requirePermission("SETTINGS", "edit");
  const id = text(form, "id");
  const t = read(form);
  const error = check(t);
  if (error) return { error };
  const data = { name: t.name, subject: t.subject, body: t.body, sortOrder: t.sortOrder ?? 0 };

  const saved = id ? await db.emailTemplate.update({ where: { id }, data }).catch(() => null) : await db.emailTemplate.create({ data });
  if (!saved) return { error: "This template no longer exists." };
  await db.activityLog.create({ data: { userId: user.id, action: id ? "email-template.update" : "email-template.create", entityType: "EmailTemplate", entityId: saved.id } });
  revalidatePath("/dashboard/emails/templates");
  return { saved: true };
}

export async function deleteTemplate(id: string) {
  const user = await requirePermission("SETTINGS", "edit");
  await db.emailTemplate.deleteMany({ where: { id } });
  await db.activityLog.create({ data: { userId: user.id, action: "email-template.delete", entityType: "EmailTemplate", entityId: id } });
  redirect("/dashboard/emails/templates");
}
