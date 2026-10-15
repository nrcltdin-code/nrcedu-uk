"use server";

import { revalidatePath } from "next/cache";
import type { CommissionDirection, CommissionStatus } from "@/generated/prisma/client";
import { db } from "@/lib/db";
import { text } from "@/lib/form";
import { notify } from "@/lib/notifications";
import type { FormState } from "@/lib/form";
import { requirePermission } from "@/lib/session";
import { directionLabels } from "./labels";

const round = (value: number) => Math.round(value * 100) / 100;

function refresh(applicationId: string) {
  revalidatePath(`/dashboard/applications/${applicationId}`);
  revalidatePath("/dashboard/commissions");
}

// Adds the expected amounts from the course's yearly tuition fee and the university's rates:
// what the university pays NRC and, when an agent referred the student, what NRC pays them.
export async function addExpectedCommissions(applicationId: string): Promise<FormState> {
  const user = await requirePermission("COMMISSIONS", "edit");
  const app = await db.application.findUnique({
    where: { id: applicationId },
    select: {
      agentId: true,
      commissions: { where: { status: { not: "CANCELLED" } }, select: { direction: true } },
      course: { select: { tuitionFee: true, currency: true, university: { select: { nrcCommissionRate: true, agentCommissionRate: true } } } },
    },
  });
  if (!app) return { error: "This application no longer exists." };
  const fee = app.course.tuitionFee ? Number(app.course.tuitionFee) : null;
  if (!fee) return { error: "The course has no tuition fee. Add one on the university page, or enter the amount by hand." };

  const has = (direction: CommissionDirection) => app.commissions.some((c) => c.direction === direction);
  const rows = [];
  const nrcRate = app.course.university.nrcCommissionRate;
  if (nrcRate && !has("UNIVERSITY_TO_NRC")) {
    rows.push({ direction: "UNIVERSITY_TO_NRC" as const, ratePercent: nrcRate, amount: round((fee * Number(nrcRate)) / 100), agentId: null });
  }
  const agentRate = app.course.university.agentCommissionRate;
  if (app.agentId && agentRate && !has("NRC_TO_AGENT")) {
    rows.push({ direction: "NRC_TO_AGENT" as const, ratePercent: agentRate, amount: round((fee * Number(agentRate)) / 100), agentId: app.agentId });
  }
  if (rows.length === 0) {
    return { error: nrcRate ? "The expected amounts are already added." : "The university has no commission rate. Add it on the university page, or enter the amount by hand." };
  }

  await db.$transaction([
    ...rows.map((row) => db.commission.create({ data: { ...row, applicationId, currency: app.course.currency } })),
    db.activityLog.create({ data: { userId: user.id, action: "commission.create", entityType: "Application", entityId: applicationId } }),
  ]);
  refresh(applicationId);
  return { saved: true };
}

export async function addCommission(_previous: FormState, form: FormData): Promise<FormState> {
  const user = await requirePermission("COMMISSIONS", "edit");
  const applicationId = text(form, "applicationId");
  const direction = text(form, "direction") as CommissionDirection;
  const amount = Number(text(form, "amount"));
  const currency = text(form, "currency").toUpperCase();
  const note = text(form, "note");

  if (!(direction in directionLabels)) return { error: "Choose who pays." };
  if (!Number.isFinite(amount) || amount <= 0 || amount > 10_000_000) return { error: "Enter the amount." };
  if (!/^[A-Z]{3}$/.test(currency)) return { error: "Use a 3-letter currency code, e.g. GBP." };
  if (note.length > 300) return { error: "Keep the note under 300 characters." };

  const app = await db.application.findUnique({ where: { id: applicationId }, select: { agentId: true } });
  if (!app) return { error: "This application no longer exists." };
  if (direction === "NRC_TO_AGENT" && !app.agentId) return { error: "No agent referred this student." };

  await db.$transaction([
    db.commission.create({
      data: { applicationId, direction, amount: round(amount), currency, note: note || null, agentId: direction === "NRC_TO_AGENT" ? app.agentId : null },
    }),
    db.activityLog.create({ data: { userId: user.id, action: "commission.create", entityType: "Application", entityId: applicationId } }),
  ]);
  refresh(applicationId);
  return { saved: true };
}

export async function updateCommission(_previous: FormState, form: FormData): Promise<FormState> {
  const user = await requirePermission("COMMISSIONS", "edit");
  const id = text(form, "id");
  const amount = Number(text(form, "amount"));
  const status = text(form, "status") as CommissionStatus;
  const note = text(form, "note");

  if (!Number.isFinite(amount) || amount <= 0 || amount > 10_000_000) return { error: "Enter the amount." };
  if (!["PENDING", "SETTLED", "CANCELLED"].includes(status)) return { error: "Choose a status." };
  if (note.length > 300) return { error: "Keep the note under 300 characters." };

  const before = await db.commission.findUnique({ where: { id }, select: {
      applicationId: true,
      amount: true,
      status: true,
      settledAt: true,
      direction: true,
      currency: true,
      agent: { select: { userId: true } },
      application: { select: { student: { select: { user: { select: { name: true } } } } } },
    },
  });
  if (!before) return { error: "This record no longer exists." };

  await db.$transaction([
    db.commission.update({
      where: { id },
      data: {
        amount: round(amount),
        status,
        note: note || null,
        settledAt: status === "SETTLED" ? (before.settledAt ?? new Date()) : null,
      },
    }),
    db.activityLog.create({
      data: {
        userId: user.id,
        action: "commission.update",
        entityType: "Commission",
        entityId: id,
        meta: { from: { amount: before.amount.toString(), status: before.status }, to: { amount: String(round(amount)), status } },
      },
    }),
  ]);
  if (before.direction === "NRC_TO_AGENT" && status === "SETTLED" && before.status !== "SETTLED") {
    notify([before.agent?.userId], {
      type: "commission.paid",
      title: `Commission paid: ${before.currency} ${round(amount).toLocaleString("en-GB")}`,
      body: `For ${before.application.student.user.name}.`,
      href: "/dashboard/agent/commissions",
      email: true,
    });
  }
  refresh(before.applicationId);
  return { saved: true };
}
