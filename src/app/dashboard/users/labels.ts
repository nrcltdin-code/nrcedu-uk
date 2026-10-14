import type { PermissionModule, Role, UserStatus } from "@/generated/prisma/client";

export const roleLabels: Record<Role, string> = {
  ADMIN: "Administrator",
  STAFF: "Staff",
  AGENT: "Agent",
  STUDENT: "Student",
};

export const statusLabels: Record<UserStatus, string> = {
  ACTIVE: "Active",
  PENDING: "Waiting for approval",
  SUSPENDED: "Suspended",
};

export const statusTones = { ACTIVE: "success", PENDING: "accent", SUSPENDED: "danger" } as const;

export const permissionModules: { module: PermissionModule; label: string }[] = [
  { module: "LEADS", label: "Leads" },
  { module: "STUDENTS", label: "Students" },
  { module: "APPLICATIONS", label: "Applications" },
  { module: "AGENTS", label: "Agents" },
  { module: "COMMISSIONS", label: "Commissions" },
  { module: "CONTENT", label: "Website content" },
  { module: "USERS", label: "Users" },
  { module: "SETTINGS", label: "Site settings" },
];
