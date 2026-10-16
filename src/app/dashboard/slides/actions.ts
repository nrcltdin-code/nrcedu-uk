"use server";

import { updateTag } from "next/cache";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { releaseImages } from "@/lib/uploads";
import { imageHosts, isAllowedImageUrl } from "@/lib/image-hosts";
import { requirePermission } from "@/lib/session";

export type SlideFormState = { error?: string };

const text = (form: FormData, key: string) => String(form.get(key) ?? "").trim();

// Links may point inside this site ("/universities") or to a full https address.
function isValidLink(value: string) {
  if (value.startsWith("/") && !value.startsWith("//")) return true;
  try {
    return new URL(value).protocol === "https:";
  } catch {
    return false;
  }
}

export async function saveSlide(_previous: SlideFormState, form: FormData): Promise<SlideFormState> {
  await requirePermission("CONTENT", "edit");

  const id = text(form, "id");
  const title = text(form, "title");
  const subtitle = text(form, "subtitle");
  const imageUrl = text(form, "imageUrl");
  const buttonLabel = text(form, "buttonLabel");
  const buttonHref = text(form, "buttonHref");
  const sortOrder = Number.parseInt(text(form, "sortOrder") || "0", 10);

  if (!title) return { error: "Enter a title." };
  if (title.length > 120) return { error: "Keep the title under 120 characters." };
  if (subtitle.length > 300) return { error: "Keep the text under 300 characters." };
  if (imageUrl && !isAllowedImageUrl(imageUrl)) {
    return { error: `The image address must start with https:// and come from: ${imageHosts.join(", ")}.` };
  }
  if (Boolean(buttonLabel) !== Boolean(buttonHref)) {
    return { error: "Fill in both the button text and the button link, or leave both empty." };
  }
  if (buttonHref && !isValidLink(buttonHref)) {
    return { error: "The button link must start with / (a page on this site) or https://." };
  }
  if (!Number.isInteger(sortOrder)) return { error: "Position must be a whole number." };

  const data = {
    title,
    subtitle: subtitle || null,
    imageUrl: imageUrl || null,
    buttonLabel: buttonLabel || null,
    buttonHref: buttonHref || null,
    sortOrder,
    isPublished: form.get("isPublished") === "on",
  };

  if (id) {
    const before = await db.heroSlide.findUnique({ where: { id }, select: { imageUrl: true } });
    await db.heroSlide.update({ where: { id }, data });
    releaseImages(before?.imageUrl);
  }
  else await db.heroSlide.create({ data });

  updateTag("hero-slides");
  redirect("/dashboard/slides");
}

export async function setSlidePublished(id: string, isPublished: boolean) {
  await requirePermission("CONTENT", "edit");
  await db.heroSlide.update({ where: { id }, data: { isPublished } });
  updateTag("hero-slides");
}

export async function deleteSlide(id: string) {
  await requirePermission("CONTENT", "edit");
  const deleted = await db.heroSlide.delete({ where: { id } });
  releaseImages(deleted.imageUrl);
  updateTag("hero-slides");
  redirect("/dashboard/slides");
}

// Swaps a slide with its neighbour, then renumbers so positions stay 0, 1, 2…
export async function moveSlide(id: string, direction: "up" | "down") {
  await requirePermission("CONTENT", "edit");

  const slides = await db.heroSlide.findMany({
    orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
    select: { id: true },
  });
  const from = slides.findIndex((slide) => slide.id === id);
  const to = direction === "up" ? from - 1 : from + 1;
  if (from === -1 || to < 0 || to >= slides.length) return;

  [slides[from], slides[to]] = [slides[to], slides[from]];
  await db.$transaction(
    slides.map((slide, index) => db.heroSlide.update({ where: { id: slide.id }, data: { sortOrder: index } })),
  );
  updateTag("hero-slides");
}
