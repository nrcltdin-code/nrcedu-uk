import { db } from "@/lib/db";
import { canAccessStudent } from "@/lib/documents";
import { getCurrentUser } from "@/lib/session";
import { presignPrivateDownload, privateStorageEnabled } from "@/lib/storage";

// Download a student document: access is checked on every request, then the browser is sent
// to a signed link that works for one minute and always downloads rather than opening inline.

export async function GET(_request: Request, { params }: RouteContext<"/api/documents/[id]">) {
  const user = await getCurrentUser();
  if (!user) return new Response("Please sign in.", { status: 401 });
  if (!privateStorageEnabled) return new Response("Document storage is not set up.", { status: 503 });

  const { id } = await params;
  const document = await db.document.findUnique({ where: { id }, select: { studentId: true, fileKey: true, fileUrl: true, name: true } });
  // Same answer for "missing" and "not yours", so ids cannot be probed.
  if (!document?.fileKey || !(await canAccessStudent(user, document.studentId, "view"))) {
    return new Response("Not found.", { status: 404 });
  }

  const contentType = document.fileUrl.startsWith("private:") ? document.fileUrl.slice(8) : "application/octet-stream";
  const url = await presignPrivateDownload(document.fileKey, document.name, contentType);
  return new Response(null, { status: 302, headers: { Location: url, "Cache-Control": "no-store", "Referrer-Policy": "no-referrer" } });
}
