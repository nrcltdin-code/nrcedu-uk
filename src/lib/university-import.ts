import "server-only";

import type { DocumentType, Prisma, StudyLevel } from "@/generated/prisma/client";
import { db } from "@/lib/db";
import { isStudyLevel } from "@/lib/data/catalogue";
import { documentTypeLabels } from "@/lib/documents";
import { isHttpsUrl, slugify } from "@/lib/form";

// Bulk import of countries, universities, subjects and courses from one CSV.
// One row per course. Rows with no course name add or update just the university.
// Countries and subjects that do not exist yet are created. New universities start
// unpublished so someone can check them first; existing ones are only filled in,
// never unpublished, and empty cells never wipe saved values.

export const importColumns = [
  "country", "university", "city", "website", "ranking", "description",
  "min_grade_percent", "university_min_ielts", "min_ielts_band", "max_study_gap_years", "accepts_moi",
  "documents", "intakes", "process_notes",
  "subject", "course", "level", "duration_months", "tuition_fee", "currency", "min_ielts",
] as const;

const months = ["jan", "feb", "mar", "apr", "may", "jun", "jul", "aug", "sep", "oct", "nov", "dec"];
const documentTypeByLabel = new Map(
  (Object.entries(documentTypeLabels) as [DocumentType, string][]).flatMap(([type, label]) => [[label.toLowerCase(), type], [type.toLowerCase(), type]]),
);
documentTypeByLabel.set("passport copy", "PASSPORT").set("ielts", "ENGLISH_TEST").set("references", "RECOMMENDATION_LETTER").set("reference letter", "RECOMMENDATION_LETTER").set("personal statement", "SOP").set("bank statement", "FINANCIAL").set("transcripts", "TRANSCRIPT").set("certificates", "CERTIFICATE");

// RFC 4180 CSV: quoted cells, doubled quotes, commas and line breaks inside quotes.
export function parseCsv(input: string): string[][] {
  const text = input.replace(/^﻿/, "");
  const rows: string[][] = [];
  let row: string[] = [];
  let cell = "";
  let quoted = false;
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (quoted) {
      if (ch === '"' && text[i + 1] === '"') { cell += '"'; i++; }
      else if (ch === '"') quoted = false;
      else cell += ch;
    } else if (ch === '"') quoted = true;
    else if (ch === ",") { row.push(cell); cell = ""; }
    else if (ch === "\n" || ch === "\r") {
      if (ch === "\r" && text[i + 1] === "\n") i++;
      row.push(cell); rows.push(row); row = []; cell = "";
    } else cell += ch;
  }
  if (cell || row.length) { row.push(cell); rows.push(row); }
  return rows.filter((r) => r.some((c) => c.trim()));
}

const levelAliases: Record<string, StudyLevel> = {
  ug: "UNDERGRADUATE", bachelor: "UNDERGRADUATE", bachelors: "UNDERGRADUATE", undergraduate: "UNDERGRADUATE",
  pg: "POSTGRADUATE", master: "POSTGRADUATE", masters: "POSTGRADUATE", postgraduate: "POSTGRADUATE",
  phd: "PHD", doctorate: "PHD", foundation: "FOUNDATION", diploma: "DIPLOMA", other: "OTHER",
};

function toLevel(value: string): StudyLevel | null {
  const key = value.trim().toLowerCase();
  if (levelAliases[key]) return levelAliases[key];
  const upper = value.trim().toUpperCase();
  return isStudyLevel(upper) ? upper : null;
}

const num = (value: string) => {
  if (!value) return null;
  const n = Number(value.replace(/[,£$€\s]/g, ""));
  return Number.isFinite(n) && n >= 0 ? n : undefined;
};

export type ImportResult = {
  error?: string;
  countries?: number;
  universities?: { created: number; updated: number };
  subjects?: number;
  documents?: number;
  intakes?: number;
  courses?: { created: number; updated: number };
  problems?: string[];
};

