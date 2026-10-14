import "server-only";
import { cacheLife, cacheTag } from "next/cache";
import { db } from "@/lib/db";
import type { Prisma, StudyLevel } from "@/generated/prisma/client";

// Public reads for universities, courses, subjects and destinations. Cached and tagged like
// lib/data/home.ts. Never select commission rates or other internal columns here.

export const PAGE_SIZE = 9;

export const levelNames: Record<StudyLevel, string> = {
  FOUNDATION: "Foundation",
  DIPLOMA: "Diploma",
  UNDERGRADUATE: "Undergraduate",
  POSTGRADUATE: "Postgraduate",
  PHD: "PhD",
  OTHER: "Other",
};

export const isStudyLevel = (value: string): value is StudyLevel => value in levelNames;

export const universityCard = {
  id: true,
  name: true,
  slug: true,
  city: true,
  coverUrl: true,
  logoUrl: true,
  ranking: true,
  isOfficialPartner: true,
  country: { select: { name: true, slug: true } },
  _count: { select: { courses: { where: { isPublished: true } } } },
} satisfies Prisma.UniversitySelect;

export type UniversityCardData = Prisma.UniversityGetPayload<{ select: typeof universityCard }>;

export type UniversityFilters = {
  q?: string;
  country?: string;
  subject?: string;
  level?: StudyLevel;
  page?: number;
};

export async function searchUniversities({ q, country, subject, level, page = 1 }: UniversityFilters) {
  "use cache";
  cacheTag("universities");
  cacheLife("hours");

  const courseFilter: Prisma.CourseWhereInput = {
    isPublished: true,
    ...(level && { level }),
    ...(subject && { subject: { slug: subject } }),
  };

  const where: Prisma.UniversityWhereInput = {
    isPublished: true,
    ...(q && {
      OR: [
        { name: { contains: q, mode: "insensitive" } },
        { city: { contains: q, mode: "insensitive" } },
        { courses: { some: { isPublished: true, name: { contains: q, mode: "insensitive" } } } },
      ],
    }),
    ...(country && { country: { slug: country } }),
    ...((level || subject) && { courses: { some: courseFilter } }),
  };

  const [total, universities] = await Promise.all([
    db.university.count({ where }),
    db.university.findMany({
      where,
      orderBy: [{ isOfficialPartner: "desc" }, { ranking: "asc" }, { name: "asc" }],
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
      select: universityCard,
    }),
  ]);

  return { total, pages: Math.max(1, Math.ceil(total / PAGE_SIZE)), universities };
}

export async function getFilterOptions() {
  "use cache";
  cacheTag("universities", "countries", "subjects");
  cacheLife("hours");

  const [countries, subjects] = await Promise.all([
    db.country.findMany({
      where: { universities: { some: { isPublished: true } } },
      orderBy: { name: "asc" },
      select: { name: true, slug: true },
    }),
    db.subject.findMany({
      where: { courses: { some: { isPublished: true } } },
      orderBy: { name: "asc" },
      select: { name: true, slug: true },
    }),
  ]);
  return { countries, subjects };
}

// Prisma returns money as a Decimal object, which cannot be cached or sent to the browser.
const toNumber = (value: Prisma.Decimal | null) => (value === null ? null : value.toNumber());

export async function getUniversity(slug: string) {
  "use cache";
  cacheTag("universities");
  cacheLife("hours");

  const university = await db.university.findFirst({
    where: { slug, isPublished: true },
    select: {
      id: true,
      name: true,
      slug: true,
      city: true,
      coverUrl: true,
      logoUrl: true,
      description: true,
      website: true,
      ranking: true,
      isOfficialPartner: true,
      country: { select: { name: true, slug: true } },
      courses: {
        where: { isPublished: true },
        orderBy: [{ level: "asc" }, { name: "asc" }],
        select: {
          id: true,
          name: true,
          slug: true,
          level: true,
          durationMonths: true,
          tuitionFee: true,
          currency: true,
          subject: { select: { name: true, slug: true } },
        },
      },
      intakes: {
        where: { isOpen: true, courseId: null },
        orderBy: { startDate: "asc" },
        select: { id: true, name: true, startDate: true, applicationDeadline: true },
      },
    },
  });
  if (!university) return null;

  return {
    ...university,
    courses: university.courses.map((course) => ({ ...course, tuitionFee: toNumber(course.tuitionFee) })),
  };
}

export async function getCourse(universitySlug: string, courseSlug: string) {
  "use cache";
  cacheTag("universities");
  cacheLife("hours");

  const course = await db.course.findFirst({
    where: { slug: courseSlug, isPublished: true, university: { slug: universitySlug, isPublished: true } },
    select: {
      id: true,
      name: true,
      slug: true,
      level: true,
      durationMonths: true,
      tuitionFee: true,
      currency: true,
      description: true,
      entryRequirements: true,
      subject: { select: { name: true, slug: true } },
      university: {
        select: {
          id: true,
          name: true,
          slug: true,
          city: true,
          coverUrl: true,
          isOfficialPartner: true,
          country: { select: { name: true, slug: true } },
        },
      },
    },
  });
  if (!course) return null;

  // Intakes set for this course, plus the university-wide ones.
  const intakes = await db.intake.findMany({
    where: { isOpen: true, universityId: course.university.id, OR: [{ courseId: course.id }, { courseId: null }] },
    orderBy: { startDate: "asc" },
    select: { id: true, name: true, startDate: true, applicationDeadline: true },
  });

  return { ...course, tuitionFee: toNumber(course.tuitionFee), intakes };
}

export async function getUniversitySlugs() {
  "use cache";
  cacheTag("universities");
  cacheLife("hours");

  return db.university.findMany({
    where: { isPublished: true },
    select: { slug: true, courses: { where: { isPublished: true }, select: { slug: true } } },
  });
}

export async function getDestination(slug: string) {
  "use cache";
  cacheTag("countries", "universities");
  cacheLife("hours");

  return db.country.findFirst({
    where: { slug, isDestination: true },
    select: {
      id: true,
      name: true,
      slug: true,
      description: true,
      imageUrl: true,
      universities: {
        where: { isPublished: true },
        orderBy: [{ isOfficialPartner: "desc" }, { ranking: "asc" }, { name: "asc" }],
        select: universityCard,
      },
    },
  });
}

export async function getSubjects() {
  "use cache";
  cacheTag("subjects", "universities");
  cacheLife("hours");

  return db.subject.findMany({
    orderBy: { name: "asc" },
    select: {
      id: true,
      name: true,
      slug: true,
      description: true,
      _count: { select: { courses: { where: { isPublished: true, university: { isPublished: true } } } } },
    },
  });
}

export async function getSubject(slug: string) {
  "use cache";
  cacheTag("subjects", "universities");
  cacheLife("hours");

  const subject = await db.subject.findUnique({
    where: { slug },
    select: {
      id: true,
      name: true,
      slug: true,
      description: true,
      courses: {
        where: { isPublished: true, university: { isPublished: true } },
        orderBy: [{ level: "asc" }, { name: "asc" }],
        select: {
          id: true,
          name: true,
          slug: true,
          level: true,
          durationMonths: true,
          tuitionFee: true,
          currency: true,
          university: { select: { name: true, slug: true, city: true, country: { select: { name: true } } } },
        },
      },
    },
  });
  if (!subject) return null;

  return {
    ...subject,
    courses: subject.courses.map((course) => ({ ...course, tuitionFee: toNumber(course.tuitionFee) })),
  };
}
