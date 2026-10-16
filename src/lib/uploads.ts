import "server-only";
import { after } from "next/server";
import { db } from "@/lib/db";
import { deleteObject, storageEnabled } from "@/lib/storage";

// Uploaded website images live in R2 and are listed in the Upload table; records point to them
// by URL. When a record is deleted or its image is replaced, the old file is removed once
// nothing else points to it. The daily cron also clears uploads that were never saved anywhere.

async function inUse(url: string) {
  const counts = await Promise.all([
    db.country.count({ where: { OR: [{ imageUrl: url }, { flagUrl: url }] } }),
    db.university.count({ where: { OR: [{ logoUrl: url }, { coverUrl: url }] } }),
    db.subject.count({ where: { imageUrl: url } }),
    db.office.count({ where: { imageUrl: url } }),
    db.heroSlide.count({ where: { imageUrl: url } }),
    db.testPrepPage.count({ where: { imageUrl: url } }),
    db.blogPost.count({ where: { coverUrl: url } }),
    db.testimonial.count({ where: { photoUrl: url } }),
    db.partner.count({ where: { logoUrl: url } }),
  ]);
  return counts.some(Boolean);
}

async function removeIfUnused(upload: { id: string; key: string; url: string }) {
  if (await inUse(upload.url)) return false;
  await deleteObject(upload.key);
  await db.upload.delete({ where: { id: upload.id } });
  return true;
}

// Call after a delete or update with the image URLs the record had before. URLs that are not
// our uploads (pasted addresses) or are still used elsewhere are left alone. Runs after the response.
export function releaseImages(...urls: (string | null | undefined)[]) {
  const wanted = [...new Set(urls.filter((url): url is string => Boolean(url)))];
  if (!wanted.length || !storageEnabled) return;
  after(async () => {
    const uploads = await db.upload.findMany({ where: { url: { in: wanted } }, select: { id: true, key: true, url: true } });
    for (const upload of uploads) {
      await removeIfUnused(upload).catch((error) => console.error("Image cleanup:", error));
    }
  });
}

// Daily: uploads older than a day that no record uses (picked but the form was never saved,
// or left behind by a delete that missed cleanup).
export async function sweepUnusedImages() {
  if (!storageEnabled) return 0;
  const uploads = await db.upload.findMany({
    where: { createdAt: { lt: new Date(Date.now() - 86_400_000) } },
    select: { id: true, key: true, url: true },
  });
  let removed = 0;
  for (const upload of uploads) {
    if (await removeIfUnused(upload).catch((error) => (console.error("Image sweep:", error), false))) removed++;
  }
  return removed;
}
