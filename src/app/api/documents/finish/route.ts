import { acceptsUpload } from "@/lib/application-flow";
import { applicationEvent } from "@/lib/applications";
import { db } from "@/lib/db";
import { counsellorOrStaff, notify, studentSide } from "@/lib/notifications";
import { canAccessStudent, cleanDocumentImage, documentTypeLabels, documentContentTypes, MAX_DOCUMENT_BYTES, readTicket, sniffDocument, syncRequestStatus } from "@/lib/documents";
import { isSameOrigin } from "@/lib/same-origin";
import { getCurrentUser } from "@/lib/session";
import { deletePrivateObject, getPrivateObject, headPrivateObject, privateStorageEnabled, putPrivateObject } from "@/lib/storage";

// Step 2: the browser says the upload is done. The file is checked where it landed: right size,
// really a PDF, JPG or PNG. Images are re-encoded. Anything that fails is deleted from storage.

const fail = (status: number, error: string) => Response.json({ error }, { status });

export async function POST(request: Request) {
  if (!isSameOrigin(request)) return fail(403, "Request refused.");

  const user = await getCurrentUser();
  if (!user) return fail(401, "Please sign in again.");
  if (!privateStorageEnabled) return fail(503, "Document uploads are not set up yet.");

  let token = "";
  try {
    token = String((await request.json()).ticket ?? "");
  } catch {
    return fail(400, "The request could not be read.");
  }
  const ticket = readTicket(token, user.id);
  if (!ticket) return fail(400, "This upload has expired. Please try again.");
  // Access could have been removed in the minutes since the upload started.
  if (!(await canAccessStudent(user, ticket.studentId, "edit"))) return fail(403, "You cannot add documents for this student.");
  if (await db.document.count({ where: { fileKey: ticket.key } })) return fail(409, "This upload was already saved.");
  // Staff may have closed the upload in the minutes since it started.
  const slot = ticket.requestId
    ? await db.documentRequest.findUnique({ where: { id: ticket.requestId }, select: { label: true, isOpen: true, status: true } })
    : null;
  if (ticket.requestId && (!slot || (user.role !== "ADMIN" && user.role !== "STAFF" && !acceptsUpload(slot)))) {
    await deletePrivateObject(ticket.key).catch(() => {});
    return fail(403, "This upload was closed while you were uploading. Ask your counsellor to open it again.");
  }

  const reject = async (status: number, error: string) => {
    await deletePrivateObject(ticket.key).catch(() => {});
    return fail(status, error);
  };

  const head = await headPrivateObject(ticket.key);
  if (!head) return fail(400, "The file did not arrive. Please try again.");
  if (head.size !== ticket.size || head.size > MAX_DOCUMENT_BYTES) return reject(413, "The file is too large. The limit is 10 MB.");

  let kind;
  let contentType;
  try {
    const firstBytes = await getPrivateObject(ticket.key, "bytes=0-15");
    kind = sniffDocument(firstBytes);
    if (!kind) return reject(415, "Only PDF, JPG or PNG files can be uploaded.");
    contentType = documentContentTypes[kind];
    if (kind !== "pdf") {
      const clean = await cleanDocumentImage(await getPrivateObject(ticket.key)).catch(() => null);
      if (!clean) return reject(415, "This image could not be read. It may be damaged.");
      await putPrivateObject(ticket.key, clean, "image/jpeg");
      contentType = "image/jpeg";
    }
  } catch (error) {
    console.error("Document check:", error);
    return reject(502, "The file could not be checked. Please try again.");
  }

  const extension = kind === "pdf" ? ".pdf" : ".jpg";
  const name = ticket.name.replace(/\.(pdf|jpe?g|png)$/i, "") + extension;

  const document = await db.document.create({
    data: {
      studentId: ticket.studentId,
      applicationId: ticket.applicationId,
      requestId: ticket.requestId,
      type: ticket.type,
      name,
      fileKey: ticket.key,
      fileUrl: `private:${contentType}`, // files are never public; served by /api/documents/[id]
      uploadedById: user.id,
    },
    select: { id: true },
  });
  await db.activityLog.create({ data: { userId: user.id, action: "document.upload", entityType: "Document", entityId: document.id } });
  await syncRequestStatus(ticket.requestId);
  if (ticket.applicationId) {
    await applicationEvent({
      applicationId: ticket.applicationId,
      actorId: user.id,
      type: "document.uploaded",
      note: `${slot?.label ?? documentTypeLabels[ticket.type]}: ${name}`,
      visibleToStudent: true,
      meta: { documentId: document.id, requestId: ticket.requestId },
    });
  }

  // Uploads from the student or their agent go to the counsellor (or the students team) to check.
  if (user.role === "STUDENT" || user.role === "AGENT") {
    const side = await studentSide(ticket.studentId);
    notify(await counsellorOrStaff(side?.counsellorId, "STUDENTS"), {
      type: "document.uploaded",
      title: `New document to check: ${side?.user.name ?? "a student"}`,
      body: `${documentTypeLabels[ticket.type]}, uploaded by ${user.role === "AGENT" ? `agent ${user.name}` : "the student"}.`,
      href: `/dashboard/students/${ticket.studentId}`,
      email: true,
    }, user.id);
  }

  return Response.json({ id: document.id });
}
