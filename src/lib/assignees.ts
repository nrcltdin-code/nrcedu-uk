import "server-only";
import { db } from "@/lib/db";

// Choices for the "assign to" dropdowns: active staff and admins, and approved agents.
export async function getAssigneeOptions() {
  const [staff, agents] = await Promise.all([
    db.user.findMany({
      where: { role: { in: ["ADMIN", "STAFF"] }, status: "ACTIVE" },
      orderBy: { name: "asc" },
      select: { id: true, name: true },
    }),
    db.agentProfile.findMany({
      where: { approvalStatus: "APPROVED" },
      orderBy: { user: { name: "asc" } },
      select: { id: true, companyName: true, user: { select: { name: true } } },
    }),
  ]);
  return {
    staff,
    agents: agents.map((a) => ({ id: a.id, name: a.companyName ? `${a.user.name} (${a.companyName})` : a.user.name })),
  };
}
