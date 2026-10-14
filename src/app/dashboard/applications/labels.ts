import type { ApplicationStage } from "@/generated/prisma/client";

// Pipeline order. The last three are end states.
export const stages: ApplicationStage[] = [
  "NEW",
  "DOCUMENTS_PENDING",
  "SUBMITTED_TO_UNIVERSITY",
  "OFFER_RECEIVED",
  "DEPOSIT_CAS",
  "VISA_APPLIED",
  "VISA_GRANTED",
  "ENROLLED",
  "VISA_REFUSED",
  "WITHDRAWN",
];

export const closedStages: ApplicationStage[] = ["ENROLLED", "VISA_REFUSED", "WITHDRAWN"];

export const stageLabels: Record<ApplicationStage, string> = {
  NEW: "New",
  DOCUMENTS_PENDING: "Documents pending",
  SUBMITTED_TO_UNIVERSITY: "Submitted to university",
  OFFER_RECEIVED: "Offer received",
  DEPOSIT_CAS: "Deposit / CAS",
  VISA_APPLIED: "Visa applied",
  VISA_GRANTED: "Visa granted",
  VISA_REFUSED: "Visa refused",
  ENROLLED: "Enrolled",
  WITHDRAWN: "Withdrawn",
};

export const stageTones: Record<ApplicationStage, "brand" | "accent" | "success" | "danger" | "neutral"> = {
  NEW: "accent",
  DOCUMENTS_PENDING: "accent",
  SUBMITTED_TO_UNIVERSITY: "brand",
  OFFER_RECEIVED: "brand",
  DEPOSIT_CAS: "brand",
  VISA_APPLIED: "brand",
  VISA_GRANTED: "success",
  ENROLLED: "success",
  VISA_REFUSED: "danger",
  WITHDRAWN: "neutral",
};
