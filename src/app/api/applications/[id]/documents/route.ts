import { db } from "@/lib/db";
import { getCurrentUser, can } from "@/lib/session";
import { getPrivateObject, privateStorageEnabled } from "@/lib/storage";
import { buildSubmissionPack } from "@/lib/submission";
import { createZip } from "@/lib/zip";

// All approved documents for one application in a single ZIP, named the way universities
// expect ("Passport - Student Name.pdf"), ready to upload to a portal. Staff only.

export async function GET(_request: Request, { params }: RouteContext<"/api/applications/[id]/documents">) {
  const user = await getCurrentUser();
  if (!user) return new Response("Please sign in.", { status: 401 });
  if ((user.role !== "ADMIN" && user.role !== "STAFF") || !(await can(user, "APPLICATIONS", "view"))) return new Response("Not found.", { status: 404 });
  if (!privateStorageEnabled) return new Response("Document storage is not set up.", { status: 503 });

  const { id } = await params;
  const pack = await buildSubmissionPack(id);
  if (!pack) return new Response("Not found.", { status: 404 });
  if (pack.documents.length === 0) return new Response("This application has no approved documents yet.", { status: 404 });

  const keys = await db.document.findMany({ where: { id: { in: pack.documents.map((d) => d.id) } }, select: { id: true, fileKey: true } });
  const keyById = new Map(keys.map((k) => [k.id, k.fileKey]));
  try {
    const files = await Promise.all(
      pack.documents.flatMap((d) => {
        const key = keyById.get(d.id);
        return key ? [getPrivateObject(key).then((data) => ({ name: d.fileName, data }))] : [];
      }),
    );
    const zip = createZip(files);
    const name = `${pack.studentName} - ${pack.university.name}`.replace(/[^\w.\- ]+/g, "_").slice(0, 100);
    await db.activityLog.create({ data: { userId: user.id, action: "application.documents.download", entityType: "Application", entityId: id } });
    return new Response(zip, {
      headers: {
        "Content-Type": "application/zip",
        "Content-Disposition": `attachment; filename="${name}.zip"`,
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    console.error("Documents zip:", error);
    return new Response("The documents could not be fetched. Please try again.", { status: 502 });
  }
}
