"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { emailEnabled, sendEmail } from "@/lib/email";
import { text } from "@/lib/form";
import type { FormState } from "@/lib/form";
import { requirePermission } from "@/lib/session";

// A staff member writes to one lead, student or agent. The email comes from the site's sender
// address, replies go to the staff member, and a copy is kept on the lead or student timeline.
export async function sendPersonalEmail(_previous: FormState, form: FormData): Promise<FormState> {
  const target = text(form, "target");
  const id = text(form, "id");
  const subject = text(form, "subject");
  const body = text(form, "body");
  if (subject.length < 2 || subject.length > 150) return { error: "Write a subject (up to 150 characters)." };
  if (body.length < 2 || body.length > 10_000) return { error: "Write a message (up to 10,000 characters)." };
  if (/\{(name|first_name|my_name|portal_link|review_link)\}/.test(subject + body)) return { error: "Some {placeholders} are still in the text. Replace them before sending." };
  if (!emailEnabled) return { error: "Email sending is switched off, so this cannot be sent." };

  let recipient: { email: string; name: string } | null = null;
  let page = "";
  let user;
  if (target === "lead") {
    user = await requirePermission("LEADS", "edit");
    recipient = await db.lead.findUnique({ where: { id }, select: { email: true, name: true } });
    page = `/dashboard/leads/${id}`;
  } else if (target === "student") {
    user = await requirePermission("STUDENTS", "edit");
    const student = await db.studentProfile.findUnique({ where: { id }, select: { user: { select: { email: true, name: true } } } });
    recipient = student?.user ?? null;
    page = `/dashboard/students/${id}`;
  } else if (target === "agent") {
    user = await requirePermission("AGENTS", "edit");
    const agent = await db.agentProfile.findUnique({ where: { id }, select: { user: { select: { email: true, name: true } } } });
    recipient = agent?.user ?? null;
    page = `/dashboard/agents/${id}`;
  } else {
    return { error: "Unknown recipient." };
  }
  if (!recipient) return { error: "This record no longer exists." };

  const sent = await sendEmail({ to: recipient.email, replyTo: user.email, subject, text: body, kind: `Written by ${user.name}` });
  if (!sent) return { error: "The mail service did not accept the email. See Dashboard → Email for the reason." };

  const note = `Email sent to ${recipient.email}: "${subject}"\n\n${body}`;
  await db.$transaction([
    ...(target === "agent" ? [] : [db.note.create({ data: { authorId: user.id, body: note, ...(target === "lead" ? { leadId: id } : { studentId: id }) } })]),
    db.activityLog.create({ data: { userId: user.id, action: "email.send", entityType: target === "lead" ? "Lead" : target === "student" ? "StudentProfile" : "AgentProfile", entityId: id, meta: { subject } } }),
  ]);
  revalidatePath(page);
  return { saved: true };
}
