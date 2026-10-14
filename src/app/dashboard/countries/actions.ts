"use server";

import { updateTag } from "next/cache";
import { db } from "@/lib/db";
import { checked, imageError, text } from "@/lib/form";
import type { FormState } from "@/lib/form";
import { requirePermission } from "@/lib/session";

// The country list is seeded (all 197); here staff only fill in details and choose destinations.
export async function saveCountry(_previous: FormState, form: FormData): Promise<FormState> {
  await requirePermission("CONTENT", "edit");

  const id = text(form, "id");
  const description = text(form, "description");
  const imageUrl = text(form, "imageUrl");
  const flagUrl = text(form, "flagUrl");

  if (description.length > 5000) return { error: "Keep the description under 5,000 characters." };
  const badImage = imageError(imageUrl, "The image address") ?? imageError(flagUrl, "The flag address");
  if (badImage) return { error: badImage };

  await db.country.update({
    where: { id },
    data: {
      description: description || null,
      imageUrl: imageUrl || null,
      flagUrl: flagUrl || null,
      isDestination: checked(form, "isDestination"),
    },
  });

  updateTag("countries");
  return { saved: true };
}
