"use server";

import { updateTag } from "next/cache";
import { redirect } from "next/navigation";
import type { Prisma } from "@/generated/prisma/client";
import { db } from "@/lib/db";
import { isSlug, isUniqueError, slugify, text } from "@/lib/form";
import type { FormState } from "@/lib/form";
import { requirePermission } from "@/lib/session";
import { parseFacts, parseTables } from "@/lib/test-prep";

// Exam guides (IELTS, PTE, GRE…): text, key facts and mark distribution tables.
// "test-prep" is the cache tag of the public pages and the navbar dropdown.

function readJson(form: FormData, key: string): unknown {
  try {
    return JSON.parse(String(form.get(key) ?? "[]"));
  } catch {
    return [];
  }
}

export async function saveTestPrep(_previous: FormState, form: FormData): Promise<FormState> {
  await requirePermission("CONTENT", "edit");
  const id = text(form, "id");
  const name = text(form, "name");
  const slug = text(form, "slug") || slugify(name);
  const summary = text(form, "summary");
  const content = text(form, "content");
  const sortOrder = Number.parseInt(text(form, "sortOrder") || "0", 10);

  if (name.length < 2 || name.length > 60) return { error: "Name the test, e.g. IELTS Academic." };
  if (!isSlug(slug)) return { error: "The web address may use lowercase letters, numbers and dashes only." };
  if (summary.length > 300) return { error: "Keep the summary under 300 characters." };
  if (content.length > 30000) return { error: "The guide is too long (30,000 characters at most)." };
  if (!Number.isInteger(sortOrder)) return { error: "Position must be a whole number." };

  const data = {
    name,
    slug,
    summary: summary || null,
    content: content || null,
    sortOrder,
    isPublished: form.get("isPublished") === "on",
    facts: parseFacts(readJson(form, "facts")) as Prisma.InputJsonValue,
    tables: parseTables(readJson(form, "tables")) as Prisma.InputJsonValue,
  };
  try {
    if (id) await db.testPrepPage.update({ where: { id }, data });
    else await db.testPrepPage.create({ data });
  } catch (error) {
    if (isUniqueError(error)) return { error: "Another test already uses that web address." };
    throw error;
  }
  updateTag("test-prep");
  if (!id) redirect("/dashboard/test-prep");
  return { saved: true };
}

export async function deleteTestPrep(id: string) {
  await requirePermission("CONTENT", "edit");
  await db.testPrepPage.delete({ where: { id } });
  updateTag("test-prep");
  redirect("/dashboard/test-prep");
}
