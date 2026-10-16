"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { text } from "@/lib/form";
import type { FormState } from "@/lib/form";
import { requireUser } from "@/lib/session";

// Name and phone for any role. A student's phone is also kept on their student record,
// which is what counsellors see.
export async function saveAccountDetails(_previous: FormState, form: FormData): Promise<FormState> {
  const user = await requireUser();
  const name = text(form, "name");
  const phone = text(form, "phone");

  if (name.length < 2 || name.length > 100) return { error: "Enter your full name." };
  if (phone.length > 30) return { error: "The phone number is too long." };

  await db.user.update({ where: { id: user.id }, data: { name, phone: phone || null } });
  await db.studentProfile.updateMany({ where: { userId: user.id }, data: { phone: phone || null } });

  revalidatePath("/dashboard", "layout");
  return { saved: true };
}
