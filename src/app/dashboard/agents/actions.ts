"use server";

import { revalidatePath } from "next/cache";
import type { AgentDocumentType } from "@/generated/prisma/client";
import { agentDocumentLabels, requiredAgentDocuments } from "@/lib/agent";
import { db } from "@/lib/db";
import { link, queueEmail } from "@/lib/email";
import { text } from "@/lib/form";
import type { FormState } from "@/lib/form";
import { notify } from "@/lib/notifications";
import { requirePermission } from "@/lib/session";

const page = (id: string) => `/dashboard/agents/${id}`;

export async function reviewAgentDocument(_previous: FormState, form: FormData): Promise<FormState> {
  const user = await requirePermission("AGENTS", "edit");
  const id = text(form, "id");
  const decision = text(form, "decision");
  const note = text(form, "note");
  if (decision !== "APPROVED" && decision !== "REJECTED") return { error: "Choose approve or send back." };
  if (decision === "REJECTED" && note.length < 3) return { error: "Say what is wrong, so the agent knows what to upload." };
  if (note.length > 500) return { error: "Keep the note under 500 characters." };

  const document = await db.agentDocument.findUnique({ where: { id }, select: { agentId: true, requestId: true } });
  if (!document) return { error: "This document no longer exists." };
  await db.$transaction([
    ...(decision === "APPROVED" && document.requestId ? [db.agentDocumentRequest.update({ where: { id: document.requestId }, data: { isOpen: false } })] : []),
    db.agentDocument.update({ where: { id }, data: { status: decision, reviewNote: note || null, reviewedById: user.id, reviewedAt: new Date() } }),
    db.activityLog.create({ data: { userId: user.id, action: `agent.document-${decision.toLowerCase()}`, entityType: "AgentProfile", entityId: document.agentId } }),
  ]);
  revalidatePath(page(document.agentId));
  return { saved: true };
}

// Approve, ask for changes (the agent fixes and sends again) or reject. The note goes to the agent.
export async function decideAgentProfile(_previous: FormState, form: FormData): Promise<FormState> {
  const user = await requirePermission("AGENTS", "edit");
  const id = text(form, "id");
  const decision = text(form, "decision");
  const note = text(form, "note");
  if (decision !== "APPROVED" && decision !== "CHANGES_REQUESTED" && decision !== "REJECTED") return { error: "Choose a decision." };
  if (decision !== "APPROVED" && note.length < 3) return { error: "Add a note for the agent saying what to change, or why." };
  if (note.length > 1000) return { error: "Keep the note under 1,000 characters." };

  const profile = await db.agentProfile.findUnique({
    where: { id },
    select: { kind: true, approvalStatus: true, userId: true, user: { select: { name: true, email: true } }, verification: { where: { status: "APPROVED" }, select: { type: true } } },
  });
  if (!profile) return { error: "This agent no longer exists." };
  if (decision === "APPROVED") {
    const approved = new Set(profile.verification.map((d) => d.type));
    const missing = requiredAgentDocuments(profile.kind).filter((t) => !approved.has(t));
    if (missing.length) return { error: `Approve the required documents first (${missing.length} still to check or missing).` };
    const open = await db.agentDocumentRequest.count({ where: { agentId: id, isOpen: true } });
    if (open) return { error: `${open === 1 ? "1 requested document is" : `${open} requested documents are`} still open. Approve the file sent, or cancel the request.` };
  }

  await db.$transaction([
    db.agentProfile.update({
      where: { id },
      data: { approvalStatus: decision, reviewNote: decision === "APPROVED" ? null : note, approvedById: user.id, approvedAt: new Date() },
    }),
    // Rejected agents (and a revoked agency) are signed out and locked; the others keep signing in.
    db.user.update({ where: { id: profile.userId }, data: { status: decision === "REJECTED" ? "SUSPENDED" : "ACTIVE" } }),
    ...(decision === "REJECTED" ? [db.session.deleteMany({ where: { userId: profile.userId } })] : []),
    db.activityLog.create({ data: { userId: user.id, action: `agent.${decision === "APPROVED" ? "approved" : decision === "REJECTED" ? "rejected" : "changes-requested"}`, entityType: "User", entityId: profile.userId, meta: { note } } }),
  ]);

  const { name, email } = profile.user;
  if (decision === "APPROVED") {
    notify([profile.userId], { type: "agent.approved", title: "Your agent account is approved", body: "Add your first lead or student to get started.", href: "/dashboard" });
    queueEmail({ to: email, subject: "Your NRC agent account is approved", text: `Hello ${name},\n\nYour agent account is now active. Sign in to add leads and students and follow their applications:\n${link("/?auth=login&next=/dashboard")}` });
  } else if (decision === "CHANGES_REQUESTED") {
    notify([profile.userId], { type: "agent.changes", title: "Please update your agent profile", body: note, href: "/dashboard/agent/onboarding" });
    queueEmail({ to: email, subject: "Please update your NRC agent profile", text: `Hello ${name},\n\nWe reviewed your agent profile and need a few changes:\n\n${note}\n\nSign in to update it and send it again: ${link("/dashboard/agent/onboarding")}` });
  } else {
    queueEmail({ to: email, subject: "Your NRC agent application", text: `Hello ${name},\n\nThank you for your interest in working with NRC. We are not able to approve your agent account.\n\n${note}\n\nIf you have questions, reply to this email.` });
  }
  revalidatePath(page(id));
  revalidatePath("/dashboard/agents");
  return { saved: true };
}

