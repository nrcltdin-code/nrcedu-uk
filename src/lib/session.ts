import "server-only";
import { cache } from "react";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { emailEnabled } from "@/lib/email";
import type { PermissionModule, Role } from "@/generated/prisma/client";

// What an account must do before it may use anything but the Account page.
export type AccountGate = "confirm-email" | "two-factor";

export type CurrentUser = {
  id: string;
  name: string;
  email: string;
  image: string | null;
  role: Role;
  emailVerified: boolean;
  twoFactorEnabled: boolean;
  gate: AccountGate | null;
};

// Sign-in already refuses unconfirmed addresses; the email gate catches sessions from before that rule.
// Admins and staff who sign in with a password must turn on two-step sign-in. Google-only accounts are
// covered by their Google account's own security.
async function accountGate(user: { id: string; role: Role; emailVerified: boolean; twoFactorEnabled: boolean }): Promise<AccountGate | null> {
  if (!user.emailVerified && emailEnabled) return "confirm-email";
  if (user.twoFactorEnabled || (user.role !== "ADMIN" && user.role !== "STAFF")) return null;
  const credential = await db.account.findFirst({ where: { userId: user.id, providerId: "credential", password: { not: null } }, select: { id: true } });
  return credential ? "two-factor" : null;
}

// The signed-in user, even one held at the Account page by a gate. Only the dashboard layout, the
// Account page and the site header use this; everything else goes through getCurrentUser.
// Reads the user from the database, so a role change or suspension applies immediately.
export const getSignedInUser = cache(async (): Promise<CurrentUser | null> => {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return null;

  const user = await db.user.findUnique({
    where: { id: session.user.id },
    select: { id: true, name: true, email: true, image: true, role: true, status: true, emailVerified: true, twoFactorEnabled: true },
  });
  if (!user || user.status !== "ACTIVE") return null;

  return {
    id: user.id,
    name: user.name,
    email: user.email,
    image: user.image,
    role: user.role,
    emailVerified: user.emailVerified,
    twoFactorEnabled: user.twoFactorEnabled,
    gate: await accountGate(user),
  };
});

// Every page, action and route handler that needs the signed-in user goes through here. A gated
// account counts as signed out, so no data leaves the server until the gate is passed.
export const getCurrentUser = cache(async (): Promise<CurrentUser | null> => {
  const user = await getSignedInUser();
  return user && !user.gate ? user : null;
});

// For the Account page and its actions, where a gated account sets up what the gate asks for.
export async function requireSignedInUser(): Promise<CurrentUser> {
  const user = await getSignedInUser();
  if (!user) redirect("/?auth=login");
  return user;
}

export async function requireUser(): Promise<CurrentUser> {
  const user = await requireSignedInUser();
  if (user.gate) redirect("/dashboard/account");
  return user;
}

export async function requireRole(...roles: Role[]): Promise<CurrentUser> {
  const user = await requireUser();
  if (!roles.includes(user.role)) redirect("/dashboard");
  return user;
}

// Admins can do everything. Staff can do everything unless an admin has restricted the module.
export async function can(
  user: CurrentUser,
  module: PermissionModule,
  action: "view" | "edit" = "view",
): Promise<boolean> {
  if (user.role === "ADMIN") return true;
  if (user.role !== "STAFF") return false;

  const permission = await db.staffPermission.findUnique({
    where: { userId_module: { userId: user.id, module } },
  });
  if (!permission) return false; // staff start with no access; an admin grants each module
  return action === "view" ? permission.canView : permission.canView && permission.canEdit;
}

export async function requirePermission(
  module: PermissionModule,
  action: "view" | "edit" = "view",
): Promise<CurrentUser> {
  const user = await requireRole("ADMIN", "STAFF");
  if (!(await can(user, module, action))) redirect("/dashboard");
  return user;
}
