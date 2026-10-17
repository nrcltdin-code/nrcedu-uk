"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requiredAgentDocuments } from "@/lib/agent";
import { db } from "@/lib/db";
import { link, queueEmail, staffAlertAddresses } from "@/lib/email";
import { optionalInt, text } from "@/lib/form";
import type { FormState } from "@/lib/form";
import { notify, staffWithAccess } from "@/lib/notifications";
import { requireRole } from "@/lib/session";
import { deletePrivateObject } from "@/lib/storage";

const page = "/dashboard/agent/onboarding";

// The registering agent's own profile, while it is still being checked.
async function myOpenProfile() {
  const user = await requireRole("AGENT");
  const profile = await db.agentProfile.findUnique({ where: { userId: user.id }, select: { id: true, kind: true, approvalStatus: true } });
  if (!profile) redirect("/dashboard");
  if (profile.approvalStatus === "APPROVED" || profile.approvalStatus === "REJECTED") redirect("/dashboard");
  return { user, profile };
}

export async function saveOnboardingProfile(_previous: FormState, form: FormData): Promise<FormState> {
  const { user, profile } = await myOpenProfile();
  const kind = text(form, "kind") === "AGENCY" ? "AGENCY" : "INDIVIDUAL";
  const name = text(form, "name");
  const phone = text(form, "phone");
  const companyName = text(form, "companyName");
  const registrationNumber = text(form, "registrationNumber");
  const website = text(form, "website");
  const countryId = text(form, "countryId");
  const address = text(form, "address");
  const about = text(form, "about");
  const yearsActive = optionalInt(text(form, "yearsActive"));
  const studentsPerYear = optionalInt(text(form, "studentsPerYear"));

  if (name.length < 2 || name.length > 100) return { error: "Enter your full name." };
  if (phone.length < 6 || phone.length > 30) return { error: "Enter a phone number we can reach you on." };
  if (kind === "AGENCY" && companyName.length < 2) return { error: "Enter the agency's name." };
  if (companyName.length > 150 || registrationNumber.length > 60 || address.length > 300) return { error: "One of the fields is too long." };
  if (website && !/^https?:\/\/\S+\.\S+$/.test(website)) return { error: "Enter the website as a full link, e.g. https://example.com." };
  if (about.length < 20 || about.length > 2000) return { error: "Describe your experience in 20 to 2,000 characters." };
  if (yearsActive === undefined || studentsPerYear === undefined || (yearsActive ?? 0) < 0 || (studentsPerYear ?? 0) < 0) return { error: "Years and students must be whole numbers." };
  if (!(await db.country.count({ where: { id: countryId } }))) return { error: "Choose the country you work in." };

  await db.$transaction([
    db.user.update({ where: { id: user.id }, data: { name, phone } }),
    db.agentProfile.update({
      where: { id: profile.id },
      data: {
        kind,
        companyName: companyName || null,
        registrationNumber: kind === "AGENCY" ? registrationNumber || null : null,
        website: website || null,
        countryId,
        phone,
        address: address || null,
        about,
        yearsActive,
        studentsPerYear,
      },
    }),
  ]);
  revalidatePath(page);
  return { saved: true };
}

export async function deleteVerificationDocument(id: string) {
  const { profile } = await myOpenProfile();
  const document = await db.agentDocument.findFirst({ where: { id, agentId: profile.id, status: { not: "APPROVED" } }, select: { fileKey: true } });
  if (!document) return;
  await db.agentDocument.delete({ where: { id } });
  await deletePrivateObject(document.fileKey).catch((error) => console.error("Agent document delete:", error));
  revalidatePath(page);
}

// Sends the profile to NRC. Needs every required document uploaded (and not sent back).
export async function submitForReview(): Promise<FormState> {
  const { user, profile } = await myOpenProfile();
  const documents = await db.agentDocument.findMany({ where: { agentId: profile.id, status: { not: "REJECTED" } }, select: { type: true } });
  const have = new Set(documents.map((d) => d.type));
  const missing = requiredAgentDocuments(profile.kind).filter((type) => !have.has(type));
  if (missing.length) return { error: `Upload ${missing.length === 1 ? "the last required document" : `the ${missing.length} required documents`} first.` };

  const updated = await db.agentProfile.update({
    where: { id: profile.id },
    data: { approvalStatus: "PENDING", submittedAt: new Date() },
    select: { companyName: true },
  });
  await db.activityLog.create({ data: { userId: user.id, action: "agent.submitted", entityType: "AgentProfile", entityId: profile.id } });
  const who = updated.companyName || user.name;
  notify(await staffWithAccess("AGENTS", "edit"), {
    type: "agent.submitted",
    title: `Agent ready for review: ${who}`,
    body: "Profile and verification documents are in.",
    href: `/dashboard/agents/${profile.id}`,
    email: true,
  });
  queueEmail({ to: staffAlertAddresses(), subject: `Agent ready for review: ${who}`, text: `${who} sent their profile and documents for review.\n\nReview: ${link(`/dashboard/agents/${profile.id}`)}` });
  revalidatePath(page);
  return { saved: true };
}
