"use server";

import { hashPassword } from "better-auth/crypto";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { link, queueEmail } from "@/lib/email";
import { isEmail } from "@/lib/leads";
import { notify } from "@/lib/notifications";
import { requirePermission, requireRole } from "@/lib/session";
import type { CurrentUser } from "@/lib/session";
import type { PermissionModule, Role, UserStatus } from "@/generated/prisma/client";
import { permissionModules } from "./labels";

export type UserFormState = { error?: string };

const roles: Role[] = ["ADMIN", "STAFF", "AGENT", "STUDENT"];
const statuses: UserStatus[] = ["ACTIVE", "PENDING", "SUSPENDED"];

const text = (form: FormData, key: string) => String(form.get(key) ?? "").trim();

function log(actor: CurrentUser, action: string, entityId: string, meta?: object) {
  return db.activityLog.create({ data: { userId: actor.id, action, entityType: "User", entityId, meta } });
}

// There must always be at least one active admin, or nobody could manage the site.
async function isLastActiveAdmin(userId: string) {
  const admins = await db.user.findMany({ where: { role: "ADMIN", status: "ACTIVE" }, select: { id: true } });
  return admins.length === 1 && admins[0].id === userId;
}

// Admins add staff and other admins here; students and agents register themselves.
export async function createStaffUser(_previous: UserFormState, form: FormData): Promise<UserFormState> {
  const actor = await requireRole("ADMIN");

  const name = text(form, "name");
  const email = text(form, "email").toLowerCase();
  const role = text(form, "role") as Role;
  const password = String(form.get("password") ?? "");

  if (name.length < 2 || name.length > 100) return { error: "Enter the person's full name." };
  if (!isEmail(email)) return { error: "Enter a valid email address." };
  if (role !== "STAFF" && role !== "ADMIN") return { error: "Choose Staff or Administrator." };
  if (password.length < 8 || password.length > 128) return { error: "The first password needs at least 8 characters." };
  if (await db.user.findUnique({ where: { email }, select: { id: true } })) {
    return { error: "An account with this email already exists. Change its role from its page instead." };
  }

  const passwordHash = await hashPassword(password);
  const user = await db.$transaction(async (tx) => {
    const created = await tx.user.create({ data: { name, email, role, status: "ACTIVE" } });
    await tx.account.create({
      data: { userId: created.id, accountId: created.id, providerId: "credential", password: passwordHash },
    });
    return created;
  });
  await log(actor, "user.created", user.id, { role });

  redirect(`/dashboard/users/${user.id}`);
}

export async function updateUserAccess(_previous: UserFormState, form: FormData): Promise<UserFormState> {
  const actor = await requireRole("ADMIN");

  const id = text(form, "id");
  const role = text(form, "role") as Role;
  const status = text(form, "status") as UserStatus;
  if (!roles.includes(role) || !statuses.includes(status)) return { error: "Choose a role and a status." };

  const user = await db.user.findUnique({ where: { id }, select: { role: true, status: true } });
  if (!user) return { error: "This account no longer exists." };
  if (user.role === role && user.status === status) return {};

  const losesAdmin = user.role === "ADMIN" && user.status === "ACTIVE" && (role !== "ADMIN" || status !== "ACTIVE");
  if (losesAdmin && (await isLastActiveAdmin(id))) {
    return { error: "This is the only active administrator. Make someone else an administrator first." };
  }
  if (id === actor.id && losesAdmin) {
    return { error: "You cannot remove your own administrator access. Ask another administrator." };
  }

  await db.$transaction([
    db.user.update({ where: { id }, data: { role, status } }),
    // Signs the person out everywhere when they lose access.
    ...(status !== "ACTIVE" ? [db.session.deleteMany({ where: { userId: id } })] : []),
    // Per-module limits only mean something for staff.
    ...(role !== "STAFF" ? [db.staffPermission.deleteMany({ where: { userId: id } })] : []),
  ]);
  await log(actor, "user.access_changed", id, { from: user, to: { role, status } });

  revalidatePath(`/dashboard/users/${id}`);
  return {};
}

// One row per module. "Full access" rows are removed, since staff have full access by default.
export async function updateStaffPermissions(_previous: UserFormState, form: FormData): Promise<UserFormState> {
  const actor = await requireRole("ADMIN");

  const id = text(form, "id");
  const user = await db.user.findUnique({ where: { id }, select: { role: true } });
  if (user?.role !== "STAFF") return { error: "Module access can only be set for staff." };

  const levels = permissionModules.map(({ module }) => ({ module, level: text(form, module) }));
  if (levels.some(({ level }) => !["edit", "view", "none"].includes(level))) {
    return { error: "Choose an access level for every module." };
  }

  await db.$transaction(
    levels.map(({ module, level }) =>
      level === "edit"
        ? db.staffPermission.deleteMany({ where: { userId: id, module } })
        : db.staffPermission.upsert({
            where: { userId_module: { userId: id, module: module as PermissionModule } },
            create: { userId: id, module, canView: level === "view", canEdit: false },
            update: { canView: level === "view", canEdit: false },
          }),
    ),
  );
  await log(actor, "user.permissions_changed", id, Object.fromEntries(levels.map((l) => [l.module, l.level])));

  revalidatePath(`/dashboard/users/${id}`);
  return {};
}

export async function decideAgent(userId: string, decision: "APPROVED" | "REJECTED") {
  const actor = await requirePermission("AGENTS", "edit");

  const profile = await db.agentProfile.findUnique({
    where: { userId },
    select: { approvalStatus: true, user: { select: { name: true, email: true } } },
  });
  if (!profile) return;

  await db.$transaction([
    db.agentProfile.update({
      where: { userId },
      data: { approvalStatus: decision, approvedById: actor.id, approvedAt: new Date() },
    }),
    db.user.update({ where: { id: userId }, data: { status: decision === "APPROVED" ? "ACTIVE" : "SUSPENDED" } }),
    ...(decision === "REJECTED" ? [db.session.deleteMany({ where: { userId } })] : []),
  ]);
  await log(actor, decision === "APPROVED" ? "agent.approved" : "agent.rejected", userId);

  if (profile.approvalStatus !== decision && decision === "APPROVED") {
    notify([userId], { type: "agent.approved", title: "Your agent account is approved", body: "Add your first student to get started.", href: "/dashboard/agent/students" });
  }
  if (profile.approvalStatus !== decision) {
    const { name, email } = profile.user;
    queueEmail(
      decision === "APPROVED"
        ? {
            to: email,
            subject: "Your NRC agent account is approved",
            text: `Hello ${name},\n\nYour agent account is now active. Sign in with your email and password to add students and follow their applications:\n${link("/?auth=login&next=/dashboard")}`,
          }
        : {
            to: email,
            subject: "Your NRC agent application",
            text: `Hello ${name},\n\nThank you for your interest in working with NRC. We are not able to approve your agent account at this time. If you have questions, reply to this email or contact us.`,
          },
    );
  }

  revalidatePath("/dashboard/agents");
  revalidatePath("/dashboard/users");
  revalidatePath(`/dashboard/users/${userId}`);
}
