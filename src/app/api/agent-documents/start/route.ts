import { randomUUID } from "node:crypto";
import type { AgentDocumentType } from "@/generated/prisma/client";
import { agentDocumentLabels, mayChangeAgentDocument } from "@/lib/agent";
import { db } from "@/lib/db";
import { createTicket, MAX_DOCUMENT_BYTES } from "@/lib/documents";
import { isSameOrigin } from "@/lib/same-origin";
import { getCurrentUser } from "@/lib/session";
import { presignPrivateUpload, privateStorageEnabled } from "@/lib/storage";

// Verification documents an agent uploads during onboarding. Same two steps as student
// documents (start → upload straight to storage → finish), but only the agent themselves can
// add them: any kind while being verified, or the business registration during an agency upgrade.

export type AgentUploadTicket = { purpose: "agent"; key: string; agentId: string; type: AgentDocumentType; requestId: string | null; name: string; size: number; userId: string; expires: number };

const fail = (status: number, error: string) => Response.json({ error }, { status });

export async function POST(request: Request) {
  if (!isSameOrigin(request)) return fail(403, "Request refused.");
  const user = await getCurrentUser();
  if (!user || user.role !== "AGENT") return fail(401, "Please sign in again.");
  if (!privateStorageEnabled) return fail(503, "Document uploads are not set up yet.");

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return fail(400, "The request could not be read.");
  }
  const requestId = body.requestId ? String(body.requestId) : null;
  const name = String(body.name ?? "").trim().slice(0, 150);
  const size = Number(body.size);
  if (!name) return fail(400, "The file needs a name.");
  if (!Number.isInteger(size) || size <= 0) return fail(400, "Choose a file to upload.");
  if (size > MAX_DOCUMENT_BYTES) return fail(413, "The file is too large. The limit is 10 MB.");

  const profile = await db.agentProfile.findUnique({ where: { userId: user.id }, select: { id: true, approvalStatus: true, kind: true, _count: { select: { verification: true } } } });
  if (!profile) return fail(403, "Only the person who registered the agency can upload these.");
  if (profile._count.verification >= 30) return fail(429, "That is a lot of files. Remove some before adding more.");

  // A file NRC asked for can be sent at any time (except by a rejected agent); its type comes from the request.
  let type = String(body.type ?? "") as AgentDocumentType;
  if (requestId) {
    const asked = await db.agentDocumentRequest.findFirst({ where: { id: requestId, agentId: profile.id, isOpen: true }, select: { type: true } });
    if (!asked || profile.approvalStatus === "REJECTED") return fail(403, "NRC no longer needs this document.");
    type = asked.type;
  } else {
    if (!(type in agentDocumentLabels)) return fail(400, "Choose what kind of document this is.");
    if (!mayChangeAgentDocument(profile, type)) return fail(403, "Your verification is finished. Contact NRC to change these documents.");
  }

  const key = `agent-documents/${profile.id}/${randomUUID()}`;
  const uploadUrl = await presignPrivateUpload(key, size);
  const ticket = createTicket<AgentUploadTicket>({ purpose: "agent", key, agentId: profile.id, type, requestId, name, size, userId: user.id, expires: Date.now() + 10 * 60_000 });
  return Response.json({ uploadUrl, ticket });
}
