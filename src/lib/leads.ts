import "server-only";
import { db } from "@/lib/db";
import type { LeadSource, StudyLevel } from "@/generated/prisma/client";

type NewLead = {
  name: string;
  email: string;
  phone?: string;
  message?: string;
  source: LeadSource;
  countryId?: string;
  destinationCountryId?: string;
  studyLevel?: StudyLevel;
};

// Single entry point for every public form that creates a lead. If the lead's country has a
// default owner (set by the admin), the lead is assigned to them; the admin can reassign later.
export async function createLead(lead: NewLead) {
  const assignment = lead.countryId
    ? await db.countryAssignment.findUnique({ where: { countryId: lead.countryId } })
    : null;

  return db.lead.create({
    data: {
      name: lead.name,
      email: lead.email.toLowerCase(),
      phone: lead.phone || null,
      message: lead.message || null,
      source: lead.source,
      countryId: lead.countryId ?? null,
      destinationCountryId: lead.destinationCountryId ?? null,
      studyLevel: lead.studyLevel ?? null,
      assignedStaffId: assignment?.staffId ?? null,
      assignedAgentId: assignment?.agentId ?? null,
    },
    select: { id: true },
  });
}

export const isEmail = (value: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value) && value.length <= 254;
