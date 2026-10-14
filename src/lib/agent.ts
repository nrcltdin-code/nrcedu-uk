import "server-only";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { requireRole } from "@/lib/session";

// The signed-in agent's profile id. Only approved agents get this far: sign-in is already
// blocked while they wait, and a revoked agent is sent back to the overview.
export async function requireMyAgentId(): Promise<string> {
  const user = await requireRole("AGENT");
  const agent = await db.agentProfile.findUnique({ where: { userId: user.id }, select: { id: true, approvalStatus: true } });
  if (!agent || agent.approvalStatus !== "APPROVED") redirect("/dashboard");
  return agent.id;
}

// A student this agent referred, or null. Use for every agent page and action.
export async function findMyStudent(agentId: string, studentId: string) {
  return db.studentProfile.findFirst({ where: { id: studentId, agentId }, select: { id: true } });
}
