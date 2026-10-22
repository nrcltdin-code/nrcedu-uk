"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import type { ApplicationStage } from "@/generated/prisma/client";
import { applicationEvent, moveApplicationStage, startApplication } from "@/lib/applications";
import { db } from "@/lib/db";
import { optionalNumber, text } from "@/lib/form";
import { notify } from "@/lib/notifications";
import type { FormState } from "@/lib/form";
import { requirePermission } from "@/lib/session";
import { stageLabels } from "./labels";

const page = (id: string) => `/dashboard/applications/${id}`;

export async function createApplication(_previous: FormState, form: FormData): Promise<FormState> {
  const user = await requirePermission("APPLICATIONS", "edit");
  const result = await startApplication({
    studentId: text(form, "studentId"),
    courseId: text(form, "courseId"),
    intakeId: text(form, "intakeId") || null,
    byUserId: user.id,
  });
  if ("error" in result) return { error: result.error };
  redirect(page(result.id));
}

// Several applications at once, from the course finder: one per ticked course, each with
// its own intake. Each goes through startApplication, so checklists and notices work as usual.
export async function createApplications(_previous: FormState, form: FormData): Promise<FormState> {
  const user = await requirePermission("APPLICATIONS", "edit");
  const studentId = text(form, "studentId");
  const courseIds = [...new Set(form.getAll("course").map(String))].slice(0, 20);
  if (courseIds.length === 0) return { error: "Tick at least one course to apply to." };

  const failed: string[] = [];
  let started = 0;
  for (const courseId of courseIds) {
    const result = await startApplication({ studentId, courseId, intakeId: text(form, `intake-${courseId}`) || null, byUserId: user.id });
    if ("error" in result) failed.push(`${text(form, `name-${courseId}`) || "A course"}: ${result.error}`);
    else started++;
  }
  if (failed.length) {
    return { error: `${started ? `Started ${started}. ` : ""}Not started: ${failed.join(" ")}` };
  }
  redirect(`/dashboard/students/${studentId}?started=${started}#applications`);
}

// Only staff move applications. Every move is checked against the pipeline rules
// (src/lib/application-flow.ts) and written to the history.
export async function moveStage(_previous: FormState, form: FormData): Promise<FormState> {
  const user = await requirePermission("APPLICATIONS", "edit");
  const stage = text(form, "stage") as ApplicationStage;
  if (!(stage in stageLabels)) return { error: "Choose a stage from the list." };
  const result = await moveApplicationStage(user, { id: text(form, "id"), stage, note: text(form, "note") });
  if (result.error) return result;
  revalidatePath(page(text(form, "id")));
  return { saved: true };
}

// Reference numbers and money collected along the way. Each change is logged with old and new values.
export async function saveApplicationDetails(_previous: FormState, form: FormData): Promise<FormState> {
  const user = await requirePermission("APPLICATIONS", "edit");
  const id = text(form, "id");
  const next = {
    universityRef: text(form, "universityRef") || null,
    casNumber: text(form, "casNumber") || null,
    visaReference: text(form, "visaReference") || null,
  };
  if (Object.values(next).some((value) => value && value.length > 80)) return { error: "Keep each reference under 80 characters." };
  const deposit = optionalNumber(text(form, "depositAmount"));
  if (deposit === undefined || (deposit !== null && deposit < 0)) return { error: "The deposit must be a number, e.g. 2000." };

  const current = await db.application.findUnique({ where: { id }, select: { universityRef: true, casNumber: true, visaReference: true, depositAmount: true } });
  if (!current) return { error: "This application no longer exists." };

  const changes: Record<string, { from: string | null; to: string | null }> = {};
  for (const [key, value] of Object.entries(next)) {
    const before = current[key as keyof typeof next];
    if (before !== value) changes[key] = { from: before, to: value };
  }
  const depositBefore = current.depositAmount?.toString() ?? null;
  const depositAfter = deposit === null ? null : String(deposit);
  if (depositBefore === null ? depositAfter !== null : depositAfter === null || Number(depositBefore) !== deposit) {
    changes.depositAmount = { from: depositBefore, to: depositAfter };
  }
  if (!Object.keys(changes).length) return { saved: true };

  await db.$transaction([
    db.application.update({ where: { id }, data: { ...next, depositAmount: deposit } }),
    applicationEvent({ applicationId: id, actorId: user.id, type: "details.updated", meta: changes }),
  ]);
  revalidatePath(page(id));
  return { saved: true };
}

