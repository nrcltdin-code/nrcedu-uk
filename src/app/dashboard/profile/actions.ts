"use server";

import { revalidatePath } from "next/cache";
import type { StudyLevel } from "@/generated/prisma/client";
import { db } from "@/lib/db";
import { canAccessStudent } from "@/lib/documents";
import { birthDateError, optionalDate, optionalNumber, text } from "@/lib/form";
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
  const grade = optionalNumber(text(form, "grade"));
  const gradeOutOf = optionalNumber(text(form, "gradeOutOf"));

  if (!(level in studyLevelLabels)) return { error: "Choose a level." };
  if (grade === undefined || gradeOutOf === undefined) return { error: "The result must be a number." };
  if (grade !== null && (!gradeOutOf || grade > gradeOutOf)) return { error: `The result cannot be more than ${gradeOutOf ?? "the scale"}.` };
  if (institution.length < 2 || institution.length > 150) return { error: "Enter the school, college or university." };
  if (fieldOfStudy.length > 100 || result.length > 60) return { error: "One of the fields is too long." };
  if (yearCompleted !== null && (!Number.isInteger(yearCompleted) || yearCompleted < 1950 || yearCompleted > 2100)) {
    return { error: "Enter the year as four digits." };
  }
  if ((await db.educationRecord.count({ where: { studentId } })) >= 15) return { error: "That is the most entries allowed." };

  await db.educationRecord.create({
    data: {
      studentId,
      level: level as StudyLevel,
      institution,
      fieldOfStudy: fieldOfStudy || null,
      result: result || null,
      grade,
      gradeOutOf: grade === null ? null : gradeOutOf,
      yearCompleted,
    },
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
  const notes = text(form, "score");
  const overall = optionalNumber(text(form, "overall"));
  const lowest = optionalNumber(text(form, "lowest"));
  const takenAt = optionalDate(text(form, "takenAt"));
  if (test.length < 2 || test.length > 40) return { error: "Choose the test." };
  if (overall === undefined || lowest === undefined || (overall !== null && overall > 9999)) return { error: "Scores must be numbers." };
  if (overall === null && !notes) return { error: "Enter the overall score." };
  if (overall !== null && lowest !== null && lowest > overall + 30) return { error: "Check the lowest section score." };
  if (test.toLowerCase().includes("ielts") && ((overall ?? 0) > 9 || (lowest ?? 0) > 9)) return { error: "IELTS scores go from 0 to 9." };
  if (notes.length > 60) return { error: "Keep the notes under 60 characters." };
  if (takenAt === undefined) return { error: "Check the date." };
  if ((await db.testScore.count({ where: { studentId } })) >= 15) return { error: "That is the most entries allowed." };

  // score stays the readable summary shown in older screens and exports.
  const score = [overall !== null ? `${overall} overall` : "", lowest !== null ? `lowest ${lowest}` : "", notes].filter(Boolean).join(", ");
  await db.testScore.create({ data: { studentId, test, score, overall, lowest, takenAt } });
  refresh(studentId);
  return { saved: true };
}

export async function setEnglishMedium(studentId: string, englishMedium: boolean) {
  const user = await requireUser();
  if (!(await canAccessStudent(user, studentId, "edit"))) return;
  await db.studentProfile.update({ where: { id: studentId }, data: { englishMedium } });
  refresh(studentId);
}

export async function deleteTestScore(id: string) {
  const user = await requireUser();
  const record = await db.testScore.findUnique({ where: { id }, select: { studentId: true } });
  if (!record || !(await canAccessStudent(user, record.studentId, "edit"))) return;
  await db.testScore.delete({ where: { id } });
  refresh(record.studentId);
}
