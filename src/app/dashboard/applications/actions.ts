"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import type { ApplicationStage } from "@/generated/prisma/client";
import { db } from "@/lib/db";
import { text } from "@/lib/form";
import type { FormState } from "@/lib/form";
import { requirePermission } from "@/lib/session";
import { stageLabels } from "./labels";

export async function createApplication(_previous: FormState, form: FormData): Promise<FormState> {
  const user = await requirePermission("APPLICATIONS", "edit");

  const studentId = text(form, "studentId");
  const courseId = text(form, "courseId");
  const intakeId = text(form, "intakeId");

  const [student, course] = await Promise.all([
    db.studentProfile.findUnique({ where: { id: studentId }, select: { id: true, counsellorId: true, agentId: true } }),
    db.course.findUnique({ where: { id: courseId }, select: { id: true, universityId: true } }),
  ]);
  if (!student) return { error: "This student no longer exists." };
  if (!course) return { error: "Choose a course from the list." };
  if (intakeId) {
    // The intake must belong to the course, or to the whole university.
    const intake = await db.intake.count({
      where: { id: intakeId, universityId: course.universityId, OR: [{ courseId: null }, { courseId: course.id }] },
    });
    if (!intake) return { error: "That intake is not for this course." };
  }
  const duplicate = await db.application.count({
    where: { studentId, courseId, intakeId: intakeId || null, stage: { notIn: ["WITHDRAWN", "VISA_REFUSED"] } },
  });
  if (duplicate) return { error: "This student already has an open application for that course and intake." };

  const application = await db.application.create({
    data: {
      studentId,
      courseId,
      intakeId: intakeId || null,
      assignedStaffId: student.counsellorId,
      agentId: student.agentId,
      submittedById: user.id,
      stageHistory: { create: { stage: "NEW", changedById: user.id } },
    },
    select: { id: true },
  });
  await db.activityLog.create({ data: { userId: user.id, action: "application.create", entityType: "Application", entityId: application.id } });
  redirect(`/dashboard/applications/${application.id}`);
}

export async function moveStage(_previous: FormState, form: FormData): Promise<FormState> {
  const user = await requirePermission("APPLICATIONS", "edit");

  const id = text(form, "id");
  const stage = text(form, "stage");
  const note = text(form, "note");
  if (!(stage in stageLabels)) return { error: "Choose a stage from the list." };
  if (note.length > 1000) return { error: "Keep the note under 1,000 characters." };

  const application = await db.application.findUnique({ where: { id }, select: { stage: true } });
  if (!application) return { error: "This application no longer exists." };
  if (application.stage === stage && !note) return { error: "Choose a different stage, or add a note." };

  await db.$transaction([
    db.application.update({ where: { id }, data: { stage: stage as ApplicationStage } }),
    db.applicationStageHistory.create({ data: { applicationId: id, stage: stage as ApplicationStage, note: note || null, changedById: user.id } }),
  ]);
  revalidatePath(`/dashboard/applications/${id}`);
  return { saved: true };
}

export async function assignApplication(_previous: FormState, form: FormData): Promise<FormState> {
  const user = await requirePermission("APPLICATIONS", "edit");

  const id = text(form, "id");
  const assignedStaffId = text(form, "assignedStaffId");
  if (assignedStaffId && !(await db.user.count({ where: { id: assignedStaffId, role: { in: ["ADMIN", "STAFF"] }, status: "ACTIVE" } }))) {
    return { error: "Choose a staff member from the list." };
  }
  await db.$transaction([
    db.application.update({ where: { id }, data: { assignedStaffId: assignedStaffId || null } }),
    db.activityLog.create({ data: { userId: user.id, action: "application.assign", entityType: "Application", entityId: id, meta: { assignedStaffId } } }),
  ]);
  revalidatePath(`/dashboard/applications/${id}`);
  return { saved: true };
}

export async function addApplicationNote(_previous: FormState, form: FormData): Promise<FormState> {
  const user = await requirePermission("APPLICATIONS", "edit");
  const applicationId = text(form, "applicationId");
  const body = text(form, "body");
  if (body.length < 1 || body.length > 5000) return { error: "Write a note of up to 5,000 characters." };
  if (!(await db.application.count({ where: { id: applicationId } }))) return { error: "This application no longer exists." };

  await db.note.create({ data: { applicationId, body, authorId: user.id } });
  revalidatePath(`/dashboard/applications/${applicationId}`);
  return { saved: true };
}

// Admin only, for mistakes. Withdrawn is the normal way to close an application.
export async function deleteApplication(id: string) {
  const user = await requirePermission("APPLICATIONS", "edit");
  if (user.role !== "ADMIN") redirect(`/dashboard/applications/${id}`);
  const application = await db.application.findUnique({ where: { id }, select: { studentId: true, _count: { select: { commissions: true } } } });
  if (!application) redirect("/dashboard/applications");
  // Commission records would be deleted with it; keep the money trail.
  if (application._count.commissions) redirect(`/dashboard/applications/${id}?error=has-commission`);
  await db.$transaction([
    db.application.delete({ where: { id } }),
    db.activityLog.create({ data: { userId: user.id, action: "application.delete", entityType: "Application", entityId: id } }),
  ]);
  redirect(`/dashboard/students/${application.studentId}`);
}