export async function addCondition(_previous: FormState, form: FormData): Promise<FormState> {
  const user = await requirePermission("APPLICATIONS", "edit");
  const applicationId = text(form, "applicationId");
  const body = text(form, "text");
  if (body.length < 2 || body.length > 300) return { error: "Describe the condition in up to 300 characters." };
  if (!(await db.application.count({ where: { id: applicationId } }))) return { error: "This application no longer exists." };

  await db.$transaction([
    db.applicationCondition.create({ data: { applicationId, text: body, createdById: user.id } }),
    applicationEvent({ applicationId, actorId: user.id, type: "condition.added", note: body, visibleToStudent: true }),
  ]);
  const side = await db.application.findUnique({ where: { id: applicationId }, select: { student: { select: { userId: true } } } });
  notify([side?.student.userId], { type: "application.condition", title: "New condition on your offer", body, href: "/dashboard/my-applications" }, user.id);
  revalidatePath(page(applicationId));
  return { saved: true };
}

export async function setConditionMet(applicationId: string, id: string, met: boolean) {
  const user = await requirePermission("APPLICATIONS", "edit");
  const condition = await db.applicationCondition.findFirst({ where: { id, applicationId }, select: { text: true } });
  if (!condition) return;
  await db.$transaction([
    db.applicationCondition.update({ where: { id }, data: met ? { metAt: new Date(), metById: user.id } : { metAt: null, metById: null } }),
    applicationEvent({ applicationId, actorId: user.id, type: met ? "condition.met" : "condition.unmet", note: condition.text, visibleToStudent: true }),
  ]);
  revalidatePath(page(applicationId));
}

export async function deleteCondition(applicationId: string, id: string) {
  const user = await requirePermission("APPLICATIONS", "edit");
  const condition = await db.applicationCondition.findFirst({ where: { id, applicationId }, select: { text: true } });
  if (!condition) return;
  await db.$transaction([
    db.applicationCondition.delete({ where: { id } }),
    applicationEvent({ applicationId, actorId: user.id, type: "condition.deleted", note: condition.text, visibleToStudent: true }),
  ]);
  revalidatePath(page(applicationId));
}

export async function assignApplication(_previous: FormState, form: FormData): Promise<FormState> {
  const user = await requirePermission("APPLICATIONS", "edit");

  const id = text(form, "id");
  const assignedStaffId = text(form, "assignedStaffId");
  if (assignedStaffId && !(await db.user.count({ where: { id: assignedStaffId, role: { in: ["ADMIN", "STAFF"] }, status: "ACTIVE" } }))) {
    return { error: "Choose a staff member from the list." };
  }
  const [assigned] = await db.$transaction([
    db.application.update({
      where: { id },
      data: { assignedStaffId: assignedStaffId || null },
      select: { student: { select: { user: { select: { name: true } } } }, course: { select: { name: true } }, assignedStaff: { select: { name: true } } },
    }),
    db.activityLog.create({ data: { userId: user.id, action: "application.assign", entityType: "Application", entityId: id, meta: { assignedStaffId } } }),
  ]);
  await applicationEvent({ applicationId: id, actorId: user.id, type: "assigned", note: assigned.assignedStaff?.name ?? "Nobody" });
  notify([assignedStaffId], {
    type: "application.assigned",
    title: `Application assigned to you: ${assigned.student.user.name}`,
    body: `${assigned.course.name}. By ${user.name}.`,
    href: page(id),
    email: true,
  }, user.id);
  revalidatePath(page(id));
  revalidatePath("/dashboard/applications");
  return { saved: true };
}

export async function addApplicationNote(_previous: FormState, form: FormData): Promise<FormState> {
  const user = await requirePermission("APPLICATIONS", "edit");
  const applicationId = text(form, "applicationId");
  const body = text(form, "body");
  if (body.length < 1 || body.length > 5000) return { error: "Write a note of up to 5,000 characters." };
  if (!(await db.application.count({ where: { id: applicationId } }))) return { error: "This application no longer exists." };

  await db.$transaction([
    db.note.create({ data: { applicationId, body, authorId: user.id } }),
    applicationEvent({ applicationId, actorId: user.id, type: "note", note: body.slice(0, 200) }),
  ]);
  revalidatePath(page(applicationId));
  return { saved: true };
}

// Admin only, for mistakes. Withdrawn is the normal way to close an application.
export async function deleteApplication(id: string) {
  const user = await requirePermission("APPLICATIONS", "edit");
  if (user.role !== "ADMIN") redirect(page(id));
  const application = await db.application.findUnique({ where: { id }, select: { studentId: true, _count: { select: { commissions: true } } } });
  if (!application) redirect("/dashboard/applications");
  // Commission records would be deleted with it; keep the money trail.
  if (application._count.commissions) redirect(`${page(id)}?error=has-commission`);
  await db.$transaction([
    db.application.delete({ where: { id } }),
    db.activityLog.create({ data: { userId: user.id, action: "application.delete", entityType: "Application", entityId: id } }),
  ]);
  redirect(`/dashboard/students/${application.studentId}`);
}
