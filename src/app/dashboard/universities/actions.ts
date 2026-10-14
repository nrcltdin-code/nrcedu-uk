"use server";

import { updateTag } from "next/cache";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { isStudyLevel } from "@/lib/data/catalogue";
import {
  checked,
  imageError,
  isHttpsUrl,
  isInUseError,
  isSlug,
  isUniqueError,
  optionalInt,
  optionalNumber,
  slugify,
  text,
} from "@/lib/form";
import type { FormState } from "@/lib/form";
import { requirePermission } from "@/lib/session";

const base = (id: string) => `/dashboard/universities/${id}`;

// ───────────── Universities ─────────────

export async function saveUniversity(_previous: FormState, form: FormData): Promise<FormState> {
  await requirePermission("CONTENT", "edit");

  const id = text(form, "id");
  const name = text(form, "name");
  const slug = text(form, "slug") || slugify(name);
  const countryId = text(form, "countryId");
  const city = text(form, "city");
  const website = text(form, "website");
  const description = text(form, "description");
  const logoUrl = text(form, "logoUrl");
  const coverUrl = text(form, "coverUrl");
  const ranking = optionalInt(text(form, "ranking"));
  const nrcCommissionRate = optionalNumber(text(form, "nrcCommissionRate"));
  const agentCommissionRate = optionalNumber(text(form, "agentCommissionRate"));

  if (name.length < 2 || name.length > 150) return { error: "Enter the university name (2 to 150 characters)." };
  if (!isSlug(slug)) return { error: "The web address may use only lowercase letters, numbers and hyphens." };
  if (!countryId || !(await db.country.findUnique({ where: { id: countryId }, select: { id: true } }))) {
    return { error: "Choose the country." };
  }
  if (city.length > 100) return { error: "Keep the city under 100 characters." };
  if (website && !isHttpsUrl(website)) return { error: "The website must start with https://." };
  if (description.length > 10000) return { error: "Keep the description under 10,000 characters." };
  const badImage = imageError(logoUrl, "The logo address") ?? imageError(coverUrl, "The cover image address");
  if (badImage) return { error: badImage };
  if (ranking === undefined || (ranking !== null && ranking < 1)) return { error: "Ranking must be a whole number above 0." };
  for (const rate of [nrcCommissionRate, agentCommissionRate]) {
    if (rate === undefined || (rate !== null && rate > 100)) return { error: "Commission rates are percentages from 0 to 100." };
  }

  const data = {
    name,
    slug,
    countryId,
    city: city || null,
    website: website || null,
    description: description || null,
    logoUrl: logoUrl || null,
    coverUrl: coverUrl || null,
    ranking,
    nrcCommissionRate,
    agentCommissionRate,
    isOfficialPartner: checked(form, "isOfficialPartner"),
    isFeatured: checked(form, "isFeatured"),
    isPublished: checked(form, "isPublished"),
  };

  let savedId = id;
  try {
    if (id) await db.university.update({ where: { id }, data });
    else savedId = (await db.university.create({ data })).id;
  } catch (error) {
    if (isUniqueError(error)) return { error: "Another university already uses this web address." };
    throw error;
  }

  updateTag("universities");
  if (!id) redirect(base(savedId));
  return { saved: true };
}

export async function deleteUniversity(id: string) {
  await requirePermission("CONTENT", "edit");
  try {
    await db.university.delete({ where: { id } });
  } catch (error) {
    // Courses with student applications cannot be removed; hiding is the safe option.
    if (isInUseError(error)) redirect(`${base(id)}?error=in-use`);
    throw error;
  }
  updateTag("universities");
  redirect("/dashboard/universities");
}

// ───────────── Courses ─────────────

