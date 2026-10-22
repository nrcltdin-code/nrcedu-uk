import "server-only";
import type { ApplicationMethod, DocumentType } from "@/generated/prisma/client";
import { studyLevelLabels } from "@/app/dashboard/leads/labels";
import { db } from "@/lib/db";
import { documentTypeLabels } from "@/lib/documents";

// Everything needed to send one application to its university, built from the student's file.
// The same pack feeds every way of sending: the copy panel, the email, the printable summary
// and the documents download. Only the delivery differs between universities.

export type PackField = { label: string; value: string };
export type PackGroup = { title: string; fields: PackField[] };
export type PackDocument = { id: string; name: string; type: DocumentType; typeLabel: string; label: string; fileName: string };

const day = new Intl.DateTimeFormat("en-GB", { day: "2-digit", month: "2-digit", year: "numeric", timeZone: "UTC" });
const longDay = new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" });
const iso = (date: Date) => date.toISOString().slice(0, 10);

// Portals ask for names split; we only store the full name, so the last word is the family name.
export function splitName(full: string) {
  const parts = full.trim().split(/\s+/);
  if (parts.length < 2) return { given: full.trim(), family: "" };
  return { given: parts.slice(0, -1).join(" "), family: parts.at(-1)! };
}

const safeFileName = (value: string) => value.replace(/[\\/:*?"<>|\r\n]+/g, " ").replace(/\s+/g, " ").trim().slice(0, 120);

export async function buildSubmissionPack(applicationId: string) {
  const app = await db.application.findUnique({
    where: { id: applicationId },
    select: {
      id: true,
      stage: true,
      universityRef: true,
      student: {
        select: {
          id: true,
          dateOfBirth: true,
          gender: true,
          nationality: true,
          englishMedium: true,
          passportNumber: true,
          passportExpiry: true,
          phone: true,
          address: true,
          country: { select: { name: true } },
          user: { select: { name: true, email: true, phone: true } },
          educationRecords: { orderBy: [{ yearCompleted: "desc" }] },
          testScores: { orderBy: [{ takenAt: "desc" }] },
        },
      },
      course: {
        select: {
          name: true,
          level: true,
          university: { select: { name: true, applicationMethod: true, applicationUrl: true, applicationEmail: true, processNotes: true } },
        },
      },
      intake: { select: { name: true, startDate: true, applicationDeadline: true } },
      agent: { select: { companyName: true, user: { select: { name: true } } } },
      assignedStaff: { select: { name: true, email: true } },
      documentRequests: {
        orderBy: { createdAt: "asc" },
        select: { id: true, label: true, required: true, status: true, documents: { where: { status: "APPROVED" }, orderBy: { createdAt: "desc" }, take: 1, select: { id: true, name: true, type: true } } },
      },
    },
  });
  if (!app) return null;

  const s = app.student;
  const { given, family } = splitName(s.user.name);
  const phone = s.phone ?? s.user.phone;

  // ---- Fields, in the order portal forms usually ask for them ----
  const groups: PackGroup[] = [
    {
      title: "Personal details",
      fields: [
        { label: "Full name", value: s.user.name },
        { label: "Given / first name(s)", value: given },
        { label: "Family name / surname", value: family },
        { label: "Date of birth (DD/MM/YYYY)", value: s.dateOfBirth ? day.format(s.dateOfBirth) : "" },
        { label: "Date of birth (YYYY-MM-DD)", value: s.dateOfBirth ? iso(s.dateOfBirth) : "" },
        { label: "Gender", value: s.gender ?? "" },
        { label: "Nationality", value: s.nationality ?? "" },
        { label: "Country of residence", value: s.country?.name ?? "" },
      ],
    },
    {
      title: "Passport",
      fields: [
        { label: "Passport number", value: s.passportNumber ?? "" },
        { label: "Passport expiry (DD/MM/YYYY)", value: s.passportExpiry ? day.format(s.passportExpiry) : "" },
      ],
    },
    {
      title: "Contact",
      fields: [
        { label: "Email", value: s.user.email },
        { label: "Phone", value: phone ?? "" },
        { label: "Address", value: s.address ?? "" },
      ],
    },
    {
      title: "Course applied for",
      fields: [
        { label: "University", value: app.course.university.name },
        { label: "Course", value: app.course.name },
        { label: "Level", value: studyLevelLabels[app.course.level] },
        { label: "Intake", value: app.intake?.name ?? "" },
        { label: "Start date", value: app.intake ? longDay.format(app.intake.startDate) : "" },
      ],
    },
    ...s.educationRecords.map((e, i) => ({
      title: `Education ${s.educationRecords.length > 1 ? i + 1 : ""}`.trim(),
      fields: [
        { label: "Level", value: studyLevelLabels[e.level] },
        { label: "Institution", value: e.institution },
        { label: "Subject", value: e.fieldOfStudy ?? "" },
        { label: "Result", value: e.result ?? (e.grade && e.gradeOutOf ? `${e.grade} out of ${e.gradeOutOf}` : "") },
        { label: "Year completed", value: e.yearCompleted ? String(e.yearCompleted) : "" },
      ],
    })),
    ...s.testScores.map((t) => ({
      title: `English test: ${t.test}`,
      fields: [
        { label: "Test", value: t.test },
        { label: "Overall", value: t.overall?.toString() ?? t.score },
        { label: "Lowest band", value: t.lowest?.toString() ?? "" },
        { label: "Test date (DD/MM/YYYY)", value: t.takenAt ? day.format(t.takenAt) : "" },
      ],
    })),
    {
      title: "Representative",
      fields: [
        { label: "Agency", value: "NRC Educational Consultants" },
        { label: "Counsellor", value: app.assignedStaff?.name ?? "" },
        { label: "Counsellor email", value: app.assignedStaff?.email ?? "" },
        { label: "Referring agent", value: app.agent ? (app.agent.companyName ?? app.agent.user.name) : "" },
      ],
    },
  ];

  // ---- Documents: the approved file for each request on this application, then the student's general approved documents ----
  const documents: PackDocument[] = [];
  const seen = new Set<string>();
  const add = (doc: { id: string; name: string; type: DocumentType }, label: string) => {
    if (seen.has(doc.id)) return;
    seen.add(doc.id);
    const extension = doc.name.match(/\.[a-z0-9]+$/i)?.[0] ?? "";
    documents.push({ id: doc.id, name: doc.name, type: doc.type, typeLabel: documentTypeLabels[doc.type], label, fileName: safeFileName(`${label} - ${s.user.name}`) + extension });
  };
  for (const r of app.documentRequests) if (r.documents[0]) add(r.documents[0], r.label);
  const general = await db.document.findMany({
    where: { studentId: s.id, applicationId: null, status: "APPROVED", fileKey: { not: null } },
    orderBy: { createdAt: "desc" },
    select: { id: true, name: true, type: true, request: { select: { label: true } } },
  });
  for (const d of general) add(d, d.request?.label ?? documentTypeLabels[d.type]);
  // Two files with the same label would collide in a zip or as attachments.
  const names = new Map<string, number>();
  for (const d of documents) {
    const n = (names.get(d.fileName) ?? 0) + 1;
    names.set(d.fileName, n);
    if (n > 1) d.fileName = d.fileName.replace(/(\.[a-z0-9]+)?$/i, ` (${n})$1`);
  }

  // ---- What is missing ----
  // Blockers stop the submission; warnings are worth a look but do not.
  const blockers: string[] = [];
  const warnings: string[] = [];
  const missingDocs = app.documentRequests.filter((r) => r.required && r.status !== "APPROVED" && r.status !== "WAIVED");
  if (missingDocs.length) blockers.push(`Required documents not approved yet: ${missingDocs.map((r) => r.label).join(", ")}.`);
  const required: [string, unknown][] = [
    ["date of birth", s.dateOfBirth],
    ["nationality", s.nationality],
    ["passport number", s.passportNumber],
    ["passport expiry", s.passportExpiry],
    ["phone number", phone],
    ["address", s.address],
  ];
  const missingFields = required.filter(([, value]) => !value).map(([label]) => label);
  if (missingFields.length) blockers.push(`Missing on the student's profile: ${missingFields.join(", ")}.`);
  if (s.educationRecords.length === 0) blockers.push("No education history on the student's profile.");
  if (s.testScores.length === 0 && !s.englishMedium) warnings.push("No English test score, and the student did not study in English.");
  if (s.passportExpiry) {
    const needed = app.intake?.startDate ?? new Date();
    if (s.passportExpiry < needed) blockers.push(`The passport expires (${longDay.format(s.passportExpiry)}) before the course starts.`);
  }
  if (!app.intake) warnings.push("No intake chosen for this application.");
  if (app.intake?.applicationDeadline && app.intake.applicationDeadline < new Date()) warnings.push(`The application deadline (${longDay.format(app.intake.applicationDeadline)}) has passed.`);
  if (!app.course.university.applicationMethod) warnings.push(`How ${app.course.university.name} takes applications is not saved yet. Add it on the university's page.`);
  if (missingFields.length === 0 && family === "") warnings.push("The student's name is a single word. Check the family name before submitting.");

  return {
    id: app.id,
    stage: app.stage,
    universityRef: app.universityRef,
    studentId: s.id,
    studentName: s.user.name,
    courseName: app.course.name,
    intakeName: app.intake?.name ?? null,
    university: app.course.university as { name: string; applicationMethod: ApplicationMethod | null; applicationUrl: string | null; applicationEmail: string | null; processNotes: string | null },
    counsellor: app.assignedStaff,
    groups: groups.map((g) => ({ ...g, fields: g.fields.filter((f) => f.value) })).filter((g) => g.fields.length),
    documents,
    blockers,
    warnings,
  };
}

export type SubmissionPack = NonNullable<Awaited<ReturnType<typeof buildSubmissionPack>>>;

// A short code that ties university replies back to this application.
export const submissionCode = (applicationId: string) => `NRC-${applicationId.slice(-8).toUpperCase()}`;

// Plain-text application summary: the body of the email and the content of the copy-all button.
export function packText(pack: SubmissionPack) {
  return pack.groups.map((g) => `${g.title}\n${g.fields.map((f) => `  ${f.label}: ${f.value}`).join("\n")}`).join("\n\n");
}