// An approved individual asked to become an agency. Approving switches them to AGENCY
// (the Team page appears); their students, applications and commission are untouched.
export async function decideAgencyUpgrade(_previous: FormState, form: FormData): Promise<FormState> {
  const user = await requirePermission("AGENTS", "edit");
  const id = text(form, "id");
  const decision = text(form, "decision");
  const note = text(form, "note");
  if (decision !== "APPROVED" && decision !== "CHANGES_REQUESTED" && decision !== "REJECTED") return { error: "Choose a decision." };
  if (decision !== "APPROVED" && note.length < 3) return { error: "Add a note for the agent saying what to change, or why." };
  if (note.length > 1000) return { error: "Keep the note under 1,000 characters." };

  const profile = await db.agentProfile.findUnique({
    where: { id },
    select: {
      kind: true,
      approvalStatus: true,
      upgradeStatus: true,
      upgradeCompanyName: true,
      upgradeRegistrationNumber: true,
      userId: true,
      user: { select: { name: true, email: true } },
      verification: { where: { type: "BUSINESS_REGISTRATION", status: "APPROVED" }, select: { id: true } },
    },
  });
  if (!profile) return { error: "This agent no longer exists." };
  if (profile.kind !== "INDIVIDUAL" || profile.approvalStatus !== "APPROVED" || profile.upgradeStatus !== "PENDING") {
    return { error: "There is no open upgrade request to decide." };
  }
  if (decision === "APPROVED" && !profile.verification.length) return { error: "Approve the business registration certificate first." };

  await db.$transaction([
    db.agentProfile.update({
      where: { id },
      data:
        decision === "APPROVED"
          ? { kind: "AGENCY", companyName: profile.upgradeCompanyName, registrationNumber: profile.upgradeRegistrationNumber, upgradeStatus: null, upgradeNote: null }
          : { upgradeStatus: decision, upgradeNote: note },
    }),
    db.activityLog.create({
      data: { userId: user.id, action: `agent.upgrade-${decision === "APPROVED" ? "approved" : decision === "REJECTED" ? "rejected" : "changes-requested"}`, entityType: "AgentProfile", entityId: id, meta: { note } },
    }),
  ]);

  const { name, email } = profile.user;
  if (decision === "APPROVED") {
    notify([profile.userId], { type: "agent.upgrade-approved", title: "You are now an agency", body: "Add your team from the Team page.", href: "/dashboard/agent/team" });
    queueEmail({ to: email, subject: "Your NRC agency upgrade is approved", text: `Hello ${name},\n\nYour account is now an agency. Add your team and choose what each person can do:\n${link("/dashboard/agent/team")}` });
  } else {
    const changes = decision === "CHANGES_REQUESTED";
    notify([profile.userId], { type: "agent.upgrade-decided", title: changes ? "Please update your agency request" : "Your agency request was not approved", body: note, href: "/dashboard/agent/upgrade" });
    queueEmail({
      to: email,
      subject: changes ? "Please update your NRC agency request" : "Your NRC agency request",
      text: `Hello ${name},\n\n${changes ? "We reviewed your request to become an agency and need a few changes:" : "We are not able to approve your request to become an agency. You can keep working as an individual agent."}\n\n${note}\n\n${link("/dashboard/agent/upgrade")}`,
    });
  }
  revalidatePath(page(id));
  revalidatePath("/dashboard/agents");
  return { saved: true };
}

