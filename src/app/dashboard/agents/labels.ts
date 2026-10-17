import type { ApprovalStatus } from "@/generated/prisma/client";

export const approvalLabels: Record<ApprovalStatus, string> = {
  PENDING: "Waiting for review",
  CHANGES_REQUESTED: "Changes asked",
  APPROVED: "Approved",
  REJECTED: "Rejected",
};

export const approvalTones = { PENDING: "accent", CHANGES_REQUESTED: "accent", APPROVED: "success", REJECTED: "danger" } as const;
