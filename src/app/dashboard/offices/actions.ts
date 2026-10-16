"use server";

import { updateTag } from "next/cache";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { releaseImages } from "@/lib/uploads";
import { checked, imageError, isHttpsUrl, text } from "@/lib/form";
import type { FormState } from "@/lib/form";
import { moveRow } from "@/lib/reorder";
import { requirePermission } from "@/lib/session";

const path = "/dashboard/offices";

export async function saveOffice(_previous: FormState, form: FormData): Promise<FormState> {
  await requirePermission("CONTENT", "edit");

  const id = text(form, "id");
  const data = {
    name: text(form, "name"),
    city: text(form, "city"),
    country: text(form, "country"),
    address: text(form, "address"),
    phone: text(form, "phone") || null,
    email: text(form, "email").toLowerCase() || null,
    openingHours: text(form, "openingHours") || null,
    mapUrl: text(form, "mapUrl") || null,
    imageUrl: text(form, "imageUrl") || null,
    isHeadOffice: checked(form, "isHeadOffice"),
    isPublished: checked(form, "isPublished"),
  };

  if (data.name.length < 2 || data.name.length > 120) return { error: "Enter the office name." };
  if (!data.city || data.city.length > 80) return { error: "Enter the city." };
  if (!data.country || data.country.length > 80) return { error: "Enter the country." };
  if (data.address.length < 5 || data.address.length > 300) return { error: "Enter the full address." };
  if (data.phone && !/^\+?[\d\s()-]{6,25}$/.test(data.phone)) return { error: "Enter the phone using digits, spaces and an optional +." };
  if (data.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) return { error: "Enter a valid email address." };
  if (data.openingHours && data.openingHours.length > 120) return { error: "Keep the opening hours under 120 characters." };
  if (data.mapUrl && !isHttpsUrl(data.mapUrl)) return { error: "The map link must start with https://." };
  const badImage = imageError(data.imageUrl ?? "", "The photo address");
  if (badImage) return { error: badImage };

  const before = id ? await db.office.findUnique({ where: { id }, select: { imageUrl: true } }) : null;
  // Only one head office: marking this one clears the flag on the others.
  await db.$transaction(async (tx) => {
    if (data.isHeadOffice) {
      await tx.office.updateMany({ where: { isHeadOffice: true, ...(id && { NOT: { id } }) }, data: { isHeadOffice: false } });
    }
    if (id) await tx.office.update({ where: { id }, data });
    else await tx.office.create({ data: { ...data, sortOrder: await tx.office.count() } });
  });
  releaseImages(before?.imageUrl);

  updateTag("offices");
  redirect(path);
}

export async function setOfficePublished(id: string, isPublished: boolean) {
  await requirePermission("CONTENT", "edit");
  await db.office.update({ where: { id }, data: { isPublished } });
  updateTag("offices");
  redirect(path);
}

export async function moveOffice(id: string, direction: "up" | "down") {
  await requirePermission("CONTENT", "edit");
  const rows = await db.office.findMany({ orderBy: [{ sortOrder: "asc" }, { id: "asc" }], select: { id: true } });
  await moveRow(rows, id, direction, (rowId, sortOrder) => db.office.update({ where: { id: rowId }, data: { sortOrder } }));
  updateTag("offices");
  redirect(path);
}

export async function deleteOffice(id: string) {
  await requirePermission("CONTENT", "edit");
  const deleted = await db.office.delete({ where: { id } });
  releaseImages(deleted.imageUrl);
  updateTag("offices");
  redirect(path);
}