// Ask the agent for one specific file. They get a notification and an email, and approval of
// the agent waits until a file for it is approved or the request is cancelled.
export async function requestAgentDocument(_previous: FormState, form: FormData): Promise<FormState> {
  const user = await requirePermission("AGENTS", "edit");
  const agentId = text(form, "agentId");
  const type = text(form, "type") as AgentDocumentType;
  const label = text(form, "label");
  const instructions = text(form, "instructions");
  if (!(type in agentDocumentLabels)) return { error: "Choose what kind of document this is." };
  if (label.length < 3 || label.length > 120) return { error: "Name the document in 3 to 120 characters, e.g. “Two client references”." };
  if (instructions.length > 1000) return { error: "Keep the instructions under 1,000 characters." };

  const agent = await db.agentProfile.findUnique({ where: { id: agentId }, select: { approvalStatus: true, userId: true, user: { select: { name: true, email: true } } } });
  if (!agent) return { error: "This agent no longer exists." };
  if (agent.approvalStatus === "REJECTED") return { error: "This agent was rejected. Reopen them before asking for documents." };
  if ((await db.agentDocumentRequest.count({ where: { agentId, isOpen: true } })) >= 10) return { error: "This agent already has 10 open requests. Close some first." };

  const created = await db.agentDocumentRequest.create({ data: { agentId, type, label, instructions: instructions || null, createdById: user.id }, select: { id: true } });
  await db.activityLog.create({ data: { userId: user.id, action: "agent.document-requested", entityType: "AgentProfile", entityId: agentId, meta: { requestId: created.id, label } } });

  notify([agent.userId], { type: "agent.document-requested", title: `NRC asked for a document: ${label}`, body: instructions || "Upload it from Documents for NRC.", href: "/dashboard/agent/documents" });
  queueEmail({
    to: agent.user.email,
    subject: `NRC asked for a document: ${label}`,
    text: `Hello ${agent.user.name},\n\nPlease upload: ${label}${instructions ? `\n\n${instructions}` : ""}\n\nUpload it here: ${link("/dashboard/agent/documents")}`,
  });
  revalidatePath(page(agentId));
  return { saved: true };
}

// Staff no longer need it. Files already sent stay on the agent's record.
export async function cancelAgentDocumentRequest(id: string) {
  const user = await requirePermission("AGENTS", "edit");
  const request = await db.agentDocumentRequest.findUnique({ where: { id }, select: { agentId: true, label: true } });
  if (!request) return;
  await db.$transaction([
    db.agentDocumentRequest.update({ where: { id }, data: { isOpen: false } }),
    db.activityLog.create({ data: { userId: user.id, action: "agent.document-request-cancelled", entityType: "AgentProfile", entityId: request.agentId, meta: { label: request.label } } }),
  ]);
  revalidatePath(page(request.agentId));
}
