import "server-only";
import { redirect } from "next/navigation";
import type { AgentKind, AgentPermission, Prisma } from "@/generated/prisma/client";
import { db } from "@/lib/db";
import { requireRole } from "@/lib/session";
import type { CurrentUser } from "@/lib/session";

// Who an agent account works for and what it may see. Every agent page, action and route
// goes through here, and uses the `where` filters below so nothing outside the agency (or,
// for a team member, outside their own work) can be loaded.

export type AgentScope = {
  agentId: string;
  userId: string;
  ownerUserId: string;
  kind: AgentKind;
  isOwner: boolean;
  can: (permission: AgentPermission) => boolean;
  // The owner, and members given "All students", see the whole agency; others only their own work.
  students: { agentId: string; addedById?: string };
  // Agents only know the applications their agency started, never ones NRC started.
  applications: Prisma.ApplicationWhereInput;
  leads: Prisma.LeadWhereInput;
};

export const agentPermissionLabels: Record<AgentPermission, { label: string; help: string }> = {
  ALL_STUDENTS: { label: "All agency students", help: "See every student, application and lead in the agency, not only the ones they added themselves." },
  LEADS: { label: "Leads (CRM)", help: "See and work on leads: change status, set follow-ups, add notes and turn a lead into a student." },
  APPLICATIONS: { label: "Applications", help: "Add students and start applications for them." },
  DOCUMENTS: { label: "Documents", help: "Upload documents for students into the slots NRC opens." },
  COMMISSION: { label: "Commission", help: "See what NRC owes the agency." },
  TEAM: { label: "Team", help: "Add team members, turn their access on or off and change what they can do (except giving Team access)." },
};
export const agentPermissions = Object.keys(agentPermissionLabels) as AgentPermission[];

function build(input: { agentId: string; ownerUserId: string; kind: AgentKind; userId: string; permissions: AgentPermission[] }): AgentScope {
  const isOwner = input.userId === input.ownerUserId;
  const granted = new Set(input.permissions);
  const can = (permission: AgentPermission) => isOwner || granted.has(permission);
  const wide = can("ALL_STUDENTS");
  const agencyMember: Prisma.UserWhereInput = { OR: [{ id: input.ownerUserId }, { agentTeamId: input.agentId }] };
  return {
    agentId: input.agentId,
    userId: input.userId,
    ownerUserId: input.ownerUserId,
    kind: input.kind,
    isOwner,
    can,
    students: wide ? { agentId: input.agentId } : { agentId: input.agentId, addedById: input.userId },
    applications: wide ? { agentId: input.agentId, submittedBy: agencyMember } : { agentId: input.agentId, submittedById: input.userId },
    leads: wide ? { assignedAgentId: input.agentId } : { assignedAgentId: input.agentId, agentUserId: input.userId },
  };
}

// Null for anyone who is not an approved agent or a team member of an approved agency.
export async function findAgentScope(user: CurrentUser): Promise<AgentScope | null> {
  if (user.role !== "AGENT") return null;
  const row = await db.user.findUnique({
    where: { id: user.id },
    select: {
      agentPermissions: true,
      agentProfile: { select: { id: true, kind: true, approvalStatus: true } },
      agentTeam: { select: { id: true, kind: true, userId: true, approvalStatus: true } },
    },
  });
  const owned = row?.agentProfile;
  if (owned) {
    return owned.approvalStatus === "APPROVED" ? build({ agentId: owned.id, ownerUserId: user.id, kind: owned.kind, userId: user.id, permissions: [] }) : null;
  }
  const team = row?.agentTeam;
  if (team?.approvalStatus === "APPROVED") {
    return build({ agentId: team.id, ownerUserId: team.userId, kind: team.kind, userId: user.id, permissions: row!.agentPermissions });
  }
  return null;
}

// Agents who registered but are not approved yet (or were asked for changes) land on onboarding.
export async function findOnboardingAgent(user: CurrentUser) {
  if (user.role !== "AGENT") return null;
  const profile = await db.agentProfile.findUnique({ where: { userId: user.id }, select: { id: true, approvalStatus: true } });
  return profile && profile.approvalStatus !== "APPROVED" ? profile : null;
}

export async function requireAgentScope(permission?: AgentPermission): Promise<AgentScope> {
  const user = await requireRole("AGENT");
  const scope = await findAgentScope(user);
  if (!scope) redirect("/dashboard");
  if (permission && !scope.can(permission)) redirect("/dashboard");
  return scope;
}

// Owner-only screens.
export async function requireAgentOwner(): Promise<AgentScope> {
  const scope = await requireAgentScope();
  if (!scope.isOwner) redirect("/dashboard");
  return scope;
}

// A student this agent account may see, or null. Use for every agent page and action.
export async function findMyStudent(scope: AgentScope, studentId: string) {
  return db.studentProfile.findFirst({ where: { id: studentId, ...scope.students }, select: { id: true } });
}

// The agency's sign-in accounts, for assigning leads: owner first, then active team members.
export async function agencyPeople(scope: AgentScope) {
  const [owner, team] = await Promise.all([
    db.user.findUnique({ where: { id: scope.ownerUserId }, select: { id: true, name: true } }),
    db.user.findMany({ where: { agentTeamId: scope.agentId, status: "ACTIVE" }, orderBy: { name: "asc" }, select: { id: true, name: true } }),
  ]);
  return [...(owner ? [owner] : []), ...team];
}

// Verification needed before approval. Agencies also prove the business exists.
export const requiredAgentDocuments = (kind: AgentKind) =>
  kind === "AGENCY" ? (["ID_PROOF", "ADDRESS_PROOF", "BUSINESS_REGISTRATION"] as const) : (["ID_PROOF", "ADDRESS_PROOF"] as const);

export const agentDocumentLabels = {
  ID_PROOF: "Photo ID (passport or national ID)",
  ADDRESS_PROOF: "Proof of address (utility bill or bank statement)",
  BUSINESS_REGISTRATION: "Business registration certificate",
  TAX_CERTIFICATE: "Tax certificate",
  OFFICE_PHOTO: "Photo of your office",
  REFERENCE_LETTER: "Reference letter (from a university or partner)",
  OTHER: "Other",
} as const;
