import "server-only";
import { after } from "next/server";
import type { PermissionModule } from "@/generated/prisma/client";
import { db } from "@/lib/db";
import { link, sendEmail } from "@/lib/email";

// In-app notifications. Each event names who should hear about it; this file turns that into
// user ids by role and access, so a staff member restricted from a module never gets its notices,
// and an agent team member only hears about their own students.

// email: also send it by email. Events that already send their own, more detailed email leave it off.
export type Notice = { type: string; title: string; body?: string; href?: string; email?: boolean };

const oneLine = (value: string, max: number) => value.replace(/\s+/g, " ").trim().slice(0, max);

// Saves after the response, like queueEmail, so a notice never slows down or breaks an action.
// The person who caused the event is left out: nobody needs telling about their own click.
export function notify(userIds: (string | null | undefined)[], notice: Notice, actorId?: string) {
  const ids = [...new Set(userIds.filter((id): id is string => Boolean(id) && id !== actorId))];
  if (!ids.length) return;
  const data = { type: notice.type, title: oneLine(notice.title, 150), body: notice.body ? oneLine(notice.body, 300) : null, href: notice.href ?? null };
  after(async () => {
    await db.notification
      .createMany({ data: ids.map((userId) => ({ userId, ...data })) })
      .catch((error) => console.error(`Notification "${notice.type}" failed`, error));
    if (notice.email) await emailNotice(ids, data);
  });
}

async function emailNotice(ids: string[], notice: { title: string; body: string | null; href: string | null }) {
  const users = await db.user.findMany({ where: { id: { in: ids }, status: "ACTIVE" }, select: { name: true, email: true } });
  const open = notice.href ? `\n\nOpen it here: ${link(notice.href)}` : "";
  await Promise.all(
    users.map((user) =>
      sendEmail({ to: user.email, subject: notice.title, text: `Hello ${user.name},\n\n${notice.title}.${notice.body ? `\n\n${notice.body}` : ""}${open}` }),
    ),
  );
}

// Active admins, plus active staff whose access to the module was not taken away
// (the same rule as can() in session.ts: no permission row means full access).
export async function staffWithAccess(module: PermissionModule, action: "view" | "edit" = "view"): Promise<string[]> {
  const blocked = action === "view" ? { canView: false } : { OR: [{ canView: false }, { canEdit: false }] };
  const users = await db.user.findMany({
    where: {
      status: "ACTIVE",
      OR: [{ role: "ADMIN" }, { role: "STAFF", staffPermissions: { none: { module, ...blocked } } }],
    },
    select: { id: true },
  });
  return users.map((u) => u.id);
}

// The counsellor when one is set and still active, otherwise everyone who can work on the module.
export async function counsellorOrStaff(counsellorId: string | null | undefined, module: PermissionModule): Promise<string[]> {
  if (counsellorId && (await db.user.count({ where: { id: counsellorId, status: "ACTIVE", role: { in: ["ADMIN", "STAFF"] } } }))) {
    return [counsellorId];
  }
  return staffWithAccess(module, "edit");
}

// The agency owner, plus the team member who added the student (team members see only their own).
export async function agencyRecipients(student: { agentId: string | null; addedById: string | null }): Promise<(string | undefined)[]> {
  if (!student.agentId) return [];
  const agency = await db.agentProfile.findUnique({
    where: { id: student.agentId },
    select: { userId: true, approvalStatus: true, team: { where: { status: "ACTIVE" }, select: { id: true } } },
  });
  if (!agency || agency.approvalStatus !== "APPROVED") return [];
  const member = agency.team.find((m) => m.id === student.addedById);
  return [agency.userId, member?.id];
}

// Everyone on the outside of a student's file: the student and their agent(s).
export async function studentSide(studentId: string) {
  const student = await db.studentProfile.findUnique({
    where: { id: studentId },
    select: { userId: true, agentId: true, addedById: true, counsellorId: true, user: { select: { name: true } } },
  });
  if (!student) return null;
  return { ...student, agents: await agencyRecipients(student) };
}

export function unreadNotificationCount(userId: string) {
  return db.notification.count({ where: { userId, readAt: null } });
}
