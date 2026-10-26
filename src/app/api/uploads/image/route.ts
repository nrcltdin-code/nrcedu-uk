import { randomUUID } from "node:crypto";
import { db } from "@/lib/db";
import { ImageRejected, MAX_IMAGE_BYTES, processImage } from "@/lib/images";
import { isSameOrigin } from "@/lib/same-origin";
import { can, getCurrentUser } from "@/lib/session";
import { putObject, storageEnabled } from "@/lib/storage";

// Image uploads for website content. Checks, in order: same-site request, signed in and active,
// allowed to edit content, under the rate limit, under the size limit, a real image (by its
// bytes), then re-encoded before it is stored under a random name.

const PER_10_MINUTES = 30;
const PER_DAY = 300;
const BODY_LIMIT = MAX_IMAGE_BYTES + 64 * 1024; // the image plus the multipart wrapping

const fail = (status: number, error: string) => Response.json({ error }, { status });

// Reads the body but stops as soon as it passes the limit, whatever Content-Length claims.
async function readLimited(request: Request): Promise<Uint8Array<ArrayBuffer> | null> {
  const declared = Number(request.headers.get("content-length") ?? 0);
  if (declared > BODY_LIMIT) return null;
  if (!request.body) return new Uint8Array();

  const reader = request.body.getReader();
  const chunks: Uint8Array[] = [];
  let total = 0;
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    total += value.byteLength;
    if (total > BODY_LIMIT) {
      await reader.cancel();
      return null;
    }
    chunks.push(value);
  }
  const body = new Uint8Array(total);
  let offset = 0;
  for (const chunk of chunks) {
    body.set(chunk, offset);
    offset += chunk.byteLength;
  }
  return body;
}

export async function POST(request: Request) {
  if (!isSameOrigin(request)) return fail(403, "Request refused.");

  const user = await getCurrentUser();
  if (!user) return fail(401, "Please sign in again.");
  // Anyone signed in may upload their own profile photo; other images need content editing rights.
  const avatar = new URL(request.url).searchParams.get("purpose") === "avatar";
  if (!avatar && !(await can(user, "CONTENT", "edit"))) return fail(403, "You do not have permission to upload images.");

  if (!storageEnabled) return fail(503, "Image uploads are not set up yet. Paste an image address instead.");

  const now = Date.now();
  const [recent, today] = await Promise.all([
    db.upload.count({ where: { uploadedById: user.id, createdAt: { gte: new Date(now - 10 * 60_000) } } }),
    db.upload.count({ where: { uploadedById: user.id, createdAt: { gte: new Date(now - 24 * 3_600_000) } } }),
  ]);
  if (recent >= PER_10_MINUTES || today >= PER_DAY) {
    return fail(429, "Too many uploads. Please wait a few minutes and try again.");
  }

  const body = await readLimited(request);
  if (!body) return fail(413, "The image is too large. The limit is 4 MB.");

  let file: FormDataEntryValue | null;
  try {
    const form = await new Request(request.url, {
      method: "POST",
      headers: { "content-type": request.headers.get("content-type") ?? "" },
      body,
    }).formData();
    file = form.get("file");
  } catch {
    return fail(400, "The upload could not be read.");
  }
  if (!(file instanceof File) || file.size === 0) return fail(400, "Choose an image to upload.");
  if (file.size > MAX_IMAGE_BYTES) return fail(413, "The image is too large. The limit is 4 MB.");

  let image;
  try {
    image = await processImage(new Uint8Array(await file.arrayBuffer()));
  } catch (error) {
    if (error instanceof ImageRejected) return fail(415, error.message);
    throw error;
  }

  const date = new Date();
  const key = `images/${date.getUTCFullYear()}/${String(date.getUTCMonth() + 1).padStart(2, "0")}/${randomUUID()}.webp`;

  let url: string;
  try {
    url = await putObject(key, image.data, image.contentType);
  } catch (error) {
    console.error("Image upload:", error);
    return fail(502, "The image could not be stored. Please try again.");
  }

  await db.upload.create({
    data: {
      key,
      url,
      contentType: image.contentType,
      size: image.data.byteLength,
      width: image.width,
      height: image.height,
      // Kept for the record only; never used to build the stored file's name.
      originalName: file.name.slice(0, 200) || null,
      uploadedById: user.id,
    },
  });

  return Response.json({ url, width: image.width, height: image.height });
}
