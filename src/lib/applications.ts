import "server-only";
import type { Prisma } from "@/generated/prisma/client";
import { db } from "@/lib/db";
import { counsellorOrStaff, notify, studentSide } from "@/lib/notifications";

export { nextStepText } from "@/lib/application-flow";

// Shared by staff (student page), students (portal Apply page) and later agents.
export async function startApplication(input: { studentId: string; courseId: string; intakeId: string | null; byUserId: string; byStudent?: boolean }) {
  const [student, course] = await Promise.all([
    db.studentProfile.findUnique({ where: { id: input.studentId }, select: { id: true, counsellorId: true, agentId: true, canStartApplications: true } }),
    db.course.findFirst({
      where: { id: input.courseId },
      select: {
        id: true,
        universityId: true,
        name: true,
        university: { select: { name: true, requirements: { orderBy: [{ sortOrder: "asc" }, { label: "asc" }] } } },
      },
    }),
  ]);
  if (!student) return { error: "This student no longer exists." };
  if (!course) return { error: "Choose a course from the list." };
  // Staff can switch off self-service applications for a student; staff can still add them.
  if (input.byStudent && !student.canStartApplications) {
    return { error: "New applications are paused on your account. Message your counsellor to add another university." };
  }
  if (input.intakeId) {
    // The intake must be open and belong to the course, or to the whole university.
    const intake = await db.intake.count({
      where: { id: input.intakeId, isOpen: true, universityId: course.universityId, OR: [{ courseId: null }, { courseId: course.id }] },
    });
    if (!intake) return { error: "That intake is not open for this course." };
  }
  const duplicate = await db.application.count({
    where: { studentId: student.id, courseId: course.id, intakeId: input.intakeId, stage: { notIn: ["WITHDRAWN", "REJECTED", "OFFER_DECLINED", "VISA_REFUSED"] } },
  });
  if (duplicate) return { error: "There is already an open application for that course and intake." };

  const application = await db.application.create({
    data: {
      studentId: student.id,
      courseId: course.id,
      intakeId: input.intakeId,
      assignedStaffId: student.counsellorId,
      agentId: student.agentId,
      submittedById: input.byUserId,
      events: { create: { type: "created", toStage: "NEW", actorId: input.byUserId, visibleToStudent: true } },
      // The university's own checklist becomes this application's document requests.
      documentRequests: {
        create: course.university.requirements.map((r) => ({
          studentId: student.id,
          type: r.type,
          label: r.label,
          instructions: r.instructions,
          required: r.required,
          createdById: input.byUserId,
        })),
      },
    },
    select: { id: true },
  });
  await db.activityLog.create({ data: { userId: input.byUserId, action: "application.create", entityType: "Application", entityId: application.id } });

  // Staff hear about applications the student or an agent started; the student and their
  // agents hear about ones started for them. Whoever started it is skipped.
  const side = await studentSide(student.id);
  const courseName = `${course.name}, ${course.university.name}`;
  notify(await counsellorOrStaff(student.counsellorId, "APPLICATIONS"), {
    type: "application.new",
    title: `New application: ${side?.user.name ?? "a student"}`,
    body: courseName,
    href: `/dashboard/applications/${application.id}`,
    email: true,
  }, input.byUserId);
  notify([side?.userId], { type: "application.new", title: "New application started for you", body: courseName, href: "/dashboard/my-applications", email: true }, input.byUserId);
  notify(side?.agents ?? [], { type: "application.new", title: `New application: ${side?.user.name ?? "a student"}`, body: courseName, href: `/dashboard/agent/students/${student.id}`, email: true }, input.byUserId);
  return { id: application.id };
}

type EventInput = Omit<Prisma.ApplicationEventUncheckedCreateInput, "id" | "createdAt">;

// One line in an application's history. Put it in the same transaction as the change it records.
export const applicationEvent = (event: EventInput) => db.applicationEvent.create({ data: event });

// Required requests on an application that still lack an approved file.
export const missingRequiredDocuments = (applicationId: string) =>
  db.documentRequest.count({ where: { applicationId, required: true, status: { notIn: ["APPROVED", "WAIVED"] } } });
