"use server";

import { updateTag } from "next/cache";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { releaseImages } from "@/lib/uploads";
import { checked, imageError, text } from "@/lib/form";
import type { FormState } from "@/lib/form";
import { moveRow } from "@/lib/reorder";
import { requirePermission } from "@/lib/session";
import { redirectPath } from "@/lib/site-url";

// The country list is seeded (all 197); here staff only fill in details and choose destinations.
export async function saveCountry(_previous: FormState, form: FormData): Promise<FormState> {
  await requirePermission("CONTENT", "edit");

  const id = text(form, "id");
  const description = text(form, "description");
  const tagline = text(form, "tagline");
  const content = text(form, "content");
  const imageUrl = text(form, "imageUrl");
  const flagUrl = text(form, "flagUrl");

  if (description.length > 5000) return { error: "Keep the description under 5,000 characters." };
  if (tagline.length > 300) return { error: "Keep the banner text under 300 characters." };
  if (content.length > 100_000) return { error: "Keep the details under 100,000 characters." };
  const badImage = imageError(imageUrl, "The image address") ?? imageError(flagUrl, "The flag address");
  if (badImage) return { error: badImage };

  const before = await db.country.findUnique({ where: { id }, select: { imageUrl: true, flagUrl: true } });
  await db.country.update({
    where: { id },
    data: {
      description: description || null,
      tagline: tagline || null,
      content: content || null,
      imageUrl: imageUrl || null,
      flagUrl: flagUrl || null,
      isDestination: checked(form, "isDestination"),
    },
  });
  releaseImages(before?.imageUrl, before?.flagUrl);

  updateTag("countries");
  // No longer a destination: close its editor.
  if (!checked(form, "isDestination")) redirect("/dashboard/countries");
  return { saved: true };
}

// Countries stay in the list (students, leads and universities point at them), so "delete"
// removes the destination page: its text and images go and it leaves the menu.
export async function deleteCountryPage(id: string) {
  await requirePermission("CONTENT", "edit");
  const before = await db.country.findUnique({ where: { id }, select: { imageUrl: true, flagUrl: true } });
  await db.country.update({
    where: { id },
    data: { description: null, tagline: null, content: null, imageUrl: null, flagUrl: null, isDestination: false },
  });
  releaseImages(before?.imageUrl, before?.flagUrl);
  updateTag("countries");
  redirect("/dashboard/countries");
}

// Picked from the "Add a destination" dropdown: mark it a destination and open its editor.
export async function addDestination(form: FormData) {
  await requirePermission("CONTENT", "edit");
  const id = text(form, "id");
  if (!id) return;
  // New destinations go to the end of the list.
  const last = await db.country.aggregate({ where: { isDestination: true }, _max: { sortOrder: true } });
  await db.country.update({ where: { id }, data: { isDestination: true, sortOrder: (last._max.sortOrder ?? -1) + 1 } });
  updateTag("countries");
  redirect(redirectPath(`/dashboard/countries?${new URLSearchParams({ edit: id })}`));
}

// Up/down arrows in the dashboard list set the order destinations appear on the site.
export async function moveCountry(id: string, direction: "up" | "down") {
  await requirePermission("CONTENT", "edit");
  const rows = await db.country.findMany({ where: { isDestination: true }, orderBy: [{ sortOrder: "asc" }, { name: "asc" }], select: { id: true } });
  await moveRow(rows, id, direction, (rowId, sortOrder) => db.country.update({ where: { id: rowId }, data: { sortOrder } }));
  updateTag("countries");
}
