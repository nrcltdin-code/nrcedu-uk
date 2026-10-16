import "server-only";
import { db } from "@/lib/db";

// Who may change their own sign-in email. Staff, admin and agent addresses are managed by an
// admin, and students linked to an agent are managed by that agent, because other people rely
// on those addresses. Only students who look after their own account can change it.
export async function emailChangeBlockedReason(userId: string): Promise<string | null> {
  const user = await db.user.findUnique({
    where: { id: userId },
    select: { role: true, studentProfile: { select: { agentId: true, addedById: true } } },
  });
  if (!user) return "Account not found.";
  if (user.role === "ADMIN") return "Admin email addresses are changed by another admin from Users and roles.";
  if (user.role === "STAFF") return "Staff email addresses are changed by an admin from Users and roles.";
  if (user.role === "AGENT") return "Agent email addresses are changed by NRC. Please contact your NRC manager.";
  if (user.studentProfile?.agentId || user.studentProfile?.addedById) {
    return "Your agent manages your account details. Ask them, or your NRC counsellor, to change your email.";
  }
  return null;
}
