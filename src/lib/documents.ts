import "server-only";
import { createHmac, timingSafeEqual } from "node:crypto";
import sharp from "sharp";
import type { DocumentStatus, DocumentType } from "@/generated/prisma/client";
import { findAgentScope } from "@/lib/agent";
import { db } from "@/lib/db";
import { can } from "@/lib/session";
import { deletePrivateObject, getPrivateObject, headPrivateObject, listPrivateObjects, privateStorageEnabled, putPrivateObject } from "@/lib/storage";
import type { CurrentUser } from "@/lib/session";

export const MAX_DOCUMENT_BYTES = 10 * 1024 * 1024;

export const documentTypeLabels: Record<DocumentType, string> = {
  PASSPORT: "Passport",
  PHOTO: "Photo",
  TRANSCRIPT: "Transcript",
  CERTIFICATE: "Certificate",
  ENGLISH_TEST: "English test result",
  SOP: "Statement of purpose",
  RECOMMENDATION_LETTER: "Recommendation letter",
  CV: "CV",
  FINANCIAL: "Financial document",
  OFFER_LETTER: "Offer letter",
  CAS: "CAS",
  VISA: "Visa",
  OTHER: "Other",
};

export type DocumentKind = "pdf" | "jpeg" | "png";
export const documentContentTypes: Record<DocumentKind, string> = { pdf: "application/pdf", jpeg: "image/jpeg", png: "image/png" };

// What the file really is, from its first bytes. Names and browser-reported types are ignored.
export function sniffDocument(bytes: Uint8Array): DocumentKind | null {
  const at = (offset: number, ...values: number[]) => values.every((value, i) => bytes[offset + i] === value);
  if (at(0, 0x25, 0x50, 0x44, 0x46, 0x2d)) return "pdf"; // %PDF-
  if (at(0, 0xff, 0xd8, 0xff)) return "jpeg";
  if (at(0, 0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a)) return "png";
  return null;
}

// Scans and phone photos are re-encoded: strips metadata (GPS location) and anything hidden in the file.
export async function cleanDocumentImage(bytes: Uint8Array) {
  const data = await sharp(bytes, { limitInputPixels: 60_000_000, failOn: "error" })
    .rotate()
    .resize({ width: 3500, height: 3500, fit: "inside", withoutEnlargement: true })
    .jpeg({ quality: 88, mozjpeg: true })
    .toBuffer();
  return new Uint8Array(data);
}

// ---- Upload tickets ----
// The server hands the browser a signed ticket with the upload link; the browser sends the
// ticket back when the upload is done. The signature stops anyone changing whose record the
// file lands on, its type or its key.

export type UploadTicket = {
  key: string;
  studentId: string;
  applicationId: string | null;
  requestId: string | null;
  type: DocumentType;
  name: string;
  size: number;
  userId: string;
  expires: number;
};

const secret = () => {
  const value = process.env.AUTH_SECRET;
  if (!value) throw new Error("AUTH_SECRET is not set.");
  return value;
};
const sign = (payload: string) => createHmac("sha256", secret()).update(`document-ticket:${payload}`).digest("base64url");

export function createTicket<T extends { userId: string; expires: number } = UploadTicket>(ticket: T) {
  const payload = Buffer.from(JSON.stringify(ticket)).toString("base64url");
  return `${payload}.${sign(payload)}`;
}

export function readTicket<T extends { userId: string; expires: number } = UploadTicket>(token: string, userId: string): T | null {
  const [payload, signature] = token.split(".");
  if (!payload || !signature) return null;
  const expected = Buffer.from(sign(payload));
  const given = Buffer.from(signature);
  if (expected.length !== given.length || !timingSafeEqual(expected, given)) return null;
  try {
    const ticket = JSON.parse(Buffer.from(payload, "base64url").toString()) as T;
    if (ticket.userId !== userId || ticket.expires < Date.now()) return null;
    return ticket;
  } catch {
    return null;
  }
}

