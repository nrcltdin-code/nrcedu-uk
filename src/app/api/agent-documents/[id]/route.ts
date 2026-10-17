import { db } from "@/lib/db";
import { can, getCurrentUser } from "@/lib/session";
import { presignPrivateDownload, privateStorageEnabled } from "@/lib/storage";

// Download an agent's verification document: the agent who uploaded it, or staff with Agents access.
export async function GET(_request: Request, { params }: RouteContext<"/api/agent-documents/[id]">) {
  const user = await getCurrentUser();
  if (!user) return new Response("Please sign in.", { status: 401 });
  if (!privateStorageEnabled) return new Response("Document storage is not set up.", { status: 503 });

  const { id } = await params;
  const document = await db.agentDocument.findUnique({ where: { id }, select: { fileKey: true, name: true, contentType: true, agent: { select: { userId: true } } } });
  const allowed = document && (document.agent.userId === user.id || (await can(user, "AGENTS", "view")));
  if (!document || !allowed) return new Response("Not found.", { status: 404 });

  const url = await presignPrivateDownload(document.fileKey, document.name, document.contentType);
  return new Response(null, { status: 302, headers: { Location: url, "Cache-Control": "no-store", "Referrer-Policy": "no-referrer" } });
}
