import type { StudyLevel } from "@/generated/prisma/client";

// Course finder: compares a student's education and test scores with a course's entry
// requirements. Each requirement comes from the course, else its university, else the
// level default below. Missing student data never rules a course out; it makes the
// result "conditional" so staff know what to ask for.

export type MatchStatus = "ELIGIBLE" | "CONDITIONAL" | "NOT_ELIGIBLE";

export type Check = { label: string; status: MatchStatus; detail: string };

export type Requirements = {
  requiredLevel: StudyLevel | null;
  minGradePercent: number | null;
  minIelts: number | null;
  minIeltsBand: number | null;
  maxStudyGapYears: number | null;
  acceptsMoi: boolean;
};

// Plain numbers only, so callers convert Prisma Decimals first.
export type RequirementFields = {
  requiredLevel?: StudyLevel | null;
  minGradePercent: number | null;
  minIelts: number | null;
  minIeltsBand: number | null;
  maxStudyGapYears: number | null;
  acceptsMoi: boolean | null;
};

export type StudentFacts = {
  education: { level: StudyLevel; grade: number | null; gradeOutOf: number | null; yearCompleted: number | null }[];
  scores: { test: string; overall: number | null; lowest: number | null }[];
  englishMedium: boolean;
};

// Order of qualifications, lowest first. OTHER is treated as unknown.
const levelRank: Partial<Record<StudyLevel, number>> = {
  SCHOOL: 1,
  FOUNDATION: 2,
  DIPLOMA: 3,
  UNDERGRADUATE: 4,
  POSTGRADUATE: 5,
  PHD: 6,
};

// Sensible defaults when neither the course nor the university says anything.
const levelDefaults: Record<StudyLevel, Requirements> = {
  SCHOOL: { requiredLevel: null, minGradePercent: null, minIelts: null, minIeltsBand: null, maxStudyGapYears: null, acceptsMoi: false },
  FOUNDATION: { requiredLevel: "SCHOOL", minGradePercent: null, minIelts: 5.0, minIeltsBand: 4.5, maxStudyGapYears: 5, acceptsMoi: false },
  DIPLOMA: { requiredLevel: "SCHOOL", minGradePercent: null, minIelts: 5.5, minIeltsBand: 5.0, maxStudyGapYears: 5, acceptsMoi: false },
  UNDERGRADUATE: { requiredLevel: "SCHOOL", minGradePercent: null, minIelts: 6.0, minIeltsBand: 5.5, maxStudyGapYears: 5, acceptsMoi: false },
  POSTGRADUATE: { requiredLevel: "UNDERGRADUATE", minGradePercent: null, minIelts: 6.5, minIeltsBand: 6.0, maxStudyGapYears: 10, acceptsMoi: false },
  PHD: { requiredLevel: "POSTGRADUATE", minGradePercent: null, minIelts: 6.5, minIeltsBand: 6.0, maxStudyGapYears: null, acceptsMoi: false },
  OTHER: { requiredLevel: null, minGradePercent: null, minIelts: null, minIeltsBand: null, maxStudyGapYears: null, acceptsMoi: false },
};

export function resolveRequirements(level: StudyLevel, course: RequirementFields, university: RequirementFields): Requirements {
  const fallback = levelDefaults[level];
  const pick = <K extends keyof Requirements>(key: K) =>
    ((course as Partial<Requirements>)[key] ?? (university as Partial<Requirements>)[key] ?? fallback[key]) as Requirements[K];
  return {
    requiredLevel: course.requiredLevel ?? fallback.requiredLevel,
    minGradePercent: pick("minGradePercent"),
    minIelts: pick("minIelts"),
    minIeltsBand: pick("minIeltsBand"),
    maxStudyGapYears: pick("maxStudyGapYears"),
    acceptsMoi: pick("acceptsMoi") ?? false,
  };
}

// English tests the finder understands, each converted to an IELTS-like score.
// Conversions are approximate and follow commonly published concordance tables.
export const englishTests = ["IELTS Academic", "IELTS UKVI", "PTE Academic", "TOEFL iBT", "Duolingo"] as const;

const ptePoints: [number, number][] = [[30, 4.5], [36, 5.0], [42, 5.5], [50, 6.0], [58, 6.5], [65, 7.0], [73, 7.5], [79, 8.0], [84, 8.5]];
const toeflPoints: [number, number][] = [[32, 4.5], [35, 5.0], [46, 5.5], [60, 6.0], [79, 6.5], [94, 7.0], [102, 7.5], [110, 8.0], [115, 8.5]];
const duolingoPoints: [number, number][] = [[75, 4.5], [85, 5.0], [95, 5.5], [105, 6.0], [115, 6.5], [125, 7.0], [135, 7.5], [145, 8.0]];

const fromTable = (table: [number, number][], value: number) => {
  let result = 0;
  for (const [min, ielts] of table) if (value >= min) result = ielts;
  return result || null;
};

export function toIelts(test: string, value: number | null): number | null {
  if (value === null) return null;
  const name = test.toLowerCase();
  if (name.includes("ielts")) return value;
  if (name.includes("pte")) return fromTable(ptePoints, value);
  if (name.includes("toefl")) return fromTable(toeflPoints, value);
  if (name.includes("duolingo")) return fromTable(duolingoPoints, value);
  return null;
}

// TOEFL sections are scored 0–30, so they need their own scale.
const toeflSection: [number, number][] = [[8, 4.5], [12, 5.0], [15, 5.5], [18, 6.0], [20, 6.5], [22, 7.0], [24, 7.5], [27, 8.0]];
function lowestToIelts(test: string, value: number | null) {
  if (value === null) return null;
  return test.toLowerCase().includes("toefl") ? fromTable(toeflSection, value) : toIelts(test, value);
}

