import type { ApprovalStatus } from "@/generated/prisma/client";

export const approvalLabels: Record<ApprovalStatus, string> = {
  PENDING: "Waiting for review",
  CHANGES_REQUESTED: "Changes asked",
  APPROVED: "Approved",
  REJECTED: "Rejected",
};

export const approvalTones = { PENDING: "accent", CHANGES_REQUESTED: "accent", APPROVED: "success", REJECTED: "danger" } as const;

// Staff-only: the last step taken with an agent's request, picked on the agent page.
export const followUpLabels = {
  NOT_CONTACTED: "Not contacted yet",
  CONTACTED: "Contacted",
  NO_ANSWER: "No answer",
  MEETING_BOOKED: "Meeting booked",
  MEETING_DONE: "Meeting done",
  WAITING_DOCUMENTS: "Waiting for documents",
  CHECKING_REFERENCES: "Checking references",
  ON_HOLD: "On hold",
} as const;
export type FollowUp = keyof typeof followUpLabels;
export const isFollowUp = (v: string): v is FollowUp => Object.hasOwn(followUpLabels, v);
