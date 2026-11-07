import "server-only";
import { cacheLife, cacheTag } from "next/cache";
import { db } from "@/lib/db";
import type { Prisma, StudyLevel } from "@/generated/prisma/client";

// Public reads for universities, courses, subjects and destinations. Cached and tagged like
// lib/data/home.ts. Never select commission rates or other internal columns here.

export const PAGE_SIZE = 9;

export const levelNames: Record<StudyLevel, string> = {
  SCHOOL: "School",
  FOUNDATION: "Foundation",
  DIPLOMA: "Diploma",
  UNDERGRADUATE: "Undergraduate",
  POSTGRADUATE: "Postgraduate",
  PHD: "PhD",
  OTHER: "Other",
};

// Course levels only: SCHOOL describes a student's past education, never a course.
export const isStudyLevel = (value: string): value is StudyLevel => value in levelNames && value !== "SCHOOL";
export const courseLevelNames = Object.entries(levelNames).filter(([value]) => value !== "SCHOOL");

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
      orderBy: [{ sortOrder: { sort: "asc", nulls: "last" } }, { isOfficialPartner: "desc" }, { ranking: "asc" }, { name: "asc" }],
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
      minGradePercent: true, minIelts: true, minIeltsBand: true, maxStudyGapYears: true, acceptsMoi: true,
      subjectId: true,
      subject: { select: { name: true, slug: true } },
      university: {
        select: {
          minGradePercent: true, minIelts: true, minIeltsBand: true, maxStudyGapYears: true, acceptsMoi: true,
          requirements: { orderBy: [{ sortOrder: "asc" }, { label: "asc" }], select: { label: true } },
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

  // Links to other pages: more courses here (same subject first) and this subject elsewhere.
  const related = { id: true, name: true, slug: true, level: true, university: { select: { name: true, slug: true } } } as const;
  const [moreHere, elsewhere] = await Promise.all([
    db.course.findMany({
      where: { isPublished: true, universityId: course.university.id, id: { not: course.id } },
      orderBy: [{ name: "asc" }],
      select: { ...related, subjectId: true },
      take: 40,
    }),
    course.subjectId
      ? db.course.findMany({
          where: { isPublished: true, subjectId: course.subjectId, level: course.level, universityId: { not: course.university.id }, university: { isPublished: true } },
          orderBy: [{ university: { sortOrder: { sort: "asc", nulls: "last" } } }, { university: { ranking: { sort: "asc", nulls: "last" } } }, { name: "asc" }],
          select: related,
          take: 6,
        })
      : [],
  ]);
  const sameSubjectFirst = [...moreHere].sort((a, b) => Number(b.subjectId === course.subjectId) - Number(a.subjectId === course.subjectId)).slice(0, 6);

  const num = (v: unknown) => (v == null ? null : Number(v));
  const u = course.university;
  const entry = {
    minGradePercent: num(course.minGradePercent ?? u.minGradePercent),
    minIelts: num(course.minIelts ?? u.minIelts),
    minIeltsBand: num(course.minIeltsBand ?? u.minIeltsBand),
    maxStudyGapYears: course.maxStudyGapYears ?? u.maxStudyGapYears,
    acceptsMoi: course.acceptsMoi ?? u.acceptsMoi,
    documents: u.requirements.map((r) => r.label),
  };

  // Decimal values cannot be cached, so only plain values leave this function.
  return {
    id: course.id,
    name: course.name,
    slug: course.slug,
    level: course.level,
    durationMonths: course.durationMonths,
    tuitionFee: toNumber(course.tuitionFee),
    currency: course.currency,
    description: course.description,
    entryRequirements: course.entryRequirements,
    subject: course.subject,
    university: { id: u.id, name: u.name, slug: u.slug, city: u.city, coverUrl: u.coverUrl, isOfficialPartner: u.isOfficialPartner, country: u.country },
    intakes,
    entry,
    moreHere: sameSubjectFirst.map((c) => ({ id: c.id, name: c.name, slug: c.slug, level: c.level, university: c.university })),
    elsewhere,
  };
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
      tagline: true,
      content: true,
      imageUrl: true,
      flagUrl: true,
      universities: {
        where: { isPublished: true },
        orderBy: [{ sortOrder: { sort: "asc", nulls: "last" } }, { isOfficialPartner: "desc" }, { ranking: "asc" }, { name: "asc" }],
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
