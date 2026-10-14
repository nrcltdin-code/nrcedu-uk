"use server";

import { updateTag } from "next/cache";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { checked, imageError, optionalInt, text } from "@/lib/form";
import type { FormState } from "@/lib/form";
import { moveRow } from "@/lib/reorder";
import { requirePermission } from "@/lib/session";

const path = "/dashboard/testimonials";

export async function saveTestimonial(_previous: FormState, form: FormData): Promise<FormState> {
  await requirePermission("CONTENT", "edit");

  const id = text(form, "id");
  const name = text(form, "name");
  const headline = text(form, "headline");
  const quote = text(form, "quote");
  const photoUrl = text(form, "photoUrl");
  const rating = optionalInt(text(form, "rating"));

  if (name.length < 2 || name.length > 100) return { error: "Enter the student's name." };
  if (headline.length > 150) return { error: "Keep the line under the name under 150 characters." };
  if (quote.length < 10 || quote.length > 1000) return { error: "The quote should be 10 to 1,000 characters." };
  if (rating === undefined || (rating !== null && (rating < 1 || rating > 5))) return { error: "Rating is 1 to 5 stars." };
  const badImage = imageError(photoUrl, "The photo address");
  if (badImage) return { error: badImage };

  const data = { name, headline: headline || null, quote, photoUrl: photoUrl || null, rating, isPublished: checked(form, "isPublished") };
  if (id) await db.testimonial.update({ where: { id }, data });
  else await db.testimonial.create({ data: { ...data, sortOrder: await db.testimonial.count() } });

  updateTag("testimonials");
  redirect(path);
}

export async function setTestimonialPublished(id: string, isPublished: boolean) {
  await requirePermission("CONTENT", "edit");
  await db.testimonial.update({ where: { id }, data: { isPublished } });
  updateTag("testimonials");
  redirect(path);
}

export async function moveTestimonial(id: string, direction: "up" | "down") {
  await requirePermission("CONTENT", "edit");
  const rows = await db.testimonial.findMany({ orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }], select: { id: true } });
  await moveRow(rows, id, direction, (rowId, sortOrder) => db.testimonial.update({ where: { id: rowId }, data: { sortOrder } }));
  updateTag("testimonials");
  redirect(path);
}

export async function deleteTestimonial(id: string) {
  await requirePermission("CONTENT", "edit");
  await db.testimonial.delete({ where: { id } });
  updateTag("testimonials");
  redirect(path);
}
