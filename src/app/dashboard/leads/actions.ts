"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import type { LeadStatus, Prisma, StudyLevel } from "@/generated/prisma/client";
import { db } from "@/lib/db";
import { link, queueEmail } from "@/lib/email";
import { notify } from "@/lib/notifications";
import { text } from "@/lib/form";
import type { FormState } from "@/lib/form";
import { createLead, isEmail } from "@/lib/leads";
import { requirePermission } from "@/lib/session";
import { leadStatusLabels, studyLevelLabels } from "./labels";

const log = (userId: string, action: string, entityId: string, meta?: Prisma.InputJsonValue) =>
  db.activityLog.create({ data: { userId, action, entityType: "Lead", entityId, meta } });

// Assignees must be real, active staff/admins or approved agents; never trust the posted id.
async function checkAssignees(staffId: string, agentId: string) {
  if (staffId) {
    const staff = await db.user.findFirst({ where: { id: staffId, role: { in: ["ADMIN", "STAFF"] }, status: "ACTIVE" } });
    if (!staff) return "Choose a staff member from the list.";
  }
  if (agentId) {
    const agent = await db.agentProfile.findFirst({ where: { id: agentId, approvalStatus: "APPROVED" } });
    if (!agent) return "Choose an approved agent from the list.";
  }
  return null;
}

async function checkCountry(id: string) {
  return !id || (await db.country.count({ where: { id } })) > 0;
}

export async function addLead(_previous: FormState, form: FormData): Promise<FormState> {
  const user = await requirePermission("LEADS", "edit");

  const name = text(form, "name");
  const email = text(form, "email");
  const phone = text(form, "phone");
  const message = text(form, "message");
  const countryId = text(form, "countryId");
  const destinationCountryId = text(form, "destinationCountryId");
  const studyLevel = text(form, "studyLevel");

  if (name.length < 2 || name.length > 100) return { error: "Enter the person's name." };
  if (!isEmail(email)) return { error: "Enter a valid email address." };
  if (phone.length > 30) return { error: "The phone number is too long." };
  if (message.length > 3000) return { error: "Keep the message under 3,000 characters." };
  if (studyLevel && (!(studyLevel in studyLevelLabels) || studyLevel === "SCHOOL")) return { error: "Choose a study level from the list." };
  if (!(await checkCountry(countryId)) || !(await checkCountry(destinationCountryId))) return { error: "Choose a country from the list." };

  const lead = await createLead({
    name,
    email,
    phone,
    message,
    source: "MANUAL",
    countryId: countryId || undefined,
    destinationCountryId: destinationCountryId || undefined,
    studyLevel: (studyLevel as StudyLevel) || undefined,
  });
  await log(user.id, "lead.create", lead.id);
  redirect(`/dashboard/leads/${lead.id}`);
}

export async function updateLead(_previous: FormState, form: FormData): Promise<FormState> {
  const user = await requirePermission("LEADS", "edit");

  const id = text(form, "id");
  const status = text(form, "status");
  const assignedStaffId = text(form, "assignedStaffId");
  const assignedAgentId = text(form, "assignedAgentId");

  if (!(status in leadStatusLabels)) return { error: "Choose a status from the list." };
  const badAssignee = await checkAssignees(assignedStaffId, assignedAgentId);
  if (badAssignee) return { error: badAssignee };

  const before = await db.lead.findUnique({ where: { id }, select: { status: true, assignedStaffId: true, assignedAgentId: true } });
  if (!before) return { error: "This lead no longer exists." };

  const after = { status: status as LeadStatus, assignedStaffId: assignedStaffId || null, assignedAgentId: assignedAgentId || null };
  const changes: Record<string, { from: string | null; to: string | null }> = {};
  for (const key of ["status", "assignedStaffId", "assignedAgentId"] as const) {
    if (before[key] !== after[key]) changes[key] = { from: before[key], to: after[key] };
  }
  if (Object.keys(changes).length === 0) return { saved: true };

  const [lead] = await db.$transaction([
    db.lead.update({ where: { id }, data: after, select: { name: true, assignedStaff: { select: { id: true, email: true } } } }),
    log(user.id, "lead.update", id, changes),
  ]);
  // Tell a counsellor when someone else hands them a lead.
  if (changes.assignedStaffId && lead.assignedStaff) {
    notify([lead.assignedStaff.id], { type: "lead.assigned", title: `Lead assigned to you: ${lead.name}`, body: `By ${user.name}.`, href: `/dashboard/leads/${id}` }, user.id);
  }
  if (changes.assignedStaffId && lead.assignedStaff && lead.assignedStaff.id !== user.id) {
    queueEmail({
      to: lead.assignedStaff.email,
      subject: `Lead assigned to you: ${lead.name}`,
      text: `${user.name} assigned the lead ${lead.name} to you.\n\nOpen the lead: ${link(`/dashboard/leads/${id}`)}`,
    });
  }
  revalidatePath(`/dashboard/leads/${id}`);
  return { saved: true };
}

export async function addLeadNote(_previous: FormState, form: FormData): Promise<FormState> {
  const user = await requirePermission("LEADS", "edit");

  const leadId = text(form, "leadId");
  const body = text(form, "body");
  if (body.length < 1 || body.length > 5000) return { error: "Write a note of up to 5,000 characters." };
  if ((await db.lead.count({ where: { id: leadId } })) === 0) return { error: "This lead no longer exists." };

  await db.note.create({ data: { leadId, body, authorId: user.id } });
  revalidatePath(`/dashboard/leads/${leadId}`);
  return { saved: true };
}

// Admin only: removes spam or duplicates. Notes go with it.
export async function deleteLead(id: string) {
  const user = await requirePermission("LEADS", "edit");
  if (user.role !== "ADMIN") redirect(`/dashboard/leads/${id}`);
  await db.$transaction([db.lead.delete({ where: { id } }), log(user.id, "lead.delete", id)]);
  redirect("/dashboard/leads");
}

// Default owner for new leads from a country (see lib/leads.ts).
export async function saveRouting(_previous: FormState, form: FormData): Promise<FormState> {
  const user = await requirePermission("LEADS", "edit");
  if (user.role !== "ADMIN") return { error: "Only an administrator can change lead routing." };

  const countryId = text(form, "countryId");
  const staffId = text(form, "staffId");
  const agentId = text(form, "agentId");
  if (!countryId || !(await checkCountry(countryId))) return { error: "Choose a country from the list." };
  const badAssignee = await checkAssignees(staffId, agentId);
  if (badAssignee) return { error: badAssignee };

  if (!staffId && !agentId) await db.countryAssignment.deleteMany({ where: { countryId } });
  else {
    const data = { staffId: staffId || null, agentId: agentId || null };
    await db.countryAssignment.upsert({ where: { countryId }, create: { countryId, ...data }, update: data });
  }
  await db.activityLog.create({ data: { userId: user.id, action: "routing.update", entityType: "Country", entityId: countryId, meta: { staffId, agentId } } });
  revalidatePath("/dashboard/leads/routing");
  return { saved: true };
}
