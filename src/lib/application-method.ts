import type { ApplicationMethod } from "@/generated/prisma/client";

export const applicationMethodLabels: Record<ApplicationMethod, string> = {
  DIRECT_PORTAL: "University's online portal",
  AGENT_PORTAL: "Agent / partner portal",
  EMAIL: "By email",
  UCAS: "UCAS",
  OTHER: "Other (see notes)",
};

export const isApplicationMethod = (value: string): value is ApplicationMethod => value in applicationMethodLabels;
