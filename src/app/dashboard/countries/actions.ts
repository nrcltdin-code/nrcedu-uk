"use server";

import { updateTag } from "next/cache";
import { db } from "@/lib/db";
import { releaseImages } from "@/lib/uploads";
import { checked, imageError, text } from "@/lib/form";
import type { FormState } from "@/lib/form";
import { requirePermission } from "@/lib/session";

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
}
