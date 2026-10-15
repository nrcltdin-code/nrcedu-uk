"use server";

import { revalidatePath } from "next/cache";
import { requireAgentOwner } from "@/lib/agent";
import { db } from "@/lib/db";
import { sendEmail } from "@/lib/email";
import { text } from "@/lib/form";
import type { FormState } from "@/lib/form";
import { createInvite } from "@/lib/invites";
import { isEmail } from "@/lib/leads";
import { requireUser } from "@/lib/session";

export type TeamInviteState = FormState & { url?: string; emailedTo?: string };

async function inviteMember(owner: { name: string; email: string }, member: { id: string; name: string; email: string }) {
  const invite = await createInvite(member.id);
  const emailed = await sendEmail({
    to: member.email,
    replyTo: owner.email,
    subject: "Your NRC agent portal account",
    text: `Hello ${member.name},\n\n${owner.name} has added you to their team on the NRC agent portal, where you can add students and apply for courses on their behalf.\n\nChoose your password here (the link works once and expires in 7 days):\n${invite.url}`,
  });
  return { url: invite.url, emailedTo: emailed ? member.email : undefined };
}

// Team members are AGENT accounts linked to the owner's agency. They see only the students
// they added themselves; the owner sees everyone's.
export async function addTeamMember(_previous: TeamInviteState, form: FormData): Promise<TeamInviteState> {
  const user = await requireUser();
  const scope = await requireAgentOwner();
  const name = text(form, "name");
  const email = text(form, "email").toLowerCase();
  const phone = text(form, "phone");

  if (name.length < 2 || name.length > 100) return { error: "Enter their full name." };
  if (!isEmail(email)) return { error: "Enter their email address." };
  if (phone.length > 30) return { error: "The phone number is too long." };
  if (await db.user.count({ where: { email } })) return { error: "This email is already registered with NRC. Use a different one." };

  const member = await db.user.create({
    data: { name, email, phone: phone || null, role: "AGENT", status: "ACTIVE", agentTeamId: scope.agentId },
    select: { id: true, name: true, email: true },
  });
  await db.activityLog.create({ data: { userId: user.id, action: "agent.team-add", entityType: "User", entityId: member.id, meta: { agentId: scope.agentId } } });
  const invite = await inviteMember(user, member);
  revalidatePath("/dashboard/agent/team");
  return { saved: true, ...invite };
}

async function findMember(agentId: string, memberId: string) {
  return db.user.findFirst({
    where: { id: memberId, agentTeamId: agentId },
    select: { id: true, name: true, email: true, status: true, accounts: { select: { id: true }, take: 1 } },
  });
}

export async function reinviteTeamMember(_previous: TeamInviteState, form: FormData): Promise<TeamInviteState> {
  const user = await requireUser();
  const scope = await requireAgentOwner();
  const member = await findMember(scope.agentId, text(form, "memberId"));
  if (!member) return { error: "This person is not on your team." };
  if (member.accounts.length) return { error: "They can already sign in." };
  if (member.status !== "ACTIVE") return { error: "Turn their access back on first." };
  await db.activityLog.create({ data: { userId: user.id, action: "agent.team-invite", entityType: "User", entityId: member.id } });
  return inviteMember(user, member);
}

// Turning access off keeps the students they added; the owner still sees them.
export async function setTeamMemberActive(memberId: string, active: boolean) {
  const user = await requireUser();
  const scope = await requireAgentOwner();
  const member = await findMember(scope.agentId, memberId);
  if (!member) return;
  await db.$transaction([
    db.user.update({ where: { id: member.id }, data: { status: active ? "ACTIVE" : "SUSPENDED" } }),
    ...(active ? [] : [db.session.deleteMany({ where: { userId: member.id } })]),
    db.activityLog.create({ data: { userId: user.id, action: "agent.team-status", entityType: "User", entityId: member.id, meta: { active } } }),
  ]);
  revalidatePath("/dashboard/agent/team");
}
