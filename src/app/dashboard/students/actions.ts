"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import type { Prisma } from "@/generated/prisma/client";
import { db } from "@/lib/db";
import { text } from "@/lib/form";
import type { FormState } from "@/lib/form";
import { isEmail } from "@/lib/leads";
import { requirePermission } from "@/lib/session";

const log = (userId: string, action: string, entityType: string, entityId: string, meta?: Prisma.InputJsonValue) =>
  db.activityLog.create({ data: { userId, action, entityType, entityId, meta } });

type NewStudent = {
  name: string;
  email: string;
  phone: string | null;
  countryId: string | null;
  counsellorId: string | null;
  agentId: string | null;
};

// Students are User accounts with role STUDENT. Staff-created ones have no password yet;
// the student sets one when they are invited to the portal (task 4.4).
async function findOrCreateStudent(student: NewStudent): Promise<{ id: string } | { error: string }> {
  const email = student.email.toLowerCase();
  const existing = await db.user.findUnique({ where: { email }, include: { studentProfile: { select: { id: true } } } });

  if (existing) {
    if (existing.role !== "STUDENT") return { error: `${email} belongs to a staff or agent account, so it cannot be a student.` };
    if (existing.studentProfile) return existing.studentProfile;
    return db.studentProfile.create({
      data: { userId: existing.id, phone: student.phone, countryId: student.countryId, counsellorId: student.counsellorId, agentId: student.agentId },
      select: { id: true },
    });
  }

  const user = await db.user.create({
    data: {
      name: student.name,
      email,
      phone: student.phone,
      role: "STUDENT",
      studentProfile: {
        create: { phone: student.phone, countryId: student.countryId, counsellorId: student.counsellorId, agentId: student.agentId },
      },
    },
    select: { studentProfile: { select: { id: true } } },
  });
  return user.studentProfile!;
}

async function checkPeople(counsellorId: string, agentId: string) {
  if (counsellorId && !(await db.user.count({ where: { id: counsellorId, role: { in: ["ADMIN", "STAFF"] }, status: "ACTIVE" } }))) {
    return "Choose a counsellor from the list.";
  }
  if (agentId && !(await db.agentProfile.count({ where: { id: agentId, approvalStatus: "APPROVED" } }))) {
    return "Choose an approved agent from the list.";
  }
  return null;
}

export async function convertLead(leadId: string) {
  const user = await requirePermission("STUDENTS", "edit");
  const lead = await db.lead.findUnique({ where: { id: leadId } });
  if (!lead) redirect("/dashboard/leads");
  if (lead.studentId) redirect(`/dashboard/students/${lead.studentId}`);

  const student = await findOrCreateStudent({
    name: lead.name,
    email: lead.email,
    phone: lead.phone,
    countryId: lead.countryId,
    counsellorId: lead.assignedStaffId,
    agentId: lead.assignedAgentId,
  });
  if ("error" in student) redirect(`/dashboard/leads/${leadId}?error=email-taken`);

  // Another lead may already point at this student (same email, two enquiries).
  const linked = await db.lead.count({ where: { studentId: student.id } });
  await db.$transaction([
    db.lead.update({ where: { id: leadId }, data: { status: "CONVERTED", ...(linked ? {} : { studentId: student.id }) } }),
    log(user.id, "lead.update", "Lead", leadId, { status: { from: lead.status, to: "CONVERTED" } }),
    log(user.id, "student.create", "StudentProfile", student.id, { fromLead: leadId }),
  ]);
  redirect(`/dashboard/students/${student.id}`);
}

export async function addStudent(_previous: FormState, form: FormData): Promise<FormState> {
  const user = await requirePermission("STUDENTS", "edit");

  const name = text(form, "name");
  const email = text(form, "email");
  const phone = text(form, "phone");
  const countryId = text(form, "countryId");
  const counsellorId = text(form, "counsellorId");
  const agentId = text(form, "agentId");

  if (name.length < 2 || name.length > 100) return { error: "Enter the student's name." };
  if (!isEmail(email)) return { error: "Enter a valid email address." };
  if (phone.length > 30) return { error: "The phone number is too long." };
  if (countryId && !(await db.country.count({ where: { id: countryId } }))) return { error: "Choose a country from the list." };
  const badPerson = await checkPeople(counsellorId, agentId);
  if (badPerson) return { error: badPerson };

  const student = await findOrCreateStudent({
    name,
    email,
    phone: phone || null,
    countryId: countryId || null,
    counsellorId: counsellorId || null,
    agentId: agentId || null,
  });
  if ("error" in student) return student;

  await log(user.id, "student.create", "StudentProfile", student.id);
  redirect(`/dashboard/students/${student.id}`);
}

const optionalDate = (value: string) => {
  if (!value) return null;
  const date = new Date(`${value}T00:00:00Z`);
  return Number.isNaN(date.getTime()) ? undefined : date;
};

export async function updateStudent(_previous: FormState, form: FormData): Promise<FormState> {
  const user = await requirePermission("STUDENTS", "edit");

  const id = text(form, "id");
  const name = text(form, "name");
  const phone = text(form, "phone");
  const countryId = text(form, "countryId");
  const counsellorId = text(form, "counsellorId");
  const agentId = text(form, "agentId");
  const dateOfBirth = optionalDate(text(form, "dateOfBirth"));
  const passportExpiry = optionalDate(text(form, "passportExpiry"));
  const fields = {
    gender: text(form, "gender"),
    nationality: text(form, "nationality"),
    passportNumber: text(form, "passportNumber"),
    address: text(form, "address"),
  };

  if (name.length < 2 || name.length > 100) return { error: "Enter the student's name." };
  if (phone.length > 30) return { error: "The phone number is too long." };
  if (dateOfBirth === undefined || passportExpiry === undefined) return { error: "Check the dates." };
  if (fields.gender.length > 30 || fields.nationality.length > 60 || fields.passportNumber.length > 30) return { error: "One of the fields is too long." };
  if (fields.address.length > 300) return { error: "Keep the address under 300 characters." };
  if (countryId && !(await db.country.count({ where: { id: countryId } }))) return { error: "Choose a country from the list." };
  const badPerson = await checkPeople(counsellorId, agentId);
  if (badPerson) return { error: badPerson };

  const profile = await db.studentProfile.findUnique({ where: { id }, select: { userId: true } });
  if (!profile) return { error: "This student no longer exists." };

  await db.$transaction([
    db.user.update({ where: { id: profile.userId }, data: { name, phone: phone || null } }),
    db.studentProfile.update({
      where: { id },
      data: {
        phone: phone || null,
        countryId: countryId || null,
        counsellorId: counsellorId || null,
        agentId: agentId || null,
        dateOfBirth,
        passportExpiry,
        gender: fields.gender || null,
        nationality: fields.nationality || null,
        passportNumber: fields.passportNumber || null,
        address: fields.address || null,
      },
    }),
    log(user.id, "student.update", "StudentProfile", id),
  ]);
  revalidatePath(`/dashboard/students/${id}`);
  return { saved: true };
}

export async function addStudentNote(_previous: FormState, form: FormData): Promise<FormState> {
  const user = await requirePermission("STUDENTS", "edit");
  const studentId = text(form, "studentId");
  const body = text(form, "body");
  if (body.length < 1 || body.length > 5000) return { error: "Write a note of up to 5,000 characters." };
  if (!(await db.studentProfile.count({ where: { id: studentId } }))) return { error: "This student no longer exists." };

  await db.note.create({ data: { studentId, body, authorId: user.id } });
  revalidatePath(`/dashboard/students/${studentId}`);
  return { saved: true };
}
