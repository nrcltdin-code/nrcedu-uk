import "server-only";
import { AwsClient } from "aws4fetch";

// S3-compatible object storage (Cloudflare R2). Fill the STORAGE_* values in .env:
//   STORAGE_ENDPOINT          https://<account id>.r2.cloudflarestorage.com
//   STORAGE_BUCKET            bucket name
//   STORAGE_ACCESS_KEY_ID     R2 API token key id (Object Read & Write, this bucket only)
//   STORAGE_SECRET_ACCESS_KEY R2 API token secret
//   STORAGE_PUBLIC_URL        public address of the bucket, e.g. https://media.nrcedu-uk.com

const config = {
  endpoint: process.env.STORAGE_ENDPOINT?.replace(/\/+$/, ""),
  bucket: process.env.STORAGE_BUCKET,
  accessKeyId: process.env.STORAGE_ACCESS_KEY_ID,
  secretAccessKey: process.env.STORAGE_SECRET_ACCESS_KEY,
  publicUrl: process.env.STORAGE_PUBLIC_URL?.replace(/\/+$/, ""),
};

export const storageEnabled = Object.values(config).every(Boolean);

let client: AwsClient | null = null;
function getClient() {
  client ??= new AwsClient({
    accessKeyId: config.accessKeyId!,
    secretAccessKey: config.secretAccessKey!,
    service: "s3",
    region: "auto",
  });
  return client;
}

// Stores a file under `key` and returns its public address.
export async function putObject(key: string, body: Uint8Array<ArrayBuffer>, contentType: string): Promise<string> {
  if (!storageEnabled) throw new Error("File storage is not configured.");

  const response = await getClient().fetch(`${config.endpoint}/${config.bucket}/${key}`, {
    method: "PUT",
    body,
    headers: {
      "Content-Type": contentType,
      "Content-Length": String(body.byteLength),
      // Keys are random and never reused, so files can be cached for good.
      "Cache-Control": "public, max-age=31536000, immutable",
    },
  });
  if (!response.ok) {
    throw new Error(`Storage upload failed: ${response.status} ${await response.text().catch(() => "")}`);
  }
  return `${config.publicUrl}/${key}`;
}

// ---- Private bucket: student documents ----
// STORAGE_PRIVATE_BUCKET must have NO public access. Files are only reachable through
// short-lived signed links handed out after an access check. The bucket also needs a CORS
// rule allowing PUT from the site's address, because browsers upload to it directly.

const privateBucket = process.env.STORAGE_PRIVATE_BUCKET;
export const privateStorageEnabled = Boolean(config.endpoint && config.accessKeyId && config.secretAccessKey && privateBucket);

const privateUrl = (key: string) => `${config.endpoint}/${privateBucket}/${key}`;

async function presign(url: URL, method: "GET" | "PUT", seconds: number, headers?: Record<string, string>) {
  url.searchParams.set("X-Amz-Expires", String(seconds));
  const signed = await getClient().sign(url.toString(), { method, headers, aws: { signQuery: true } });
  return signed.url;
}

// Upload link for one file of exactly `size` bytes; R2 refuses any other length.
export function presignPrivateUpload(key: string, size: number, seconds = 300) {
  return presign(new URL(privateUrl(key)), "PUT", seconds, { "content-length": String(size) });
}

// Download link that always saves the file instead of opening it in the site's context.
export function presignPrivateDownload(key: string, fileName: string, contentType: string, seconds = 60) {
  const url = new URL(privateUrl(key));
  const safeName = fileName.replace(/[^\w.\- ]+/g, "_").slice(0, 120) || "document";
  url.searchParams.set("response-content-disposition", `attachment; filename="${safeName}"`);
  url.searchParams.set("response-content-type", contentType);
  return presign(url, "GET", seconds);
}

export async function headPrivateObject(key: string) {
  const response = await getClient().fetch(privateUrl(key), { method: "HEAD" });
  if (!response.ok) return null;
  return { size: Number(response.headers.get("content-length") ?? 0) };
}

export async function getPrivateObject(key: string, range?: string) {
  const response = await getClient().fetch(privateUrl(key), { headers: range ? { range } : undefined });
  if (!response.ok) throw new Error(`Storage read failed: ${response.status}`);
  return new Uint8Array(await response.arrayBuffer());
}

export async function putPrivateObject(key: string, body: Uint8Array<ArrayBuffer>, contentType: string) {
  const response = await getClient().fetch(privateUrl(key), {
    method: "PUT",
    body,
    headers: { "Content-Type": contentType, "Content-Length": String(body.byteLength) },
  });
  if (!response.ok) throw new Error(`Storage upload failed: ${response.status}`);
}

export async function deletePrivateObject(key: string) {
  await getClient().fetch(privateUrl(key), { method: "DELETE" });
}

// Removes a file from the public bucket. Deleting a key that is already gone is not an error.
export async function deleteObject(key: string) {
  const response = await getClient().fetch(`${config.endpoint}/${config.bucket}/${key}`, { method: "DELETE" });
  if (!response.ok && response.status !== 404) throw new Error(`Storage delete failed: ${response.status}`);
}

// Lists files in the private bucket whose names start with `prefix`, page by page (S3 ListObjectsV2).
export async function* listPrivateObjects(prefix: string) {
  let token: string | undefined;
  do {
    const url = new URL(`${config.endpoint}/${privateBucket}`);
    url.searchParams.set("list-type", "2");
    url.searchParams.set("prefix", prefix);
    if (token) url.searchParams.set("continuation-token", token);
    const response = await getClient().fetch(url.toString());
    if (!response.ok) throw new Error(`Storage list failed: ${response.status}`);
    const xml = await response.text();
    const tag = (source: string, name: string) => source.match(new RegExp(`<${name}>([^<]*)</${name}>`))?.[1];
    for (const [, item] of xml.matchAll(/<Contents>([\s\S]*?)<\/Contents>/g)) {
      const key = tag(item, "Key")?.replaceAll("&amp;", "&");
      const modified = tag(item, "LastModified");
      if (key && modified) yield { key, lastModified: new Date(modified) };
    }
    token = tag(xml, "IsTruncated") === "true" ? tag(xml, "NextContinuationToken") : undefined;
  } while (token);
}
