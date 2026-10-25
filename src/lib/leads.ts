import "server-only";
import { db } from "@/lib/db";
import { link, queueEmail } from "@/lib/email";
import { alertAddresses, countryInbox } from "@/lib/email-settings";
import { notify, staffWithAccess } from "@/lib/notifications";
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

// Single entry point for every form that creates a lead (public forms email on save). If the lead's country has a
// default owner (set by the admin), the lead is assigned to them; the admin can reassign later.
export async function createLead(lead: NewLead) {
  const assignment = lead.countryId
    ? await db.countryAssignment.findUnique({ where: { countryId: lead.countryId } })
    : null;

  const created = await db.lead.create({
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
    select: { id: true, assignedStaff: { select: { id: true, email: true } } },
  });

  if (lead.source === "MANUAL") return { id: created.id };

  // Alert the routed counsellor (or the shared staff inbox) and acknowledge the visitor.
  const counsellor = created.assignedStaff?.email;
  const fromForm = lead.source === "CONTACT_FORM" ? "contact form" : "consultation form";
  notify(created.assignedStaff ? [created.assignedStaff.id] : await staffWithAccess("LEADS", "edit"), {
    type: "lead.new",
    title: `New lead: ${lead.name}`,
    body: `Sent the ${fromForm}${created.assignedStaff ? " and assigned to you" : ""}.`,
    href: `/dashboard/leads/${created.id}`,
  });
  queueEmail(
    {
      to: counsellor ? [counsellor] : await alertAddresses("leads"),
      cc: [await countryInbox(lead.countryId)].filter((address): address is string => Boolean(address)),
      kind: "Lead alert",
      replyTo: lead.email,
      subject: `New lead: ${lead.name}`,
      text: `${lead.name} sent the ${fromForm}${counsellor ? " and the lead is assigned to you" : ""}.\n\nEmail: ${lead.email}\nPhone: ${lead.phone || "—"}\n\n${lead.message || "(no message)"}\n\nOpen the lead: ${link(`/dashboard/leads/${created.id}`)}`,
    },
    {
      to: lead.email,
      subject: "We received your message",
      text: `Hello ${lead.name},\n\nThank you for contacting NRC Educational Consultant. A counsellor will get back to you soon, usually within one working day.`,
    },
  );
  return { id: created.id };
}

export const isEmail = (value: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value) && value.length <= 254;
