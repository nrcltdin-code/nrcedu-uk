import "server-only";
import { db } from "@/lib/db";
import { link, queueEmail, staffAlertAddresses } from "@/lib/email";
import { counsellorOrStaff, notify } from "@/lib/notifications";
import type { CurrentUser } from "@/lib/session";

// One conversation per student, between the student and NRC staff. readAt on a message means
// "read by the other side": staff opening the thread reads the student's messages, the student
// opening it reads staff messages.

export const MAX_MESSAGE = 2000;

export async function postMessage(studentId: string, sender: CurrentUser, rawBody: string): Promise<{ error: string } | { ok: true }> {
  const body = rawBody.trim();
  if (!body) return { error: "Write a message first." };
  if (body.length > MAX_MESSAGE) return { error: `Keep the message under ${MAX_MESSAGE.toLocaleString("en-GB")} characters.` };

  const recent = await db.message.count({ where: { senderId: sender.id, createdAt: { gt: new Date(Date.now() - 10 * 60_000) } } });
  if (recent >= 30) return { error: "You have sent a lot of messages in a short time. Please wait a few minutes." };

  const student = await db.studentProfile.findUnique({
    where: { id: studentId },
    select: { userId: true, user: { select: { name: true, email: true } }, counsellorId: true, counsellor: { select: { email: true, status: true } } },
  });
  if (!student) return { error: "This student no longer exists." };

  const fromStudent = sender.id === student.userId;
  // Email only for the first unread message, so a burst of messages sends one email.
  const alreadyWaiting = await db.message.count({
    where: { studentId, readAt: null, senderId: fromStudent ? student.userId : { not: student.userId } },
  });
  await db.message.create({ data: { studentId, senderId: sender.id, body } });

  if (!alreadyWaiting) {
    if (fromStudent) {
      notify(await counsellorOrStaff(student.counsellorId, "STUDENTS"), { type: "message.new", title: `New message from ${student.user.name}`, body, href: `/dashboard/messages/${studentId}` }, sender.id);
    } else {
      notify([student.userId], { type: "message.new", title: `New message from ${sender.name} at NRC`, body, href: "/dashboard/messages" }, sender.id);
    }
    if (fromStudent) {
      const counsellor = student.counsellor?.status === "ACTIVE" ? student.counsellor.email : null;
      queueEmail({
        to: counsellor ? [counsellor] : staffAlertAddresses(),
        subject: `New message from ${student.user.name}`,
        text: `${student.user.name} sent a message:\n\n${body}\n\nReply in the dashboard: ${link(`/dashboard/messages/${studentId}`)}`,
      });
    } else {
      queueEmail({
        to: student.user.email,
        subject: "New message from NRC",
        text: `Hello ${student.user.name},\n\n${sender.name} at NRC sent you a message:\n\n${body}\n\nReply here: ${link("/dashboard/messages")}`,
      });
    }
  }
  return { ok: true };
}

// Marks what the viewer has now seen.
export function markRead(studentId: string, studentUserId: string, viewer: "student" | "staff") {
  return db.message.updateMany({
    where: { studentId, readAt: null, senderId: viewer === "staff" ? studentUserId : { not: studentUserId } },
    data: { readAt: new Date() },
  });
}

export function getThread(studentId: string) {
  return db.message.findMany({
    where: { studentId },
    orderBy: { createdAt: "asc" },
    take: 300,
    select: { id: true, body: true, createdAt: true, readAt: true, senderId: true, sender: { select: { name: true } } },
  });
}

// Unread messages from students: those I counsel, plus students with no counsellor.
export function staffUnreadCount(staffId: string) {
  return db.message.count({
    where: {
      readAt: null,
      student: { OR: [{ counsellorId: staffId }, { counsellorId: null }] },
      sender: { role: "STUDENT" },
    },
  });
}

export async function studentUnreadCount(userId: string) {
  return db.message.count({ where: { readAt: null, student: { userId }, senderId: { not: userId } } });
}
