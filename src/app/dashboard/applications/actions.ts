"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import type { ApplicationStage } from "@/generated/prisma/client";
import { startApplication } from "@/lib/applications";
import { db } from "@/lib/db";
import { link, queueEmail } from "@/lib/email";
import { text } from "@/lib/form";
import { notify, studentSide } from "@/lib/notifications";
import type { FormState } from "@/lib/form";
import { requirePermission } from "@/lib/session";
import { stageLabels } from "./labels";

export async function createApplication(_previous: FormState, form: FormData): Promise<FormState> {
  const user = await requirePermission("APPLICATIONS", "edit");
  const result = await startApplication({
    studentId: text(form, "studentId"),
    courseId: text(form, "courseId"),
    intakeId: text(form, "intakeId") || null,
    byUserId: user.id,
  });
  if ("error" in result) return { error: result.error };
  redirect(`/dashboard/applications/${result.id}`);
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

  const [updated] = await db.$transaction([
    db.application.update({
      where: { id },
      data: { stage: stage as ApplicationStage },
      select: {
        studentId: true,
        student: { select: { userId: true, user: { select: { name: true, email: true } } } },
        course: { select: { name: true, university: { select: { name: true } } } },
        agent: { select: { user: { select: { email: true } } } },
      },
    }),
    db.applicationStageHistory.create({ data: { applicationId: id, stage: stage as ApplicationStage, note: note || null, changedById: user.id } }),
  ]);

  // The student (and their agent) hear about every stage change; the note is the one they see.
  if (application.stage !== stage) {
    const student = updated.student.user;
    const course = `${updated.course.name}, ${updated.course.university.name}`;
    const side = await studentSide(updated.studentId);
    const stageText = `Now at “${stageLabels[stage as ApplicationStage]}”.${note ? ` ${note}` : ""}`;
    notify([updated.student.userId], { type: "application.stage", title: `Your application for ${course}`, body: stageText, href: "/dashboard/my-applications" }, user.id);
    notify(side?.agents ?? [], { type: "application.stage", title: `${student.name}: ${course}`, body: stageText, href: `/dashboard/agent/students/${updated.studentId}` }, user.id);
    const update = `is now at the stage “${stageLabels[stage as ApplicationStage]}”.${note ? `\n\nNote from NRC: ${note}` : ""}`;
    queueEmail({
      to: student.email,
      subject: `Your application: ${stageLabels[stage as ApplicationStage]}`,
      text: `Hello ${student.name},\n\nYour application for ${course} ${update}\n\nSee the details: ${link("/dashboard/my-applications")}`,
    });
    if (updated.agent) {
      queueEmail({
        to: updated.agent.user.email,
        subject: `${student.name}: ${stageLabels[stage as ApplicationStage]}`,
        text: `The application of ${student.name} for ${course} ${update}\n\nSee the details: ${link(`/dashboard/agent/students/${updated.studentId}`)}`,
      });
    }
  }
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
  const [assigned] = await db.$transaction([
    db.application.update({
      where: { id },
      data: { assignedStaffId: assignedStaffId || null },
      select: { student: { select: { user: { select: { name: true } } } }, course: { select: { name: true } } },
    }),
    db.activityLog.create({ data: { userId: user.id, action: "application.assign", entityType: "Application", entityId: id, meta: { assignedStaffId } } }),
  ]);
  notify([assignedStaffId], {
    type: "application.assigned",
    title: `Application assigned to you: ${assigned.student.user.name}`,
    body: `${assigned.course.name}. By ${user.name}.`,
    href: `/dashboard/applications/${id}`,
  }, user.id);
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
