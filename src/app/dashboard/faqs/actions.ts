"use server";

import { updateTag } from "next/cache";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { checked, text } from "@/lib/form";
import type { FormState } from "@/lib/form";
import { moveRow } from "@/lib/reorder";
import { requirePermission } from "@/lib/session";

const path = "/dashboard/faqs";

export async function saveFaq(_previous: FormState, form: FormData): Promise<FormState> {
  await requirePermission("CONTENT", "edit");

  const id = text(form, "id");
  const question = text(form, "question");
  const answer = text(form, "answer");
  const category = text(form, "category");

  if (question.length < 5 || question.length > 300) return { error: "The question should be 5 to 300 characters." };
  if (answer.length < 2 || answer.length > 3000) return { error: "The answer should be 2 to 3,000 characters." };
  if (category.length > 60) return { error: "Keep the category under 60 characters." };

  const data = { question, answer, category: category || null, isPublished: checked(form, "isPublished") };
  if (id) await db.faq.update({ where: { id }, data });
  else await db.faq.create({ data: { ...data, sortOrder: await db.faq.count() } });

  updateTag("faqs");
  redirect(path);
}

export async function setFaqPublished(id: string, isPublished: boolean) {
  await requirePermission("CONTENT", "edit");
  await db.faq.update({ where: { id }, data: { isPublished } });
  updateTag("faqs");
  redirect(path);
}

export async function moveFaq(id: string, direction: "up" | "down") {
  await requirePermission("CONTENT", "edit");
  const rows = await db.faq.findMany({ orderBy: [{ sortOrder: "asc" }, { id: "asc" }], select: { id: true } });
  await moveRow(rows, id, direction, (rowId, sortOrder) => db.faq.update({ where: { id: rowId }, data: { sortOrder } }));
  updateTag("faqs");
  redirect(path);
}

export async function deleteFaq(id: string) {
  await requirePermission("CONTENT", "edit");
  await db.faq.delete({ where: { id } });
  updateTag("faqs");
  redirect(path);
}
