"use server";

import { updateTag } from "next/cache";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { imageError, isSlug, isUniqueError, slugify, text } from "@/lib/form";
import type { FormState } from "@/lib/form";
import { requirePermission } from "@/lib/session";

export async function saveSubject(_previous: FormState, form: FormData): Promise<FormState> {
  await requirePermission("CONTENT", "edit");

  const id = text(form, "id");
  const name = text(form, "name");
  const slug = text(form, "slug") || slugify(name);
  const description = text(form, "description");
  const imageUrl = text(form, "imageUrl");

  if (name.length < 2 || name.length > 100) return { error: "Enter a name (2 to 100 characters)." };
  if (!isSlug(slug)) return { error: "The web address may use only lowercase letters, numbers and hyphens." };
  if (description.length > 2000) return { error: "Keep the description under 2,000 characters." };
  const badImage = imageError(imageUrl, "The image address");
  if (badImage) return { error: badImage };

  const data = { name, slug, description: description || null, imageUrl: imageUrl || null };
  try {
    if (id) await db.subject.update({ where: { id }, data });
    else await db.subject.create({ data });
  } catch (error) {
    if (isUniqueError(error)) return { error: "Another subject already uses this name or web address." };
    throw error;
  }

  updateTag("subjects");
  redirect("/dashboard/subjects");
}

// Courses keep existing; they just lose their subject.
export async function deleteSubject(id: string) {
  await requirePermission("CONTENT", "edit");
  await db.subject.delete({ where: { id } });
  updateTag("subjects");
  updateTag("universities");
  redirect("/dashboard/subjects");
}