const worst = (a: MatchStatus, b: MatchStatus): MatchStatus =>
  a === "NOT_ELIGIBLE" || b === "NOT_ELIGIBLE" ? "NOT_ELIGIBLE" : a === "CONDITIONAL" || b === "CONDITIONAL" ? "CONDITIONAL" : "ELIGIBLE";

const percent = (grade: number | null, outOf: number | null) => (grade !== null && outOf ? (grade / outOf) * 100 : null);

export function matchStudent(facts: StudentFacts, req: Requirements, now = new Date()): { status: MatchStatus; checks: Check[] } {
  const checks: Check[] = [];

  // 1. Previous qualification
  const ranked = facts.education.filter((e) => levelRank[e.level] !== undefined);
  const highest = ranked.reduce<number>((max, e) => Math.max(max, levelRank[e.level]!), 0);
  const needRank = req.requiredLevel ? levelRank[req.requiredLevel] ?? 0 : 0;
  if (needRank) {
    if (ranked.length === 0) checks.push({ label: "Qualification", status: "CONDITIONAL", detail: "No education added yet." });
    else if (highest >= needRank) checks.push({ label: "Qualification", status: "ELIGIBLE", detail: "Has the qualification needed." });
    else checks.push({ label: "Qualification", status: "NOT_ELIGIBLE", detail: "Needs a higher previous qualification." });
  }

  // 2. Grade, from the best result at the required level (or above)
  if (req.minGradePercent !== null) {
    const grades = ranked
      .filter((e) => (levelRank[e.level] ?? 0) >= needRank)
      .map((e) => percent(e.grade, e.gradeOutOf))
      .filter((p): p is number => p !== null);
    const best = grades.length ? Math.max(...grades) : null;
    if (best === null) checks.push({ label: "Grades", status: "CONDITIONAL", detail: `Needs ${req.minGradePercent}%; no grade recorded.` });
    else if (best >= req.minGradePercent) checks.push({ label: "Grades", status: "ELIGIBLE", detail: `${Math.round(best)}% meets ${req.minGradePercent}%.` });
    else if (best >= req.minGradePercent - 5) checks.push({ label: "Grades", status: "CONDITIONAL", detail: `${Math.round(best)}% is just under ${req.minGradePercent}%; ask the university.` });
    else checks.push({ label: "Grades", status: "NOT_ELIGIBLE", detail: `${Math.round(best)}% is below ${req.minGradePercent}%.` });
  }

  // 3. English, from the best IELTS-equivalent score
  if (req.minIelts !== null) {
    const english = facts.scores
      .map((s) => ({ overall: toIelts(s.test, s.overall), lowest: lowestToIelts(s.test, s.lowest) }))
      .filter((s) => s.overall !== null)
      .sort((a, b) => b.overall! - a.overall!)[0];
    if (!english) {
      if (facts.englishMedium && req.acceptsMoi) checks.push({ label: "English", status: "ELIGIBLE", detail: "Studied in English; this course accepts an MOI letter." });
      else checks.push({ label: "English", status: "CONDITIONAL", detail: `Needs IELTS ${req.minIelts} or equivalent; no score recorded.` });
    } else {
      const overall = english.overall!;
      const bandShort = req.minIeltsBand !== null && english.lowest !== null && english.lowest < req.minIeltsBand;
      if (overall >= req.minIelts && !bandShort) checks.push({ label: "English", status: "ELIGIBLE", detail: `IELTS ${overall} equivalent meets ${req.minIelts}.` });
      else if (overall >= req.minIelts - 1) {
        checks.push({ label: "English", status: "CONDITIONAL", detail: `IELTS ${overall} equivalent${bandShort ? ` (lowest band ${english.lowest})` : ""}; needs ${req.minIelts}${req.minIeltsBand ? `, no band below ${req.minIeltsBand}` : ""}. A pre-sessional course or retake may cover it.` });
      } else checks.push({ label: "English", status: "NOT_ELIGIBLE", detail: `IELTS ${overall} equivalent is well below ${req.minIelts}.` });
    }
  }

  // 4. Study gap since the last qualification
  if (req.maxStudyGapYears !== null) {
    const last = Math.max(0, ...facts.education.map((e) => e.yearCompleted ?? 0));
    if (last) {
      const gap = now.getFullYear() - last;
      if (gap > req.maxStudyGapYears) checks.push({ label: "Study gap", status: "CONDITIONAL", detail: `${gap} year gap (limit ${req.maxStudyGapYears}); needs a gap explanation.` });
      else checks.push({ label: "Study gap", status: "ELIGIBLE", detail: `${gap} year gap is fine.` });
    }
  }

  const status = checks.reduce<MatchStatus>((s, c) => worst(s, c.status), "ELIGIBLE");
  return { status, checks };
}

// Records shaped for the education and scores component (Decimals become strings).
type DecimalLike = { toString(): string } | null;
const str = (value: DecimalLike) => (value === null ? null : value.toString());

export const educationView = <T extends { grade: DecimalLike; gradeOutOf: DecimalLike }>(records: T[]) =>
  records.map((r) => ({ ...r, grade: str(r.grade), gradeOutOf: str(r.gradeOutOf) }));

export const scoreView = (records: { id: string; test: string; score: string; overall: DecimalLike; lowest: DecimalLike; takenAt: Date | null }[]) =>
  records.map((s) => ({ id: s.id, test: s.test, score: s.score, overall: str(s.overall), lowest: str(s.lowest), takenAt: s.takenAt ? s.takenAt.toISOString().slice(0, 10) : null }));
