"use server";

import { revalidatePath } from "next/cache";
import { requiredAgentDocuments } from "@/lib/agent";
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

  const document = await db.agentDocument.findUnique({ where: { id }, select: { agentId: true } });
  if (!document) return { error: "This document no longer exists." };
  await db.$transaction([
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
