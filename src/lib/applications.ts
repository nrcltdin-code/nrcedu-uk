import "server-only";
import type { ApplicationStage } from "@/generated/prisma/client";
import { db } from "@/lib/db";
import { counsellorOrStaff, notify, studentSide } from "@/lib/notifications";

// Shared by staff (student page), students (portal Apply page) and later agents.
export async function startApplication(input: { studentId: string; courseId: string; intakeId: string | null; byUserId: string }) {
  const [student, course] = await Promise.all([
    db.studentProfile.findUnique({ where: { id: input.studentId }, select: { id: true, counsellorId: true, agentId: true } }),
    db.course.findFirst({ where: { id: input.courseId }, select: { id: true, universityId: true, name: true, university: { select: { name: true } } } }),
  ]);
  if (!student) return { error: "This student no longer exists." };
  if (!course) return { error: "Choose a course from the list." };
  if (input.intakeId) {
    // The intake must be open and belong to the course, or to the whole university.
    const intake = await db.intake.count({
      where: { id: input.intakeId, isOpen: true, universityId: course.universityId, OR: [{ courseId: null }, { courseId: course.id }] },
    });
    if (!intake) return { error: "That intake is not open for this course." };
  }
  const duplicate = await db.application.count({
    where: { studentId: student.id, courseId: course.id, intakeId: input.intakeId, stage: { notIn: ["WITHDRAWN", "VISA_REFUSED"] } },
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
      stageHistory: { create: { stage: "NEW", changedById: input.byUserId } },
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
  }, input.byUserId);
  notify([side?.userId], { type: "application.new", title: "New application started for you", body: courseName, href: "/dashboard/my-applications" }, input.byUserId);
  notify(side?.agents ?? [], { type: "application.new", title: `New application: ${side?.user.name ?? "a student"}`, body: courseName, href: `/dashboard/agent/students/${student.id}` }, input.byUserId);
  return { id: application.id };
}

// Plain-language "what happens now" for students and agents, per stage.
export const nextStepText: Record<ApplicationStage, string> = {
  NEW: "Your counsellor will review this application and contact you about the next steps.",
  DOCUMENTS_PENDING: "Upload the documents your counsellor asked for on the Documents page.",
  SUBMITTED_TO_UNIVERSITY: "The university has your application. Decisions usually take 2 to 6 weeks.",
  OFFER_RECEIVED: "You have an offer. Your counsellor will explain any conditions and the deposit.",
  DEPOSIT_CAS: "Pay the deposit if you have not yet. The university then issues your CAS or acceptance letter.",
  VISA_APPLIED: "Your visa application is with the embassy. Keep your passport ready for collection.",
  VISA_GRANTED: "Visa granted. Book your travel and check the university's arrival and enrolment dates.",
  VISA_REFUSED: "Your counsellor will talk you through the refusal and your options.",
  ENROLLED: "You are enrolled. Good luck with your studies!",
  WITHDRAWN: "This application was withdrawn.",
};
