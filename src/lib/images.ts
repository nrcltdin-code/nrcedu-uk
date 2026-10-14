import "server-only";
import sharp from "sharp";

export const MAX_IMAGE_BYTES = 4 * 1024 * 1024; // stays under Vercel's 4.5 MB request limit
const MAX_INPUT_PIXELS = 40_000_000; // about 7,700 × 5,200; refuses "decompression bombs"
const MAX_EDGE = 2400; // larger images are scaled down
const MIN_EDGE = 16;

type Format = "jpeg" | "png" | "webp" | "gif" | "avif";

// Identify the file by its first bytes; the name and the type the browser reports are ignored.
// SVG is never accepted: it can carry scripts.
export function sniffImage(bytes: Uint8Array): Format | null {
  const at = (offset: number, ...values: number[]) => values.every((value, i) => bytes[offset + i] === value);
  const ascii = (offset: number, text: string) => at(offset, ...[...text].map((c) => c.charCodeAt(0)));

  if (at(0, 0xff, 0xd8, 0xff)) return "jpeg";
  if (at(0, 0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a)) return "png";
  if (ascii(0, "RIFF") && ascii(8, "WEBP")) return "webp";
  if (ascii(0, "GIF87a") || ascii(0, "GIF89a")) return "gif";
  if (ascii(4, "ftyp") && (ascii(8, "avif") || ascii(8, "avis"))) return "avif";
  return null;
}

export class ImageRejected extends Error {}

// Decodes and re-encodes the image as WebP. Re-encoding drops metadata (camera, GPS location)
// and anything appended or hidden inside the original file, so only plain pixels are stored.
export async function processImage(bytes: Uint8Array) {
  const format = sniffImage(bytes);
  if (!format) throw new ImageRejected("Only JPG, PNG, WebP, GIF or AVIF images can be uploaded.");

  const input = sharp(bytes, { limitInputPixels: MAX_INPUT_PIXELS, failOn: "error", animated: false });
  let meta;
  try {
    meta = await input.metadata();
  } catch {
    throw new ImageRejected("This image could not be read. It may be damaged, or too large in pixels.");
  }
  if (meta.format !== format && !(format === "avif" && meta.format === "heif")) {
    throw new ImageRejected("The file's contents do not match an image type.");
  }
  if (!meta.width || !meta.height || meta.width < MIN_EDGE || meta.height < MIN_EDGE) {
    throw new ImageRejected(`The image is too small (at least ${MIN_EDGE} × ${MIN_EDGE} pixels).`);
  }

  try {
    const { data, info } = await input
      .rotate() // apply the camera's orientation before the metadata is dropped
      .resize({ width: MAX_EDGE, height: MAX_EDGE, fit: "inside", withoutEnlargement: true })
      .webp({ quality: 82 })
      .toBuffer({ resolveWithObject: true });
    return { data: new Uint8Array(data), width: info.width, height: info.height, contentType: "image/webp" };
  } catch {
    throw new ImageRejected("This image could not be processed. Try saving it again as JPG or PNG.");
  }
}