// ---- Who may see or add documents for a student ----
// Staff: by their Students permission. Students: only their own record. Agents: only students
// they (or, for an agency owner, their team) added. Agents and students arrive with their portals (4.4, 4.5), but the rule lives here.
export async function canAccessStudent(user: CurrentUser, studentId: string, action: "view" | "edit") {
  if (user.role === "ADMIN" || user.role === "STAFF") return can(user, "STUDENTS", action);
  if (user.role === "STUDENT") {
    return (await db.studentProfile.count({ where: { id: studentId, userId: user.id } })) > 0;
  }
  if (user.role === "AGENT") {
    const scope = await findAgentScope(user);
    if (!scope || (action === "edit" && !scope.can("DOCUMENTS"))) return false;
    return (await db.studentProfile.count({ where: { id: studentId, ...scope.students } })) > 0;
  }
  return false;
}

// Daily: files under documents/ that no Document row points to. These are uploads whose
// "finish" step never ran (page closed or reloaded mid-upload). Only files over a day old are
// touched, so an upload in progress is never removed. Skipped in development: a local database
// shares the bucket with the live site but not its Document rows, so live files would look unused.
export async function sweepAbandonedDocuments() {
  if (!privateStorageEnabled || process.env.NODE_ENV === "development") return 0;
  const cutoff = Date.now() - 86_400_000;
  let removed = 0;
  let batch: string[] = [];

  const flush = async () => {
    const saved = await db.document.findMany({ where: { fileKey: { in: batch } }, select: { fileKey: true } });
    const known = new Set(saved.map((document) => document.fileKey));
    for (const key of batch) {
      if (known.has(key)) continue;
      await deletePrivateObject(key);
      removed++;
    }
    batch = [];
  };

  for await (const object of listPrivateObjects("documents/")) {
    if (object.lastModified.getTime() > cutoff) continue;
    batch.push(object.key);
    if (batch.length >= 500) await flush();
  }
  if (batch.length) await flush();
  return removed;
}

// A request's status follows its files: any approved file means approved (and the upload
// closes); otherwise a file waiting for review means uploaded; only rejected files means
// upload again. Waived stays waived. Call after any file on the request changes.
export async function syncRequestStatus(requestId: string | null) {
  if (!requestId) return;
  const request = await db.documentRequest.findUnique({ where: { id: requestId }, select: { status: true, documents: { select: { status: true } } } });
  if (!request || request.status === "WAIVED") return;
  const has = (status: DocumentStatus) => request.documents.some((d) => d.status === status);
  const status = has("APPROVED") ? "APPROVED" : has("PENDING") ? "UPLOADED" : has("REJECTED") ? "NEEDS_REUPLOAD" : "REQUESTED";
  await db.documentRequest.update({
    where: { id: requestId },
    data: { status, ...(status === "APPROVED" ? { isOpen: false } : status === "NEEDS_REUPLOAD" ? { isOpen: true } : {}) },
  });
}

// The checks run on every uploaded file where it landed: right size, really a PDF, JPG or PNG;
// images are re-encoded. Anything that fails is deleted. Returns the stored name and type.
export async function checkUploadedFile(key: string, size: number, name: string): Promise<{ name: string; contentType: string } | { status: number; error: string }> {
  const reject = async (status: number, error: string) => {
    await deletePrivateObject(key).catch(() => {});
    return { status, error };
  };
  const head = await headPrivateObject(key);
  if (!head) return { status: 400, error: "The file did not arrive. Please try again." };
  if (head.size !== size || head.size > MAX_DOCUMENT_BYTES) return reject(413, "The file is too large. The limit is 10 MB.");
  try {
    const kind = sniffDocument(await getPrivateObject(key, "bytes=0-15"));
    if (!kind) return reject(415, "Only PDF, JPG or PNG files can be uploaded.");
    if (kind !== "pdf") {
      const clean = await cleanDocumentImage(await getPrivateObject(key)).catch(() => null);
      if (!clean) return reject(415, "This image could not be read. It may be damaged.");
      await putPrivateObject(key, clean, "image/jpeg");
    }
    const base = name.replace(/.(pdf|jpe?g|png)$/i, "");
    return kind === "pdf" ? { name: `${base}.pdf`, contentType: documentContentTypes.pdf } : { name: `${base}.jpg`, contentType: "image/jpeg" };
  } catch (error) {
    console.error("Document check:", error);
    return reject(502, "The file could not be checked. Please try again.");
  }
}
