"use server";

import { revalidatePath } from "next/cache";
import type { StudyLevel } from "@/generated/prisma/client";
import { db } from "@/lib/db";
import { canAccessStudent } from "@/lib/documents";
import { birthDateError, optionalDate, text } from "@/lib/form";
import type { FormState } from "@/lib/form";
import { requireUser } from "@/lib/session";
import { requireMyStudentId } from "@/lib/student";
import { studyLevelLabels } from "../leads/labels";

// Education and test scores are edited by the student in the portal and by staff on the
// student page; canAccessStudent decides who may change which record.

function refresh(studentId: string) {
  revalidatePath("/dashboard/profile");
  revalidatePath(`/dashboard/students/${studentId}`);
}

export async function saveMyDetails(_previous: FormState, form: FormData): Promise<FormState> {
  const user = await requireUser();
  const studentId = await requireMyStudentId();

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

  if (name.length < 2 || name.length > 100) return { error: "Enter your full name." };
  if (phone.length > 30) return { error: "The phone number is too long." };
  if (dateOfBirth === undefined || passportExpiry === undefined) return { error: "Check the dates." };
  const badBirthDate = birthDateError(dateOfBirth);
  if (badBirthDate) return { error: badBirthDate };
  if (fields.gender.length > 30 || fields.nationality.length > 60 || fields.passportNumber.length > 30) return { error: "One of the fields is too long." };
  if (fields.address.length > 300) return { error: "Keep the address under 300 characters." };
  if (countryId && !(await db.country.count({ where: { id: countryId } }))) return { error: "Choose a country from the list." };

  await db.$transaction([
    db.user.update({ where: { id: user.id }, data: { name, phone: phone || null } }),
    db.studentProfile.update({
      where: { id: studentId },
      data: {
        phone: phone || null,
        countryId: countryId || null,
        dateOfBirth,
        passportExpiry,
        gender: fields.gender || null,
        nationality: fields.nationality || null,
        passportNumber: fields.passportNumber || null,
        address: fields.address || null,
      },
    }),
  ]);
  refresh(studentId);
  return { saved: true };
}

export async function addEducation(_previous: FormState, form: FormData): Promise<FormState> {
  const user = await requireUser();
  const studentId = text(form, "studentId");
  if (!(await canAccessStudent(user, studentId, "edit"))) return { error: "You cannot change this record." };

  const level = text(form, "level");
  const institution = text(form, "institution");
  const fieldOfStudy = text(form, "fieldOfStudy");
  const result = text(form, "result");
  const year = text(form, "yearCompleted");
  const yearCompleted = year ? Number(year) : null;

  if (!(level in studyLevelLabels)) return { error: "Choose a level." };
  if (institution.length < 2 || institution.length > 150) return { error: "Enter the school, college or university." };
  if (fieldOfStudy.length > 100 || result.length > 60) return { error: "One of the fields is too long." };
  if (yearCompleted !== null && (!Number.isInteger(yearCompleted) || yearCompleted < 1950 || yearCompleted > 2100)) {
    return { error: "Enter the year as four digits." };
  }
  if ((await db.educationRecord.count({ where: { studentId } })) >= 15) return { error: "That is the most entries allowed." };

  await db.educationRecord.create({
    data: { studentId, level: level as StudyLevel, institution, fieldOfStudy: fieldOfStudy || null, result: result || null, yearCompleted },
  });
  refresh(studentId);
  return { saved: true };
}

export async function deleteEducation(id: string) {
  const user = await requireUser();
  const record = await db.educationRecord.findUnique({ where: { id }, select: { studentId: true } });
  if (!record || !(await canAccessStudent(user, record.studentId, "edit"))) return;
  await db.educationRecord.delete({ where: { id } });
  refresh(record.studentId);
}

export async function addTestScore(_previous: FormState, form: FormData): Promise<FormState> {
  const user = await requireUser();
  const studentId = text(form, "studentId");
  if (!(await canAccessStudent(user, studentId, "edit"))) return { error: "You cannot change this record." };

  const test = text(form, "test");
  const score = text(form, "score");
  const takenAt = optionalDate(text(form, "takenAt"));
  if (test.length < 2 || test.length > 40) return { error: "Enter the test name, e.g. IELTS Academic." };
  if (score.length < 1 || score.length > 60) return { error: "Enter the score, e.g. 7.0 overall." };
  if (takenAt === undefined) return { error: "Check the date." };
  if ((await db.testScore.count({ where: { studentId } })) >= 15) return { error: "That is the most entries allowed." };

  await db.testScore.create({ data: { studentId, test, score, takenAt } });
  refresh(studentId);
  return { saved: true };
}

export async function deleteTestScore(id: string) {
  const user = await requireUser();
  const record = await db.testScore.findUnique({ where: { id }, select: { studentId: true } });
  if (!record || !(await canAccessStudent(user, record.studentId, "edit"))) return;
  await db.testScore.delete({ where: { id } });
  refresh(record.studentId);
}
