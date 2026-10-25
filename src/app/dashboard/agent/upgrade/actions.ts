"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAgentOwner } from "@/lib/agent";
import { db } from "@/lib/db";
import { link, queueEmail } from "@/lib/email";
import { alertAddresses } from "@/lib/email-settings";
import { text } from "@/lib/form";
import type { FormState } from "@/lib/form";
import { notify, staffWithAccess } from "@/lib/notifications";
import { deletePrivateObject } from "@/lib/storage";

const page = "/dashboard/agent/upgrade";

// The approved individual agent's own profile. Agencies have nothing to upgrade.
async function myIndividualProfile() {
  const scope = await requireAgentOwner();
  if (scope.kind !== "INDIVIDUAL") redirect("/dashboard");
  return scope;
}

// Saves the agency details and sends the request to NRC. Needs a business registration
// that has not been sent back.
export async function requestAgencyUpgrade(_previous: FormState, form: FormData): Promise<FormState> {
  const scope = await myIndividualProfile();
  const companyName = text(form, "companyName");
  const registrationNumber = text(form, "registrationNumber");
  if (companyName.length < 2 || companyName.length > 150) return { error: "Enter the agency's name." };
  if (registrationNumber.length > 60) return { error: "The registration number is too long." };

  const hasRegistration = await db.agentDocument.count({ where: { agentId: scope.agentId, type: "BUSINESS_REGISTRATION", status: { not: "REJECTED" } } });
  if (!hasRegistration) return { error: "Upload the business registration certificate first." };

  await db.$transaction([
    db.agentProfile.update({
      where: { id: scope.agentId },
      data: { upgradeStatus: "PENDING", upgradeCompanyName: companyName, upgradeRegistrationNumber: registrationNumber || null, upgradeNote: null, upgradeRequestedAt: new Date() },
    }),
    db.activityLog.create({ data: { userId: scope.userId, action: "agent.upgrade-requested", entityType: "AgentProfile", entityId: scope.agentId, meta: { companyName } } }),
  ]);
  notify(await staffWithAccess("AGENTS", "edit"), {
    type: "agent.upgrade",
    title: `Agency upgrade request: ${companyName}`,
    body: "An approved agent wants to become an agency and add a team.",
    href: `/dashboard/agents/${scope.agentId}`,
    email: true,
  });
  queueEmail({
    to: await alertAddresses("agents"),
    subject: `Agency upgrade request: ${companyName}`,
    text: `An approved individual agent asked to become the agency "${companyName}".\n\nReview: ${link(`/dashboard/agents/${scope.agentId}`)}`,
  });
  revalidatePath(page);
  return { saved: true };
}

// Remove a business registration that is not approved yet (e.g. the wrong file).
export async function deleteUpgradeDocument(id: string) {
  const scope = await myIndividualProfile();
  const document = await db.agentDocument.findFirst({
    where: { id, agentId: scope.agentId, type: "BUSINESS_REGISTRATION", status: { not: "APPROVED" } },
    select: { fileKey: true },
  });
  if (!document) return;
  await db.agentDocument.delete({ where: { id } });
  await deletePrivateObject(document.fileKey).catch((error) => console.error("Agent document delete:", error));
  revalidatePath(page);
}
