import type { LeadSource, LeadStatus, StudyLevel } from "@/generated/prisma/client";

export const leadStatuses: LeadStatus[] = ["NEW", "CONTACTED", "QUALIFIED", "CONVERTED", "LOST"];

export const leadStatusLabels: Record<LeadStatus, string> = {
  NEW: "New",
  CONTACTED: "Contacted",
  QUALIFIED: "Qualified",
  CONVERTED: "Converted",
  LOST: "Lost",
};

export const leadStatusTones = {
  NEW: "accent",
  CONTACTED: "brand",
  QUALIFIED: "brand",
  CONVERTED: "success",
  LOST: "neutral",
} as const;

export const leadSourceLabels: Record<LeadSource, string> = {
  CONSULTATION_FORM: "Consultation form",
  CONTACT_FORM: "Contact form",
  START_YOUR_JOURNEY: "Start your journey",
  AGENT: "Agent",
  MANUAL: "Added by staff",
};

export const studyLevelLabels: Record<StudyLevel, string> = {
  SCHOOL: "School (A-Level, HSC, high school)",
  FOUNDATION: "Foundation",
  DIPLOMA: "Diploma",
  UNDERGRADUATE: "Undergraduate",
  POSTGRADUATE: "Postgraduate",
  PHD: "PhD",
  OTHER: "Other",
};

// Levels a student can apply for; SCHOOL is only for past education.
export const courseLevelOptions = Object.entries(studyLevelLabels)
  .filter(([value]) => value !== "SCHOOL")
  .map(([value, label]) => ({ value, label }));