export async function saveCourse(_previous: FormState, form: FormData): Promise<FormState> {
  await requirePermission("CONTENT", "edit");

  const id = text(form, "id");
  const universityId = text(form, "universityId");
  const name = text(form, "name");
  const slug = text(form, "slug") || slugify(name);
  const subjectId = text(form, "subjectId");
  const level = text(form, "level");
  const durationMonths = optionalInt(text(form, "durationMonths"));
  const tuitionFee = optionalNumber(text(form, "tuitionFee"));
  const currency = text(form, "currency").toUpperCase() || "GBP";
  const description = text(form, "description");
  const entryRequirements = text(form, "entryRequirements");

  if (name.length < 2 || name.length > 200) return { error: "Enter the course name (2 to 200 characters)." };
  if (!isSlug(slug)) return { error: "The web address may use only lowercase letters, numbers and hyphens." };
  if (!isStudyLevel(level)) return { error: "Choose the study level." };
  if (durationMonths === undefined || (durationMonths !== null && (durationMonths < 1 || durationMonths > 120))) {
    return { error: "Duration is a number of months, from 1 to 120." };
  }
  if (tuitionFee === undefined) return { error: "Tuition fee must be a number." };
  if (!/^[A-Z]{3}$/.test(currency)) return { error: "Currency is a three-letter code such as GBP, USD or EUR." };
  if (description.length > 10000 || entryRequirements.length > 5000) return { error: "The text fields are too long." };
  if (subjectId && !(await db.subject.findUnique({ where: { id: subjectId }, select: { id: true } }))) {
    return { error: "Choose a subject from the list." };
  }

  const data = {
    name,
    slug,
    subjectId: subjectId || null,
    level,
    durationMonths,
    tuitionFee,
    currency,
    description: description || null,
    entryRequirements: entryRequirements || null,
    isPublished: checked(form, "isPublished"),
  };

  try {
    if (id) await db.course.update({ where: { id, universityId }, data });
    else await db.course.create({ data: { ...data, universityId } });
  } catch (error) {
    if (isUniqueError(error)) return { error: "Another course at this university already uses this web address." };
    throw error;
  }

  updateTag("universities");
  updateTag("subjects");
  redirect(`${base(universityId)}#courses`);
}

export async function deleteCourse(universityId: string, id: string) {
  await requirePermission("CONTENT", "edit");
  try {
    await db.course.delete({ where: { id, universityId } });
  } catch (error) {
    if (isInUseError(error)) redirect(`${base(universityId)}?error=course-in-use#courses`);
    throw error;
  }
  updateTag("universities");
  updateTag("subjects");
  redirect(`${base(universityId)}#courses`);
}

// ───────────── Intakes ─────────────

const parseDate = (value: string) => {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
  const date = new Date(`${value}T00:00:00Z`);
  return Number.isNaN(date.getTime()) ? null : date;
};

export async function addIntake(_previous: FormState, form: FormData): Promise<FormState> {
  await requirePermission("CONTENT", "edit");

  const universityId = text(form, "universityId");
  const courseId = text(form, "courseId");
  const name = text(form, "name");
  const startDate = parseDate(text(form, "startDate"));
  const deadlineText = text(form, "applicationDeadline");
  const applicationDeadline = deadlineText ? parseDate(deadlineText) : null;

  if (name.length < 2 || name.length > 60) return { error: "Name the intake, for example September 2027." };
  if (!startDate) return { error: "Choose the start date." };
  if (deadlineText && !applicationDeadline) return { error: "The deadline is not a valid date." };
  if (applicationDeadline && applicationDeadline > startDate) return { error: "The deadline must be before the start date." };
  if (courseId && !(await db.course.findFirst({ where: { id: courseId, universityId }, select: { id: true } }))) {
    return { error: "Choose a course from this university." };
  }

  await db.intake.create({
    data: { universityId, courseId: courseId || null, name, startDate, applicationDeadline },
  });
  updateTag("universities");
  redirect(`${base(universityId)}#intakes`);
}

export async function setIntakeOpen(universityId: string, id: string, isOpen: boolean) {
  await requirePermission("CONTENT", "edit");
  await db.intake.update({ where: { id, universityId }, data: { isOpen } });
  updateTag("universities");
  redirect(`${base(universityId)}#intakes`);
}

// Applications linked to the intake keep existing; they just lose the intake.
export async function deleteIntake(universityId: string, id: string) {
  await requirePermission("CONTENT", "edit");
  await db.intake.delete({ where: { id, universityId } });
  updateTag("universities");
  redirect(`${base(universityId)}#intakes`);
}
