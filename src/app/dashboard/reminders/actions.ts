"use server";

import { revalidatePath } from "next/cache";
import type { PermissionModule } from "@/generated/prisma/client";
import { db } from "@/lib/db";
import { text } from "@/lib/form";
import type { FormState } from "@/lib/form";
import { dueDateFromInput } from "@/lib/reminders";
import { can, requireRole } from "@/lib/session";
import type { CurrentUser } from "@/lib/session";

type Linked = { leadId: string | null; studentId: string | null; applicationId: string | null };

// Reminders on a record need edit access to that record's area; personal ones only their owner.
function linkModule(link: Linked): { module: PermissionModule; path: string } | null {
  if (link.leadId) return { module: "LEADS", path: `/dashboard/leads/${link.leadId}` };
  if (link.studentId) return { module: "STUDENTS", path: `/dashboard/students/${link.studentId}` };
  if (link.applicationId) return { module: "APPLICATIONS", path: `/dashboard/applications/${link.applicationId}` };
  return null;
}

async function mayChange(user: CurrentUser, reminder: Linked & { staffId: string }) {
  if (reminder.staffId === user.id || user.role === "ADMIN") return true;
  const linked = linkModule(reminder);
  return linked ? can(user, linked.module, "edit") : false;
}

function refresh(link: Linked) {
  const linked = linkModule(link);
  if (linked) revalidatePath(linked.path);
  revalidatePath("/dashboard/reminders");
  revalidatePath("/dashboard");
}

export async function addReminder(_previous: FormState, form: FormData): Promise<FormState> {
  const user = await requireRole("ADMIN", "STAFF");

  const body = text(form, "text");
  const dueAt = dueDateFromInput(text(form, "dueAt"));
  const staffId = text(form, "staffId") || user.id;
  const link: Linked = {
    leadId: text(form, "leadId") || null,
    studentId: text(form, "studentId") || null,
    applicationId: text(form, "applicationId") || null,
  };

  if (body.length < 2) return { error: "Say what to follow up." };
  if (body.length > 300) return { error: "Keep it under 300 characters." };
  if (!dueAt) return { error: "Choose a due date." };
  if ([link.leadId, link.studentId, link.applicationId].filter(Boolean).length > 1) return { error: "A reminder belongs to one record." };

  const linked = linkModule(link);
  if (linked && !(await can(user, linked.module, "edit"))) return { error: "You cannot add reminders here." };
  const exists = link.leadId
    ? await db.lead.count({ where: { id: link.leadId } })
    : link.studentId
      ? await db.studentProfile.count({ where: { id: link.studentId } })
      : link.applicationId
        ? await db.application.count({ where: { id: link.applicationId } })
        : 1;
  if (!exists) return { error: "This record no longer exists." };
  if (staffId !== user.id && !(await db.user.count({ where: { id: staffId, role: { in: ["ADMIN", "STAFF"] }, status: "ACTIVE" } }))) {
    return { error: "Choose a staff member from the list." };
  }

  await db.reminder.create({ data: { staffId, text: body, dueAt, ...link } });
  refresh(link);
  return { saved: true };
}

export async function setReminderDone(id: string, done: boolean) {
  const user = await requireRole("ADMIN", "STAFF");
  const reminder = await db.reminder.findUnique({ where: { id }, select: { staffId: true, leadId: true, studentId: true, applicationId: true } });
  if (!reminder || !(await mayChange(user, reminder))) return;
  await db.reminder.update({ where: { id }, data: { doneAt: done ? new Date() : null } });
  refresh(reminder);
}

export async function deleteReminder(id: string) {
  const user = await requireRole("ADMIN", "STAFF");
  const reminder = await db.reminder.findUnique({ where: { id }, select: { staffId: true, leadId: true, studentId: true, applicationId: true } });
  if (!reminder || !(await mayChange(user, reminder))) return;
  await db.reminder.delete({ where: { id } });
  refresh(reminder);
}
