import { randomUUID } from "node:crypto";
import type { DocumentType } from "@/generated/prisma/client";
import { acceptsUpload } from "@/lib/application-flow";
import { db } from "@/lib/db";
import { canAccessStudent, createTicket, documentTypeLabels, MAX_DOCUMENT_BYTES } from "@/lib/documents";
import { isSameOrigin } from "@/lib/same-origin";
import { getCurrentUser } from "@/lib/session";
import { presignPrivateUpload, privateStorageEnabled } from "@/lib/storage";

// Step 1 of a document upload: checks who is asking and what for, then returns a short-lived
// link the browser uploads the file to directly (Vercel caps request bodies at 4.5 MB), plus a
// signed ticket to hand back to /api/documents/finish.

const PER_10_MINUTES = 30;
const PER_DAY = 200;

const fail = (status: number, error: string) => Response.json({ error }, { status });
const uploadClosed = "This upload is closed. Your counsellor opens it when the document is needed.";

export async function POST(request: Request) {
  if (!isSameOrigin(request)) return fail(403, "Request refused.");

  const user = await getCurrentUser();
  if (!user) return fail(401, "Please sign in again.");
  if (!privateStorageEnabled) return fail(503, "Document uploads are not set up yet.");

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return fail(400, "The request could not be read.");
  }
  const studentId = String(body.studentId ?? "");
  const requestId = body.requestId ? String(body.requestId) : null;
  let applicationId = body.applicationId ? String(body.applicationId) : null;
  let type = String(body.type ?? "") as DocumentType;
  const name = String(body.name ?? "").trim().slice(0, 150);
  const size = Number(body.size);

  if (!(await canAccessStudent(user, studentId, "edit"))) return fail(403, "You cannot add documents for this student.");

  // A file for a request takes the request's type and application. Students can only upload
  // into a request staff have opened; staff can upload any time.
  if (requestId) {
    const request = await db.documentRequest.findFirst({ where: { id: requestId, studentId }, select: { type: true, applicationId: true, isOpen: true, status: true } });
    if (!request) return fail(400, "That document request no longer exists.");
    if (user.role !== "ADMIN" && user.role !== "STAFF" && !acceptsUpload(request)) return fail(403, uploadClosed);
    type = request.type;
    applicationId = request.applicationId;
  } else if (user.role === "STUDENT") {
    return fail(403, "Upload into one of the documents your counsellor asked for.");
  }

  if (!(type in documentTypeLabels)) return fail(400, "Choose what kind of document this is.");
  if (!name) return fail(400, "The file needs a name.");
  if (!Number.isInteger(size) || size <= 0) return fail(400, "Choose a file to upload.");
  if (size > MAX_DOCUMENT_BYTES) return fail(413, "The file is too large. The limit is 10 MB.");

  if (applicationId && !(await db.application.count({ where: { id: applicationId, studentId } }))) {
    return fail(400, "That application does not belong to this student.");
  }

  // Counts started uploads, not finished ones, so abandoned uploads still use up the limit.
  const now = Date.now();
  const started = (ms: number) =>
    db.activityLog.count({ where: { userId: user.id, action: "document.start", createdAt: { gte: new Date(now - ms) } } });
  const [recent, today] = await Promise.all([started(10 * 60_000), started(24 * 3_600_000)]);
  if (recent >= PER_10_MINUTES || today >= PER_DAY) return fail(429, "Too many uploads. Please wait a few minutes and try again.");
  await db.activityLog.create({ data: { userId: user.id, action: "document.start", entityType: "StudentProfile", entityId: studentId } });

  // The server picks the storage name; the uploaded file's name is only a label.
  const key = `documents/${studentId}/${randomUUID()}`;
  const uploadUrl = await presignPrivateUpload(key, size);
  const ticket = createTicket({ key, studentId, applicationId, requestId, type, name, size, userId: user.id, expires: now + 10 * 60_000 });

  return Response.json({ uploadUrl, ticket });
}
