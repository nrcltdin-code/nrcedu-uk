import "server-only";
import { cache } from "react";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import type { PermissionModule, Role } from "@/generated/prisma/client";

export type CurrentUser = {
  id: string;
  name: string;
  email: string;
  image: string | null;
  role: Role;
  emailVerified: boolean;
  twoFactorEnabled: boolean;
};

// Every page, action and route handler that needs the signed-in user goes through here.
// Reads the user from the database, so a role change or suspension applies immediately.
export const getCurrentUser = cache(async (): Promise<CurrentUser | null> => {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return null;

  const user = await db.user.findUnique({
    where: { id: session.user.id },
    select: { id: true, name: true, email: true, image: true, role: true, status: true, emailVerified: true, twoFactorEnabled: true },
  });
  if (!user || user.status !== "ACTIVE") return null;

  return { id: user.id, name: user.name, email: user.email, image: user.image, role: user.role, emailVerified: user.emailVerified, twoFactorEnabled: user.twoFactorEnabled };
});

export async function requireUser(): Promise<CurrentUser> {
  const user = await getCurrentUser();
  if (!user) redirect("/?auth=login");
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
  if (!permission) return true;
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
