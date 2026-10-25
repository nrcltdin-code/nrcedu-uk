import { applicationEvent } from "@/lib/applications";
import { db } from "@/lib/db";
import { documentTypeLabels, requestUploadPath } from "@/lib/documents";
import { link } from "@/lib/email";
import { can, getCurrentUser } from "@/lib/session";
import { whatsappLink, whatsappNumber } from "@/lib/whatsapp";

// Staff open a WhatsApp chat with a student about one document or document request
// (?document=… or ?request=…), or just chat (?student=…). The click is logged, then the browser goes to wa.me with a
// message typed in. The file itself stays on the portal; the message links there.

export async function GET(request: Request) {
  const user = await getCurrentUser();
  if (!user || !(await can(user, "STUDENTS", "view"))) return new Response("Not found.", { status: 404 });

  const params = new URL(request.url).searchParams;
  const documentId = params.get("document");
  const requestId = params.get("request");
  const studentId = params.get("student");

  const student = { select: { id: true, phone: true, user: { select: { name: true, phone: true } } } } as const;
  const subject: { student: { id: string; phone: string | null; user: { name: string; phone: string | null } }; applicationId?: string | null; label?: string; name?: string; type?: keyof typeof documentTypeLabels; request?: { label: string } | null } | null = documentId
    ? await db.document.findUnique({ where: { id: documentId }, select: { name: true, type: true, applicationId: true, request: { select: { label: true } }, student } })
    : requestId
      ? await db.documentRequest.findUnique({ where: { id: requestId }, select: { label: true, type: true, applicationId: true, isOpen: true, student } })
      : studentId
        ? await db.studentProfile.findUnique({ where: { id: studentId }, select: student.select }).then((s) => (s ? { student: s } : null))
        : null;
  if (!subject) return new Response("Not found.", { status: 404 });

  const number = whatsappNumber(subject.student.phone ?? subject.student.user.phone);
  if (!number) {
    return new Response("This student has no phone number with a country code (e.g. +44 7700 900123). Add it on their profile first.", { status: 400 });
  }

  const name = subject.student.user.name.split(" ")[0];
  const label = subject.label ?? subject.request?.label ?? (subject.type ? documentTypeLabels[subject.type] : "");
  const message = documentId
    ? `Hello ${name}, this is ${user.name} from NRC Educational Consultant about your ${label} (${subject.name}). You can see it on your portal: ${link("/dashboard/documents")}`
    : requestId
      ? `Hello ${name}, this is ${user.name} from NRC Educational Consultant. We need your ${label}. Please upload it on your portal: ${link(requestUploadPath(requestId))}`
      : `Hello ${name}, this is ${user.name} from NRC Educational Consultant.`;

  await db.activityLog.create({
    data: { userId: user.id, action: "whatsapp.open", entityType: "StudentProfile", entityId: subject.student.id, meta: { documentId, requestId } },
  });
  if (subject.applicationId) {
    await applicationEvent({ applicationId: subject.applicationId, actorId: user.id, type: "whatsapp", note: label, meta: { documentId, requestId } });
  }

  return redirectTo(whatsappLink(number, message));
}

const redirectTo = (url: string) => new Response(null, { status: 302, headers: { Location: url, "Cache-Control": "no-store" } });
