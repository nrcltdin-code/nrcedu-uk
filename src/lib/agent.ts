import "server-only";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { requireRole } from "@/lib/session";
import type { CurrentUser } from "@/lib/session";

export type AgentScope = {
  agentId: string;
  userId: string;
  // The agency owner sees every student the agency added; a team member only their own.
  isOwner: boolean;
  students: { agentId: string; addedById?: string };
};

// Who the signed-in agent account works for. Owners have their own AgentProfile; team members
// are linked to the owner's profile through agentTeamId. Returns null for anyone else.
export async function findAgentScope(user: CurrentUser): Promise<AgentScope | null> {
  if (user.role !== "AGENT") return null;
  const row = await db.user.findUnique({
    where: { id: user.id },
    select: {
      agentProfile: { select: { id: true, approvalStatus: true } },
      agentTeam: { select: { id: true, approvalStatus: true } },
    },
  });
  const owned = row?.agentProfile;
  if (owned?.approvalStatus === "APPROVED") {
    return { agentId: owned.id, userId: user.id, isOwner: true, students: { agentId: owned.id } };
  }
  const team = row?.agentTeam;
  if (!owned && team?.approvalStatus === "APPROVED") {
    return { agentId: team.id, userId: user.id, isOwner: false, students: { agentId: team.id, addedById: user.id } };
  }
  return null;
}

// Only approved agents (and their team) get this far: sign-in is already blocked while they
// wait, and a revoked agency is sent back to the overview.
export async function requireAgentScope(): Promise<AgentScope> {
  const user = await requireRole("AGENT");
  const scope = await findAgentScope(user);
  if (!scope) redirect("/dashboard");
  return scope;
}

// Owner-only screens: team management and commission.
export async function requireAgentOwner(): Promise<AgentScope> {
  const scope = await requireAgentScope();
  if (!scope.isOwner) redirect("/dashboard");
  return scope;
}

// A student this agent account may see, or null. Use for every agent page and action.
export async function findMyStudent(scope: AgentScope, studentId: string) {
  return db.studentProfile.findFirst({ where: { id: studentId, ...scope.students }, select: { id: true } });
}
