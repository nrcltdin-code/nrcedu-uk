import "server-only";
import type { ApplicationStage, Prisma } from "@/generated/prisma/client";
import { moveProblem, stageLabel } from "@/lib/application-flow";
import { link, queueEmail } from "@/lib/email";
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

// One stage move, checked against the pipeline rules and written to the history. The student
// and their agent are told about it. Callers check the user's permission first.
export async function moveApplicationStage(user: { id: string; role: string }, input: { id: string; stage: ApplicationStage; note: string; meta?: Prisma.InputJsonValue }): Promise<{ error?: string }> {
  const { id, stage, note } = input;
  if (note.length > 1000) return { error: "Keep the note under 1,000 characters." };

  const application = await db.application.findUnique({
    where: { id },
    select: {
      stage: true,
      casNumber: true,
      course: { select: { university: { select: { skippedStages: true, confirmationName: true } } } },
      _count: { select: { conditions: { where: { metAt: null } } } },
    },
  });
  if (!application) return { error: "This application no longer exists." };
  const { skippedStages, confirmationName } = application.course.university;

  const problem = moveProblem({
    from: application.stage,
    to: stage,
    isAdmin: user.role === "ADMIN",
    skippedStages,
    note,
    missingDocuments: await missingRequiredDocuments(id),
    openConditions: application._count.conditions,
    casNumber: application.casNumber,
    confirmationName,
  });
  if (problem) return { error: problem };

  const [updated] = await db.$transaction([
    db.application.update({
      where: { id },
      data: { stage },
      select: {
        studentId: true,
        student: { select: { userId: true, user: { select: { name: true, email: true } } } },
        course: { select: { name: true, university: { select: { name: true } } } },
        agent: { select: { user: { select: { email: true } } } },
      },
    }),
    applicationEvent({ applicationId: id, actorId: user.id, type: "stage", fromStage: application.stage, toStage: stage, note: note || null, visibleToStudent: true, meta: input.meta }),
  ]);

  // The student (and their agent) hear about every stage change; the note is the one they see.
  const label = stageLabel(stage, confirmationName);
  const student = updated.student.user;
  const course = `${updated.course.name}, ${updated.course.university.name}`;
  const side = await studentSide(updated.studentId);
  const stageText = `Now at “${label}”.${note ? ` ${note}` : ""}`;
  notify([updated.student.userId], { type: "application.stage", title: `Your application for ${course}`, body: stageText, href: "/dashboard/my-applications" }, user.id);
  notify(side?.agents ?? [], { type: "application.stage", title: `${student.name}: ${course}`, body: stageText, href: `/dashboard/agent/students/${updated.studentId}` }, user.id);
  const update = `is now at the stage “${label}”.${note ? `\n\nNote from NRC: ${note}` : ""}`;
  queueEmail({
    to: student.email,
    subject: `Your application: ${label}`,
    text: `Hello ${student.name},\n\nYour application for ${course} ${update}\n\nSee the details: ${link("/dashboard/my-applications")}`,
  });
  if (updated.agent) {
    queueEmail({
      to: updated.agent.user.email,
      subject: `${student.name}: ${label}`,
      text: `The application of ${student.name} for ${course} ${update}\n\nSee the details: ${link(`/dashboard/agent/students/${updated.studentId}`)}`,
    });
  }
  return {};
}
