"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import type { LeadStatus, StudyLevel } from "@/generated/prisma/client";
import { requireAgentScope } from "@/lib/agent";
import { db } from "@/lib/db";
import { text } from "@/lib/form";
import type { FormState } from "@/lib/form";
import { isEmail } from "@/lib/leads";
import { counsellorOrStaff, notify } from "@/lib/notifications";
import { requireUser } from "@/lib/session";
import { findOrCreateStudent } from "@/lib/student";
import { studyLevelLabels } from "../../leads/labels";

// The agency's CRM. Every action is limited to leads the agent account may see (scope.leads).

const page = (id: string) => `/dashboard/agent/leads/${id}`;
const workingStatuses: LeadStatus[] = ["NEW", "CONTACTED", "QUALIFIED", "LOST"];

async function myLead(id: string) {
  const scope = await requireAgentScope("LEADS");
  const lead = await db.lead.findFirst({ where: { id, ...scope.leads }, select: { id: true, status: true, studentId: true, name: true, email: true, phone: true, countryId: true } });
  return { scope, lead };
}

function readFollowUp(value: string): Date | null | undefined {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? undefined : date;
}

export async function addAgentLead(_previous: FormState, form: FormData): Promise<FormState> {
  const user = await requireUser();
  const scope = await requireAgentScope("LEADS");
  const name = text(form, "name");
  const email = text(form, "email").toLowerCase();
  const phone = text(form, "phone");
  const countryId = text(form, "countryId");
  const destinationCountryId = text(form, "destinationCountryId");
  const studyLevel = text(form, "studyLevel");
  const message = text(form, "message");
  const followUpAt = readFollowUp(text(form, "followUpAt"));

  if (name.length < 2 || name.length > 100) return { error: "Enter the person's name." };
  if (!isEmail(email)) return { error: "Enter a valid email address." };
  if (phone.length > 30 || message.length > 2000) return { error: "One of the fields is too long." };
  if (studyLevel && (!(studyLevel in studyLevelLabels) || studyLevel === "SCHOOL")) return { error: "Choose a study level from the list." };
  if (followUpAt === undefined) return { error: "The follow-up date is not valid." };
  for (const id of [countryId, destinationCountryId]) {
    if (id && !(await db.country.count({ where: { id } }))) return { error: "Choose a country from the list." };
  }

  const lead = await db.lead.create({
    data: {
      name,
      email,
      phone: phone || null,
      message: message || null,
      source: "AGENT",
      countryId: countryId || null,
      destinationCountryId: destinationCountryId || null,
      studyLevel: (studyLevel as StudyLevel) || null,
      assignedAgentId: scope.agentId,
      agentUserId: user.id,
      followUpAt,
    },
    select: { id: true },
  });
  await db.activityLog.create({ data: { userId: user.id, action: "lead.create", entityType: "Lead", entityId: lead.id, meta: { byAgent: scope.agentId } } });
  redirect(page(lead.id));
}

export async function updateAgentLead(_previous: FormState, form: FormData): Promise<FormState> {
  const user = await requireUser();
  const { scope, lead } = await myLead(text(form, "id"));
  if (!lead) return { error: "This lead is not on your list." };
  const status = text(form, "status") as LeadStatus;
  const followUpAt = readFollowUp(text(form, "followUpAt"));
  const agentUserId = text(form, "agentUserId");
  if (lead.status !== "CONVERTED" && !workingStatuses.includes(status)) return { error: "Choose a status from the list." };
  if (followUpAt === undefined) return { error: "The follow-up date is not valid." };
  // Only people who see the whole agency can hand a lead to someone else.
  if (agentUserId && scope.can("ALL_STUDENTS") && !(await db.user.count({ where: { id: agentUserId, status: "ACTIVE", OR: [{ id: scope.ownerUserId }, { agentTeamId: scope.agentId }] } }))) {
    return { error: "Choose someone from your team." };
  }

  const data = {
    ...(lead.status !== "CONVERTED" && { status }),
    followUpAt,
    ...(scope.can("ALL_STUDENTS") && agentUserId && { agentUserId }),
  };
  await db.$transaction([
    db.lead.update({ where: { id: lead.id }, data }),
    db.activityLog.create({ data: { userId: user.id, action: "lead.update", entityType: "Lead", entityId: lead.id, meta: { status: { from: lead.status, to: data.status ?? lead.status }, agentUserId: agentUserId || null } } }),
  ]);
  if (agentUserId && agentUserId !== user.id && scope.can("ALL_STUDENTS")) {
    notify([agentUserId], { type: "lead.assigned", title: `Lead handed to you: ${lead.name}`, body: `By ${user.name}.`, href: page(lead.id) }, user.id);
  }
  revalidatePath(page(lead.id));
  return { saved: true };
}

// Agency notes: the agency sees them, NRC staff can too.
export async function addAgentLeadNote(_previous: FormState, form: FormData): Promise<FormState> {
  const user = await requireUser();
  const { scope, lead } = await myLead(text(form, "leadId"));
  if (!lead) return { error: "This lead is not on your list." };
  const body = text(form, "body");
  if (body.length < 1 || body.length > 5000) return { error: "Write a note of up to 5,000 characters." };
  await db.note.create({ data: { leadId: lead.id, body, authorId: user.id, agentId: scope.agentId } });
  // Writing a note counts as contact: a new lead moves on to Contacted.
  if (lead.status === "NEW") await db.lead.update({ where: { id: lead.id }, data: { status: "CONTACTED" } });
  revalidatePath(page(lead.id));
  return { saved: true };
}

// Makes the lead a student of the agency (a portal account the student can claim later).
export async function convertAgentLead(id: string) {
  const user = await requireUser();
  const { scope, lead } = await myLead(id);
  if (!lead) redirect("/dashboard/agent/leads");
  if (lead.studentId) redirect(`/dashboard/agent/students/${lead.studentId}`);
  if (!scope.can("APPLICATIONS")) redirect(`${page(id)}?error=no-access`);

  const existing = await db.user.findUnique({ where: { email: lead.email }, select: { studentProfile: { select: { id: true, agentId: true } } } });
  // Someone NRC already knows stays with whoever has them; staff can link them by hand.
  if (existing && existing.studentProfile?.agentId !== scope.agentId) redirect(`${page(id)}?error=known`);

  const routing = lead.countryId ? await db.countryAssignment.findUnique({ where: { countryId: lead.countryId }, select: { staffId: true } }) : null;
  const student = existing?.studentProfile
    ? { id: existing.studentProfile.id }
    : await findOrCreateStudent({ name: lead.name, email: lead.email, phone: lead.phone, countryId: lead.countryId, counsellorId: routing?.staffId ?? null, agentId: scope.agentId, addedById: user.id });
  if ("error" in student) redirect(`${page(id)}?error=known`);

  await db.$transaction([
    db.lead.update({ where: { id: lead.id }, data: { status: "CONVERTED", studentId: student.id } }),
    db.activityLog.create({ data: { userId: user.id, action: "student.create", entityType: "StudentProfile", entityId: student.id, meta: { fromLead: lead.id, byAgent: scope.agentId } } }),
  ]);
  notify(await counsellorOrStaff(routing?.staffId, "STUDENTS"), {
    type: "student.agent-added",
    title: `New student from an agent: ${lead.name}`,
    body: `Converted from a lead by ${user.name}.`,
    href: `/dashboard/students/${student.id}`,
    email: true,
  });
  redirect(`/dashboard/agent/students/${student.id}`);
}
