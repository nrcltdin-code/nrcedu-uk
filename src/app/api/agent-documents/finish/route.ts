import { db } from "@/lib/db";
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
  const profile = await db.agentProfile.findFirst({ where: { id: ticket.agentId, userId: user.id }, select: { approvalStatus: true } });
  if (!profile || profile.approvalStatus === "APPROVED" || profile.approvalStatus === "REJECTED") return fail(403, "Your verification is finished.");
  if (await db.agentDocument.count({ where: { fileKey: ticket.key } })) return fail(409, "This upload was already saved.");

  const checked = await checkUploadedFile(ticket.key, ticket.size, ticket.name);
  if ("error" in checked) return fail(checked.status, checked.error);

  const document = await db.agentDocument.create({
    data: { agentId: ticket.agentId, type: ticket.type, name: checked.name, fileKey: ticket.key, contentType: checked.contentType },
    select: { id: true },
  });
  await db.activityLog.create({ data: { userId: user.id, action: "agent.document-upload", entityType: "AgentProfile", entityId: ticket.agentId } });
  return Response.json({ id: document.id });
}