export async function importUniversities(csv: string): Promise<ImportResult> {
  const rows = parseCsv(csv);
  if (rows.length < 2) return { error: "The file has no rows below the header." };

  const header = rows[0].map((h) => h.trim().toLowerCase().replace(/\s+/g, "_"));
  const col = (name: string) => header.indexOf(name);
  if (col("country") < 0 || col("university") < 0) {
    return { error: "The header row needs at least the columns country and university. Use the template." };
  }
  const get = (row: string[], name: string) => (col(name) >= 0 ? (row[col(name)] ?? "").trim() : "");

  const problems: string[] = [];
  const result: { documents?: number; intakes?: number; countries: number; universities: { created: number; updated: number }; subjects: number; courses: { created: number; updated: number } } = { countries: 0, universities: { created: 0, updated: 0 }, subjects: 0, courses: { created: 0, updated: 0 } };
  const countryIds = new Map<string, string>();
  const subjectIds = new Map<string, string>();
  const universityIds = new Map<string, string>();
  // Load what already exists once, so each row needs at most one write.
  const [allCountries, allSubjects, allUniversities, allCourses] = await Promise.all([
    db.country.findMany({ select: { id: true, name: true } }),
    db.subject.findMany({ select: { id: true, name: true } }),
    db.university.findMany({ select: { id: true, slug: true } }),
    db.course.findMany({ select: { id: true, universityId: true, slug: true } }),
  ]);
  const knownCountries = new Map(allCountries.map((c) => [c.name.toLowerCase(), c.id]));
  const knownSubjects = new Map(allSubjects.map((s) => [s.name.toLowerCase(), s.id]));
  const knownUniversities = new Map(allUniversities.map((u) => [u.slug, u.id]));
  const knownCourses = new Map(allCourses.map((c) => [`${c.universityId}|${c.slug}`, c.id]));
  // New courses are saved together at the end, in one query per 500.
  const newCourses: Prisma.CourseCreateManyInput[] = [];
  const queuedCourses = new Set<string>();
  const [allRequirements, allIntakes] = await Promise.all([
    db.universityRequirement.findMany({ select: { universityId: true, type: true, label: true } }),
    db.intake.findMany({ where: { courseId: null }, select: { universityId: true, name: true } }),
  ]);
  const knownRequirements = new Set(allRequirements.flatMap((q) => [`${q.universityId}|${q.type}|${q.label.toLowerCase()}`, `${q.universityId}|${q.type}`]));
  const knownIntakes = new Set(allIntakes.map((i) => `${i.universityId}|${i.name.toLowerCase()}`));
  const newRequirements: Prisma.UniversityRequirementCreateManyInput[] = [];
  const newIntakes: Prisma.IntakeCreateManyInput[] = [];

  for (let r = 1; r < rows.length; r++) {
    const row = rows[r];
    const line = r + 1;
    const countryName = get(row, "country");
    const uniName = get(row, "university");
    if (!countryName || !uniName) { problems.push(`Row ${line}: country and university are required.`); continue; }

    // Country
    let countryId = countryIds.get(countryName.toLowerCase());
    if (!countryId) {
      const existing = knownCountries.get(countryName.toLowerCase());
      if (existing) countryId = existing;
      else {
        countryId = (await db.country.create({ data: { name: countryName, slug: slugify(countryName), isDestination: true } })).id;
        result.countries++;
      }
      countryIds.set(countryName.toLowerCase(), countryId);
    }

    // University: matched by its web address (slug), filled in once per file.
    const uniSlug = slugify(uniName);
    let universityId = universityIds.get(uniSlug);
    if (!universityId) {
      const website = get(row, "website");
      const ranking = num(get(row, "ranking"));
      if (website && !isHttpsUrl(website)) problems.push(`Row ${line}: website must start with https:// (skipped the website).`);
      if (ranking === undefined) problems.push(`Row ${line}: ranking is not a number (skipped the ranking).`);
      // University-wide entry requirement defaults (a course's own value wins).
      const grade = num(get(row, "min_grade_percent"));
      const uniIelts = num(get(row, "university_min_ielts"));
      const band = num(get(row, "min_ielts_band"));
      const gap = num(get(row, "max_study_gap_years"));
      const moi = get(row, "accepts_moi").toLowerCase();
      if (grade === undefined || (grade !== null && grade > 100)) problems.push(`Row ${line}: min_grade_percent must be 0 to 100 (skipped).`);
      for (const [label, v] of [["university_min_ielts", uniIelts], ["min_ielts_band", band]] as const) {
        if (v === undefined || (v !== null && v > 9)) problems.push(`Row ${line}: ${label} must be 0 to 9 (skipped).`);
      }
      if (gap === undefined) problems.push(`Row ${line}: max_study_gap_years is not a number (skipped).`);
      const fields = {
        city: get(row, "city") || undefined,
        website: website && isHttpsUrl(website) ? website : undefined,
        ranking: ranking ? Math.round(ranking) : undefined,
        description: get(row, "description") || undefined,
        minGradePercent: grade !== null && grade !== undefined && grade <= 100 ? grade : undefined,
        minIelts: uniIelts !== null && uniIelts !== undefined && uniIelts <= 9 ? uniIelts : undefined,
        minIeltsBand: band !== null && band !== undefined && band <= 9 ? band : undefined,
        maxStudyGapYears: gap !== null && gap !== undefined ? Math.round(gap) : undefined,
        acceptsMoi: ["yes", "y", "true"].includes(moi) ? true : ["no", "n", "false"].includes(moi) ? false : undefined,
        processNotes: get(row, "process_notes") || undefined,
      };
      const existing = knownUniversities.get(uniSlug);
      if (existing) {
        await db.university.update({ where: { id: existing }, data: { ...fields, name: uniName, countryId } });
        universityId = existing;
        result.universities.updated++;
      } else {
        const confirmationName = /canada/i.test(countryName) ? "LOA" : /australia/i.test(countryName) ? "CoE" : /united states|usa/i.test(countryName) ? "I-20" : "CAS";
        universityId = (await db.university.create({ data: { ...fields, name: uniName, slug: uniSlug, countryId, confirmationName, isPublished: false } })).id;
        result.universities.created++;
      }
      universityIds.set(uniSlug, universityId);

      // Documents the university asks for, e.g. "Passport; Transcript; CV". Only missing ones are added.
      const docs = get(row, "documents").split(";").map((d) => d.trim()).filter(Boolean);
      docs.forEach((label, index) => {
        const type = documentTypeByLabel.get(label.toLowerCase()) ?? "OTHER";
        const key = `${universityId}|${type}|${label.toLowerCase()}`;
        if (knownRequirements.has(key) || (type !== "OTHER" && knownRequirements.has(`${universityId}|${type}`))) return;
        knownRequirements.add(key);
        knownRequirements.add(`${universityId}|${type}`);
        newRequirements.push({ universityId: universityId!, type, label, sortOrder: index });
      });

      // Intakes, e.g. "September 2027; January 2028". Each starts on the 1st of its month.
      for (const name of get(row, "intakes").split(";").map((i) => i.trim()).filter(Boolean)) {
        const match = /^([A-Za-z]+)\s+(\d{4})$/.exec(name);
        const month = match ? months.indexOf(match[1].slice(0, 3).toLowerCase()) : -1;
        if (!match || month < 0) { problems.push(`Row ${line}: intake "${name}" should look like "September 2027" (skipped).`); continue; }
        const label = `${match[1][0].toUpperCase()}${match[1].slice(1).toLowerCase()} ${match[2]}`;
        const key = `${universityId}|${label.toLowerCase()}`;
        if (knownIntakes.has(key)) continue;
        knownIntakes.add(key);
        newIntakes.push({ universityId, name: label, startDate: new Date(Date.UTC(Number(match[2]), month, 1)) });
      }
    }

    // Course (optional)
    const courseName = get(row, "course");
    if (!courseName) continue;
    const level = toLevel(get(row, "level"));
    if (!level) { problems.push(`Row ${line}: level must be Foundation, Diploma, Undergraduate, Postgraduate or PhD (course skipped).`); continue; }

    let subjectId: string | undefined;
    const subjectName = get(row, "subject");
    if (subjectName) {
      subjectId = subjectIds.get(subjectName.toLowerCase());
      if (!subjectId) {
        const existing = knownSubjects.get(subjectName.toLowerCase());
        if (existing) subjectId = existing;
        else {
          subjectId = (await db.subject.create({ data: { name: subjectName, slug: slugify(subjectName) } })).id;
          result.subjects++;
        }
        subjectIds.set(subjectName.toLowerCase(), subjectId);
      }
    }

    const duration = num(get(row, "duration_months"));
    const fee = num(get(row, "tuition_fee"));
    const ielts = num(get(row, "min_ielts"));
    if (duration === undefined || fee === undefined || ielts === undefined || (ielts !== null && ielts > 9)) {
      problems.push(`Row ${line}: duration, fee or IELTS is not a valid number (those cells skipped).`);
    }
    const currency = get(row, "currency").toUpperCase();
    const courseFields = {
      subjectId,
      durationMonths: duration ? Math.round(duration) : undefined,
      tuitionFee: fee ?? undefined,
      currency: /^[A-Z]{3}$/.test(currency) ? currency
        : /canada/i.test(countryName) ? "CAD" : /australia/i.test(countryName) ? "AUD" : /united states|usa/i.test(countryName) ? "USD" : undefined,
      minIelts: ielts !== null && ielts !== undefined && ielts <= 9 ? ielts : undefined,
    };
    const courseSlug = slugify(courseName);
    const courseKey = `${universityId}|${courseSlug}`;
    const existingCourse = knownCourses.get(courseKey);
    if (existingCourse) {
      await db.course.update({ where: { id: existingCourse }, data: { ...courseFields, name: courseName, level } });
      result.courses.updated++;
    } else if (queuedCourses.has(courseKey)) {
      problems.push(`Row ${line}: "${courseName}" appears twice for ${uniName} (second row skipped).`);
    } else {
      queuedCourses.add(courseKey);
      newCourses.push({ ...courseFields, universityId, name: courseName, slug: courseSlug, level, isPublished: true });
    }
  }

  if (newRequirements.length) result.documents = (await db.universityRequirement.createMany({ data: newRequirements })).count;
  if (newIntakes.length) result.intakes = (await db.intake.createMany({ data: newIntakes })).count;

  for (let i = 0; i < newCourses.length; i += 500) {
    const { count } = await db.course.createMany({ data: newCourses.slice(i, i + 500), skipDuplicates: true });
    result.courses.created += count;
  }

  return { ...result, problems };
}
