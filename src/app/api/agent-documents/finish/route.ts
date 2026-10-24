import { mayChangeAgentDocument } from "@/lib/agent";
import { db } from "@/lib/db";
import { notify, staffWithAccess } from "@/lib/notifications";
import { checkUploadedFile, readTicket } from "@/lib/documents";
import { isSameOrigin } from "@/lib/same-origin";
import { getCurrentUser } from "@/lib/session";
import type { AgentUploadTicket } from "../start/route";

const fail = (status: number, error: string) => Response.json({ error }, { status });

export async function POST(request: Request) {
  if (!isSameOrigin(request)) return fail(403, "Request refused.");
  const user = await getCurrentUser();
  if (!user || user.role !== "AGENT") return fail(401, "Please sign in again.");

  let token = "";
  try {
    token = String((await request.json()).ticket ?? "");
  } catch {
    return fail(400, "The request could not be read.");
  }
  const ticket = readTicket<AgentUploadTicket>(token, user.id);
  if (!ticket || ticket.purpose !== "agent") return fail(400, "This upload has expired. Please try again.");
  const profile = await db.agentProfile.findFirst({ where: { id: ticket.agentId, userId: user.id }, select: { approvalStatus: true, kind: true } });
  if (!profile) return fail(403, "Your verification is finished.");
  if (ticket.requestId) {
    const open = await db.agentDocumentRequest.count({ where: { id: ticket.requestId, agentId: ticket.agentId, isOpen: true } });
    if (!open || profile.approvalStatus === "REJECTED") return fail(403, "NRC no longer needs this document.");
  } else if (!mayChangeAgentDocument(profile, ticket.type)) return fail(403, "Your verification is finished.");
  if (await db.agentDocument.count({ where: { fileKey: ticket.key } })) return fail(409, "This upload was already saved.");

  const checked = await checkUploadedFile(ticket.key, ticket.size, ticket.name);
  if ("error" in checked) return fail(checked.status, checked.error);

  const document = await db.agentDocument.create({
    data: { agentId: ticket.agentId, type: ticket.type, requestId: ticket.requestId ?? null, name: checked.name, fileKey: ticket.key, contentType: checked.contentType },
    select: { id: true },
  });
  await db.activityLog.create({ data: { userId: user.id, action: "agent.document-upload", entityType: "AgentProfile", entityId: ticket.agentId } });
  if (ticket.requestId) {
    notify(await staffWithAccess("AGENTS", "edit"), {
      type: "agent.requested-document",
      title: `Agent sent a requested document: ${user.name}`,
      body: checked.name,
      href: `/dashboard/agents/${ticket.agentId}`,
    });
  }
  return Response.json({ id: document.id });
}
