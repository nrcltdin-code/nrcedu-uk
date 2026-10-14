import "server-only";
import type { IconName } from "@/components/ui/icon";
import type { PermissionModule, Role } from "@/generated/prisma/client";
import { can } from "@/lib/session";
import type { CurrentUser } from "@/lib/session";

export type NavItem = { label: string; href: string; icon: IconName; soon?: boolean };
export type NavGroup = { label: string; items: NavItem[] };

type Entry = NavItem & { roles: Role[]; module?: PermissionModule; action?: "view" | "edit" };

const staff: Role[] = ["ADMIN", "STAFF"];

// Every dashboard screen, built or planned. "soon" items show greyed out so the
// structure is visible before each phase lands; drop the flag when the page exists.
const groups: { label: string; entries: Entry[] }[] = [
  {
    label: "",
    entries: [{ label: "Overview", href: "/dashboard", icon: "home", roles: ["ADMIN", "STAFF", "AGENT", "STUDENT"] }],
  },
  {
    label: "CRM",
    entries: [
      { label: "Leads", href: "/dashboard/leads", icon: "inbox", roles: staff, module: "LEADS" },
      { label: "Students", href: "/dashboard/students", icon: "cap", roles: staff, module: "STUDENTS" },
      { label: "Applications", href: "/dashboard/applications", icon: "document", roles: staff, module: "APPLICATIONS" },
      // Agent and student views of the same records arrive with their portals (4.4, 4.5).
      { label: "My students", href: "/dashboard/students", icon: "cap", roles: ["AGENT"], soon: true },
      { label: "My applications", href: "/dashboard/applications", icon: "document", roles: ["AGENT", "STUDENT"], soon: true },
      { label: "Documents", href: "/dashboard/documents", icon: "document", roles: ["STUDENT"], soon: true },
      { label: "Messages", href: "/dashboard/messages", icon: "chat", roles: ["STAFF", "STUDENT"], soon: true },
      { label: "Agents", href: "/dashboard/agents", icon: "briefcase", roles: staff, module: "AGENTS" },
      { label: "Commissions", href: "/dashboard/commissions", icon: "coins", roles: [...staff, "AGENT"], module: "COMMISSIONS", soon: true },
    ],
  },
  {
    label: "Website",
    entries: [
      { label: "Home slider", href: "/dashboard/slides", icon: "image", roles: staff, module: "CONTENT", action: "edit" },
      { label: "Universities", href: "/dashboard/universities", icon: "building", roles: staff, module: "CONTENT", action: "edit" },
      { label: "Subjects", href: "/dashboard/subjects", icon: "cap", roles: staff, module: "CONTENT", action: "edit" },
      { label: "Countries", href: "/dashboard/countries", icon: "globe", roles: staff, module: "CONTENT", action: "edit" },
      { label: "Blog", href: "/dashboard/blog", icon: "pencil", roles: staff, module: "CONTENT", action: "edit" },
      { label: "Testimonials", href: "/dashboard/testimonials", icon: "chat", roles: staff, module: "CONTENT", action: "edit" },
      { label: "Partners", href: "/dashboard/partners", icon: "shield", roles: staff, module: "CONTENT", action: "edit" },
      { label: "FAQs", href: "/dashboard/faqs", icon: "search", roles: staff, module: "CONTENT", action: "edit" },
      { label: "Offices", href: "/dashboard/offices", icon: "pin", roles: staff, module: "CONTENT", action: "edit" },
    ],
  },
  {
    label: "Admin",
    entries: [
      { label: "Users and roles", href: "/dashboard/users", icon: "users", roles: staff, module: "USERS" },
      { label: "Site settings", href: "/dashboard/settings", icon: "settings", roles: staff, module: "SETTINGS", action: "edit" },
    ],
  },
];

export async function getDashboardNav(user: CurrentUser): Promise<NavGroup[]> {
  const result: NavGroup[] = [];
  for (const group of groups) {
    const items: NavItem[] = [];
    for (const { roles, module, action, ...item } of group.entries) {
      if (!roles.includes(user.role)) continue;
      // Module limits apply to staff; agents and students only ever see their own records.
      if (module && (user.role === "ADMIN" || user.role === "STAFF") && !(await can(user, module, action))) continue;
      items.push(item);
    }
    if (items.length) result.push({ label: group.label, items });
  }
  return result;
}
