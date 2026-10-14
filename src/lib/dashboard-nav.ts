import "server-only";
import type { IconName } from "@/components/ui/icon";
import type { PermissionModule, Role } from "@/generated/prisma/client";
import { staffUnreadCount, studentUnreadCount } from "@/lib/messages";
import { dueReminderCount } from "@/lib/reminders";
import { can } from "@/lib/session";
import type { CurrentUser } from "@/lib/session";

export type NavItem = { label: string; href: string; icon: IconName; soon?: boolean; badge?: number };
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
      { label: "Reminders", href: "/dashboard/reminders", icon: "clock", roles: staff },
      { label: "My students", href: "/dashboard/agent/students", icon: "cap", roles: ["AGENT"] },
      { label: "My commission", href: "/dashboard/agent/commissions", icon: "coins", roles: ["AGENT"] },
      { label: "My applications", href: "/dashboard/my-applications", icon: "document", roles: ["STUDENT"] },
      { label: "My profile", href: "/dashboard/profile", icon: "users", roles: ["STUDENT"] },
      { label: "Documents", href: "/dashboard/documents", icon: "document", roles: ["STUDENT"] },
      { label: "Messages", href: "/dashboard/messages", icon: "chat", roles: ["ADMIN", "STAFF", "STUDENT"], module: "STUDENTS" },
      { label: "Agents", href: "/dashboard/agents", icon: "briefcase", roles: staff, module: "AGENTS" },
      { label: "Commission", href: "/dashboard/commissions", icon: "coins", roles: staff, module: "COMMISSIONS" },
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
      if (item.href === "/dashboard/reminders") {
        const due = await dueReminderCount(user.id);
        items.push(due ? { ...item, badge: due } : item);
        continue;
      }
      if (item.href === "/dashboard/messages") {
        const unread = user.role === "STUDENT" ? await studentUnreadCount(user.id) : await staffUnreadCount(user.id);
        items.push(unread ? { ...item, badge: unread } : item);
        continue;
      }
      items.push(item);
    }
    if (items.length) result.push({ label: group.label, items });
  }
  return result;
}
