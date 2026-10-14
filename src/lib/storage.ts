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
