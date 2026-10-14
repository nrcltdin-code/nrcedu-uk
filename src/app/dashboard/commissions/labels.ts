import type { CommissionDirection, CommissionStatus } from "@/generated/prisma/client";

export const directionLabels: Record<CommissionDirection, string> = {
  UNIVERSITY_TO_NRC: "University pays NRC",
  NRC_TO_AGENT: "NRC pays agent",
};

// "Settled" reads differently depending on who pays whom.
export const commissionStatusLabels: Record<CommissionDirection, Record<CommissionStatus, string>> = {
  UNIVERSITY_TO_NRC: { PENDING: "Expected", SETTLED: "Received", CANCELLED: "Cancelled" },
  NRC_TO_AGENT: { PENDING: "Due", SETTLED: "Paid", CANCELLED: "Cancelled" },
};

export const commissionStatusTones = { PENDING: "accent", SETTLED: "success", CANCELLED: "neutral" } as const;
