"use server";

import { revalidatePath, updateTag } from "next/cache";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { imageError, isSlug, isUniqueError, slugify, text } from "@/lib/form";
import type { FormState } from "@/lib/form";
import { requirePermission } from "@/lib/session";

// The submit button decides the status: "Save draft" keeps a post off the website,
// "Publish" puts it live. The publish date is set the first time a post goes live.
export async function savePost(_previous: FormState, form: FormData): Promise<FormState> {
  const user = await requirePermission("CONTENT", "edit");

  const id = text(form, "id");
  const title = text(form, "title");
  const slug = text(form, "slug") || slugify(title);
  const excerpt = text(form, "excerpt");
  const coverUrl = text(form, "coverUrl");
  // Not trimmed per line: Markdown cares about leading spaces.
  const content = String(form.get("content") ?? "").replace(/\r\n/g, "\n").trim();
  const status = text(form, "intent") === "publish" ? "PUBLISHED" : "DRAFT";

  if (title.length < 3 || title.length > 200) return { error: "Enter a title (3 to 200 characters)." };
  if (!isSlug(slug)) return { error: "The web address may use only lowercase letters, numbers and hyphens." };
  if (excerpt.length > 300) return { error: "Keep the summary under 300 characters." };
  if (!content) return { error: "Write the article before saving." };
  if (content.length > 100_000) return { error: "The article is too long." };
  const badImage = imageError(coverUrl, "The cover image address");
  if (badImage) return { error: badImage };

  const existing = id ? await db.blogPost.findUnique({ where: { id }, select: { publishedAt: true } }) : null;
  if (id && !existing) return { error: "This post no longer exists." };

  const data = {
    title,
    slug,
    excerpt: excerpt || null,
    coverUrl: coverUrl || null,
    content,
    status,
    publishedAt: status === "PUBLISHED" ? (existing?.publishedAt ?? new Date()) : (existing?.publishedAt ?? null),
  } as const;

  let savedId = id;
  try {
    if (id) await db.blogPost.update({ where: { id }, data });
    else savedId = (await db.blogPost.create({ data: { ...data, authorId: user.id } })).id;
  } catch (error) {
    if (isUniqueError(error)) return { error: "Another post already uses this web address." };
    throw error;
  }

  updateTag("posts");
  if (!id) redirect(`/dashboard/blog/${savedId}`);
  revalidatePath(`/dashboard/blog/${id}`);
  return { saved: true };
}

export async function deletePost(id: string) {
  await requirePermission("CONTENT", "edit");
  await db.blogPost.delete({ where: { id } });
  updateTag("posts");
  redirect("/dashboard/blog");
}
