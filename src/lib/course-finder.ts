import "server-only";
import type { Prisma, StudyLevel } from "@/generated/prisma/client";
import { db } from "@/lib/db";
import { matchStudent, resolveRequirements } from "@/lib/course-match";
import type { Check, MatchStatus, RequirementFields, StudentFacts } from "@/lib/course-match";

export type FinderFilters = {
  countryId?: string;
  level?: StudyLevel;
  subjectId?: string;
  maxFee?: number;
  q?: string;
  // Only these courses (the multi-apply screen).
  ids?: string[];
};

export type FinderResult = {
  id: string;
  name: string;
  level: StudyLevel;
  tuitionFee: string | null;
  currency: string;
  university: { id: string; name: string; slug: string; country: string };
  slug: string;
  status: MatchStatus;
  checks: Check[];
};

const num = (value: Prisma.Decimal | null) => (value === null ? null : Number(value));

const requirementSelect = {
  minGradePercent: true,
  minIelts: true,
  minIeltsBand: true,
  maxStudyGapYears: true,
  acceptsMoi: true,
} as const;

type RawRequirements = {
  minGradePercent: Prisma.Decimal | null;
  minIelts: Prisma.Decimal | null;
  minIeltsBand: Prisma.Decimal | null;
  maxStudyGapYears: number | null;
  acceptsMoi: boolean | null;
};

const toFields = (r: RawRequirements & { requiredLevel?: StudyLevel | null }): RequirementFields => ({
  requiredLevel: r.requiredLevel ?? null,
  minGradePercent: num(r.minGradePercent),
  minIelts: num(r.minIelts),
  minIeltsBand: num(r.minIeltsBand),
  maxStudyGapYears: r.maxStudyGapYears,
  acceptsMoi: r.acceptsMoi,
});

export async function getStudentFacts(studentId: string): Promise<StudentFacts | null> {
  const student = await db.studentProfile.findUnique({
    where: { id: studentId },
    select: {
      englishMedium: true,
      educationRecords: { select: { level: true, grade: true, gradeOutOf: true, yearCompleted: true } },
      testScores: { select: { test: true, overall: true, lowest: true } },
    },
  });
  if (!student) return null;
  return {
    englishMedium: student.englishMedium,
    education: student.educationRecords.map((e) => ({ ...e, grade: num(e.grade), gradeOutOf: num(e.gradeOutOf) })),
    scores: student.testScores.map((s) => ({ test: s.test, overall: num(s.overall), lowest: num(s.lowest) })),
  };
}

const statusOrder: Record<MatchStatus, number> = { ELIGIBLE: 0, CONDITIONAL: 1, NOT_ELIGIBLE: 2 };

// Every course matching the filters, checked against the student and sorted best first.
// publishedOnly hides courses not on the website (students only see those).
export async function findCourses(facts: StudentFacts, filters: FinderFilters, publishedOnly: boolean): Promise<FinderResult[]> {
  const courses = await db.course.findMany({
    where: {
      id: filters.ids ? { in: filters.ids } : undefined,
      level: filters.level ?? { not: "SCHOOL" },
      subjectId: filters.subjectId || undefined,
      tuitionFee: filters.maxFee ? { lte: filters.maxFee } : undefined,
      name: filters.q ? { contains: filters.q, mode: "insensitive" } : undefined,
      ...(publishedOnly && { isPublished: true }),
      university: {
        countryId: filters.countryId || undefined,
        ...(publishedOnly && { isPublished: true }),
      },
    },
    take: 500,
    orderBy: [{ university: { ranking: { sort: "asc", nulls: "last" } } }, { name: "asc" }],
    select: {
      id: true,
      name: true,
      slug: true,
      level: true,
      tuitionFee: true,
      currency: true,
      requiredLevel: true,
      ...requirementSelect,
      university: { select: { id: true, name: true, slug: true, country: { select: { name: true } }, ...requirementSelect } },
    },
  });

  return courses
    .map((course) => {
      const req = resolveRequirements(course.level, toFields(course), toFields(course.university));
      const { status, checks } = matchStudent(facts, req);
      return {
        id: course.id,
        name: course.name,
        slug: course.slug,
        level: course.level,
        tuitionFee: course.tuitionFee?.toString() ?? null,
        currency: course.currency,
        university: { id: course.university.id, name: course.university.name, slug: course.university.slug, country: course.university.country.name },
        status,
        checks,
      };
    })
    .sort((a, b) => statusOrder[a.status] - statusOrder[b.status]);
}
