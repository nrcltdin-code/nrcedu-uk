"use server";

import { updateTag } from "next/cache";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { checked, imageError, isHttpsUrl, text } from "@/lib/form";
import type { FormState } from "@/lib/form";
import { moveRow } from "@/lib/reorder";
import { requirePermission } from "@/lib/session";

const path = "/dashboard/partners";

export async function savePartner(_previous: FormState, form: FormData): Promise<FormState> {
  await requirePermission("CONTENT", "edit");

  const id = text(form, "id");
  const name = text(form, "name");
  const logoUrl = text(form, "logoUrl");
  const website = text(form, "website");

  if (name.length < 2 || name.length > 150) return { error: "Enter the partner's name." };
  if (website && !isHttpsUrl(website)) return { error: "The website must start with https://." };
  const badImage = imageError(logoUrl, "The logo address");
  if (badImage) return { error: badImage };

  const data = { name, logoUrl: logoUrl || null, website: website || null, isPublished: checked(form, "isPublished") };
  if (id) await db.partner.update({ where: { id }, data });
  else await db.partner.create({ data: { ...data, sortOrder: await db.partner.count() } });

  updateTag("partners");
  redirect(path);
}

export async function setPartnerPublished(id: string, isPublished: boolean) {
  await requirePermission("CONTENT", "edit");
  await db.partner.update({ where: { id }, data: { isPublished } });
  updateTag("partners");
  redirect(path);
}

export async function movePartner(id: string, direction: "up" | "down") {
  await requirePermission("CONTENT", "edit");
  const rows = await db.partner.findMany({ orderBy: [{ sortOrder: "asc" }, { id: "asc" }], select: { id: true } });
  await moveRow(rows, id, direction, (rowId, sortOrder) => db.partner.update({ where: { id: rowId }, data: { sortOrder } }));
  updateTag("partners");
  redirect(path);
}

export async function deletePartner(id: string) {
  await requirePermission("CONTENT", "edit");
  await db.partner.delete({ where: { id } });
  updateTag("partners");
  redirect(path);
}
