import "server-only";

import { randomUUID } from "node:crypto";
import { lookup } from "node:dns/promises";
import { isIP } from "node:net";
import { db } from "@/lib/db";
import { MAX_IMAGE_BYTES, processImage } from "@/lib/images";
import { putObject } from "@/lib/storage";

// Downloads an image from a public https address, re-encodes it like a dashboard upload
// (processImage) and stores it in our own storage. Used by the university CSV import.

// Loopback, private, link-local and other non-public ranges, so a pasted address cannot
// make the server reach internal services.
function isPrivateAddress(ip: string) {
  if (ip.includes(":")) {
    const v = ip.toLowerCase();
    if (v.startsWith("::ffff:")) return isPrivateAddress(v.slice(7));
    return v === "::1" || v === "::" || v.startsWith("fc") || v.startsWith("fd") || v.startsWith("fe80");
  }
  const [a, b] = ip.split(".").map(Number);
  return a === 0 || a === 10 || a === 127 || (a === 100 && b >= 64 && b <= 127) || (a === 169 && b === 254)
    || (a === 172 && b >= 16 && b <= 31) || (a === 192 && b === 168) || a >= 224;
}

async function assertPublicHttps(raw: string) {
  const url = new URL(raw);
  if (url.protocol !== "https:") throw new Error("Image addresses must start with https://.");
  if (isIP(url.hostname)) throw new Error("Use a web address, not an IP address.");
  const addresses = await lookup(url.hostname, { all: true });
  if (!addresses.length || addresses.some((a) => isPrivateAddress(a.address))) throw new Error("This address is not allowed.");
  return url;
}

async function download(raw: string) {
  let url = await assertPublicHttps(raw);
  // Follow up to 3 redirects by hand, checking each address.
  for (let hop = 0; hop < 4; hop++) {
    const response = await fetch(url, {
      redirect: "manual",
      signal: AbortSignal.timeout(15_000),
      headers: { "User-Agent": "NRC-Education-Importer/1.0 (+https://nrcedu-uk.com)" },
    });
    if (response.status >= 300 && response.status < 400 && response.headers.get("location")) {
      url = await assertPublicHttps(new URL(response.headers.get("location")!, url).toString());
      continue;
    }
    if (!response.ok || !response.body) throw new Error(`The image could not be downloaded (${response.status}).`);
    if (Number(response.headers.get("content-length") ?? 0) > MAX_IMAGE_BYTES) throw new Error("The image is over 4 MB.");

    const reader = response.body.getReader();
    const chunks: Uint8Array[] = [];
    let total = 0;
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      total += value.byteLength;
      if (total > MAX_IMAGE_BYTES) { await reader.cancel(); throw new Error("The image is over 4 MB."); }
      chunks.push(value);
    }
    const bytes = new Uint8Array(total);
    let offset = 0;
    for (const c of chunks) { bytes.set(c, offset); offset += c.byteLength; }
    return bytes;
  }
  throw new Error("Too many redirects.");
}

// Stores bytes as a processed image and records it like a dashboard upload. Returns its address.
export async function storeImage(bytes: Uint8Array, originalName: string | null) {
  const image = await processImage(bytes);
  const date = new Date();
  const key = `images/${date.getUTCFullYear()}/${String(date.getUTCMonth() + 1).padStart(2, "0")}/${randomUUID()}.webp`;
  const url = await putObject(key, image.data, image.contentType);
  await db.upload.create({
    data: { key, url, contentType: image.contentType, size: image.data.byteLength, width: image.width, height: image.height, originalName: originalName?.slice(0, 200) || null },
  });
  return url;
}

export async function storeImageFromUrl(raw: string) {
  const bytes = await download(raw);
  return storeImage(bytes, raw);
}
