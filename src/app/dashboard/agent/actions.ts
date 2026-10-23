"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { findMyStudent, requireAgentScope } from "@/lib/agent";
import { startApplication } from "@/lib/applications";
import { db } from "@/lib/db";
import { birthDateError, optionalDate, text } from "@/lib/form";
import type { FormState } from "@/lib/form";
import { isEmail } from "@/lib/leads";
import { requireUser } from "@/lib/session";
import { counsellorOrStaff, notify } from "@/lib/notifications";
import { findOrCreateStudent } from "@/lib/student";

export async function addMyStudent(_previous: FormState, form: FormData): Promise<FormState> {
  const user = await requireUser();
  const scope = await requireAgentScope("APPLICATIONS");

  const name = text(form, "name");
  const email = text(form, "email").toLowerCase();
  const phone = text(form, "phone");
  const countryId = text(form, "countryId");

  if (name.length < 2 || name.length > 100) return { error: "Enter the student's full name." };
  if (!isEmail(email)) return { error: "Enter the student's own email address." };
  if (phone.length > 30) return { error: "The phone number is too long." };
  if (countryId && !(await db.country.count({ where: { id: countryId } }))) return { error: "Choose a country from the list." };

  // Agents can only register people NRC does not know yet, so nobody can claim another
  // agent's (or NRC's own) student. Staff can link existing students to an agent.
  if (await db.user.count({ where: { email } })) {
    return { error: "This person is already registered with NRC. Contact us if they should be linked to you." };
  }
  const routing = countryId ? await db.countryAssignment.findUnique({ where: { countryId }, select: { staffId: true } }) : null;

  const student = await findOrCreateStudent({
    name,
    email,
    phone: phone || null,
    countryId: countryId || null,
    counsellorId: routing?.staffId ?? null,
    agentId: scope.agentId,
    addedById: user.id,
  });
  if ("error" in student) return { error: student.error };

  await db.activityLog.create({ data: { userId: user.id, action: "student.create", entityType: "StudentProfile", entityId: student.id, meta: { byAgent: scope.agentId } } });
  notify(await counsellorOrStaff(routing?.staffId, "STUDENTS"), {
    type: "student.agent-added",
    title: `New student from an agent: ${name}`,
    body: `Added by ${user.name}.`,
    href: `/dashboard/students/${student.id}`,
    email: true,
  });
  // A team member's new student also shows up for the agency owner.
  if (!scope.isOwner) {
    const owner = await db.agentProfile.findUnique({ where: { id: scope.agentId }, select: { userId: true } });
    notify([owner?.userId], { type: "student.agent-added", title: `${user.name} added a student: ${name}`, href: `/dashboard/agent/students/${student.id}`, email: true }, user.id);
  }
  redirect(`/dashboard/agent/students/${student.id}`);
}

export async function updateMyStudent(_previous: FormState, form: FormData): Promise<FormState> {
  const scope = await requireAgentScope("APPLICATIONS");
  const id = text(form, "id");
  const student = await db.studentProfile.findFirst({ where: { id, ...scope.students }, select: { userId: true } });
  if (!student) return { error: "This student is not on your list." };

  const name = text(form, "name");
  const phone = text(form, "phone");
  const countryId = text(form, "countryId");
  const dateOfBirth = optionalDate(text(form, "dateOfBirth"));
  const passportExpiry = optionalDate(text(form, "passportExpiry"));
  const fields = {
    gender: text(form, "gender"),
    nationality: text(form, "nationality"),
    passportNumber: text(form, "passportNumber"),
    address: text(form, "address"),
  };

  if (name.length < 2 || name.length > 100) return { error: "Enter the student's full name." };
  if (phone.length > 30) return { error: "The phone number is too long." };
  if (dateOfBirth === undefined || passportExpiry === undefined) return { error: "Check the dates." };
  const badBirthDate = birthDateError(dateOfBirth);
  if (badBirthDate) return { error: badBirthDate };
  if (fields.gender.length > 30 || fields.nationality.length > 60 || fields.passportNumber.length > 30) return { error: "One of the fields is too long." };
  if (fields.address.length > 300) return { error: "Keep the address under 300 characters." };
  if (countryId && !(await db.country.count({ where: { id: countryId } }))) return { error: "Choose a country from the list." };

  await db.$transaction([
    db.user.update({ where: { id: student.userId }, data: { name, phone: phone || null } }),
    db.studentProfile.update({
      where: { id },
      data: {
        phone: phone || null,
        countryId: countryId || null,
        dateOfBirth,
        passportExpiry,
        gender: fields.gender || null,
        nationality: fields.nationality || null,
        passportNumber: fields.passportNumber || null,
        address: fields.address || null,
        profileConfirmedAt: null,
        profileConfirmedBy: null,
      },
    }),
  ]);
  revalidatePath(`/dashboard/agent/students/${id}`);
  return { saved: true };
}

export async function applyForMyStudent(_previous: FormState, form: FormData): Promise<FormState> {
  const user = await requireUser();
  const scope = await requireAgentScope("APPLICATIONS");
  const studentId = text(form, "studentId");
  const courseId = text(form, "courseId");
  if (!(await findMyStudent(scope, studentId))) return { error: "This student is not on your list." };
  if (!(await db.course.count({ where: { id: courseId, isPublished: true, university: { isPublished: true } } }))) {
    return { error: "This course is not open for applications." };
  }

  const result = await startApplication({ studentId, courseId, intakeId: text(form, "intakeId") || null, byUserId: user.id });
  if ("error" in result) return { error: result.error };
  revalidatePath(`/dashboard/agent/students/${studentId}`);
  return { saved: true };
}
