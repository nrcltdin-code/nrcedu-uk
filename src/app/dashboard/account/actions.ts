"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { text } from "@/lib/form";
import type { FormState } from "@/lib/form";
import { requireSignedInUser } from "@/lib/session";
import { isAllowedImageUrl } from "@/lib/image-hosts";
import { releaseImages } from "@/lib/uploads";

// Name, phone and profile photo for any role. A student's phone is also kept on their student record,
// which is what counsellors see.
export async function saveAccountDetails(_previous: FormState, form: FormData): Promise<FormState> {
  const user = await requireSignedInUser();
  const name = text(form, "name");
  const phone = text(form, "phone");

  if (name.length < 2 || name.length > 100) return { error: "Enter your full name." };
  if (phone.length > 30) return { error: "The phone number is too long." };
  const image = text(form, "image");
  // An unchanged photo is kept as it is (e.g. one Google supplied at sign-up).
  if (image && image !== user.image && !isAllowedImageUrl(image)) return { error: "Upload the photo with the Upload button." };

  await db.user.update({ where: { id: user.id }, data: { name, phone: phone || null, image: image || null } });
  if (user.image && user.image !== image) releaseImages(user.image);
  await db.studentProfile.updateMany({ where: { userId: user.id }, data: { phone: phone || null } });

  revalidatePath("/dashboard", "layout");
  return { saved: true };
}
