import "server-only";
import type { IconName } from "@/components/ui/icon";
import type { AgentPermission, PermissionModule, Role } from "@/generated/prisma/client";
import { findAgentScope, findOnboardingAgent } from "@/lib/agent";
import { staffUnreadCount, studentUnreadCount } from "@/lib/messages";
import { unreadNotificationCount } from "@/lib/notifications";
import { dueReminderCount } from "@/lib/reminders";
import { can } from "@/lib/session";
import type { CurrentUser } from "@/lib/session";

export type NavItem = { label: string; href: string; icon: IconName; soon?: boolean; badge?: number };
export type NavGroup = { label: string; collapsible?: boolean; items: NavItem[] };

// agent: the agency permission the item needs ("approved" = any approved agent account,
// "onboarding" = only while the agent is still being verified).
type Entry = NavItem & { roles: Role[]; module?: PermissionModule; action?: "view" | "edit"; agent?: AgentPermission | "approved" | "onboarding" | "agency-team" };

const staff: Role[] = ["ADMIN", "STAFF"];

// Every dashboard screen, built or planned. "soon" items show greyed out so the
// structure is visible before each phase lands; drop the flag when the page exists.
// Groups follow the day-to-day work: inbox first, then casework, then the website, then admin.
// "collapsible" groups fold shut in the sidebar unless the open page is inside them.
const all: Role[] = ["ADMIN", "STAFF", "AGENT", "STUDENT"];
const groups: { label: string; collapsible?: boolean; entries: Entry[] }[] = [
  {
    label: "",
    entries: [
      { label: "Overview", href: "/dashboard", icon: "home", roles: all },
      { label: "Notifications", href: "/dashboard/notifications", icon: "bell", roles: all },
      { label: "Messages", href: "/dashboard/messages", icon: "chat", roles: ["ADMIN", "STAFF", "STUDENT"], module: "STUDENTS" },
      { label: "Reminders", href: "/dashboard/reminders", icon: "clock", roles: staff },
    ],
  },
  {
    label: "My study",
    entries: [
      { label: "My applications", href: "/dashboard/my-applications", icon: "document", roles: ["STUDENT"] },
      { label: "Documents", href: "/dashboard/documents", icon: "inbox", roles: ["STUDENT"] },
      { label: "My profile", href: "/dashboard/profile", icon: "users", roles: ["STUDENT"] },
    ],
  },
  {
    label: "My agency",
    entries: [
      { label: "Get verified", href: "/dashboard/agent/onboarding", icon: "shield", roles: ["AGENT"], agent: "onboarding" },
      { label: "Leads", href: "/dashboard/agent/leads", icon: "inbox", roles: ["AGENT"], agent: "LEADS" },
      { label: "Students", href: "/dashboard/agent/students", icon: "cap", roles: ["AGENT"], agent: "approved" },
      { label: "Applications", href: "/dashboard/agent/applications", icon: "document", roles: ["AGENT"], agent: "approved" },
      { label: "Commission", href: "/dashboard/agent/commissions", icon: "coins", roles: ["AGENT"], agent: "COMMISSION" },
      { label: "Team", href: "/dashboard/agent/team", icon: "users", roles: ["AGENT"], agent: "agency-team" },
    ],
  },
  {
    label: "Students",
    entries: [
      { label: "Leads", href: "/dashboard/leads", icon: "inbox", roles: staff, module: "LEADS" },
      { label: "Students", href: "/dashboard/students", icon: "cap", roles: staff, module: "STUDENTS" },
      { label: "Applications", href: "/dashboard/applications", icon: "document", roles: staff, module: "APPLICATIONS" },
    ],
  },
  {
    label: "Agents",
    entries: [
      { label: "Agents", href: "/dashboard/agents", icon: "briefcase", roles: staff, module: "AGENTS" },
      { label: "Commission", href: "/dashboard/commissions", icon: "coins", roles: staff, module: "COMMISSIONS" },
    ],
  },
  {
    label: "Marketing",
    collapsible: true,
    entries: [
      { label: "Website analytics", href: "/dashboard/analytics", icon: "chart", roles: staff, module: "MARKETING" },
      { label: "Campaigns", href: "/dashboard/marketing/campaigns", icon: "megaphone", roles: staff, module: "MARKETING" },
      { label: "Content plan", href: "/dashboard/marketing/content", icon: "calendar", roles: staff, module: "MARKETING" },
      { label: "Social pages", href: "/dashboard/marketing/accounts", icon: "share", roles: staff, module: "MARKETING" },
    ],
  },
  {
    label: "Courses and places",
    collapsible: true,
    entries: [
      { label: "Universities", href: "/dashboard/universities", icon: "building", roles: staff, module: "CONTENT", action: "edit" },
      { label: "Subjects", href: "/dashboard/subjects", icon: "cap", roles: staff, module: "CONTENT", action: "edit" },
      { label: "Countries", href: "/dashboard/countries", icon: "globe", roles: staff, module: "CONTENT", action: "edit" },
    ],
  },
  {
    label: "Website pages",
    collapsible: true,
    entries: [
      { label: "Home slider", href: "/dashboard/slides", icon: "image", roles: staff, module: "CONTENT", action: "edit" },
      { label: "Blog", href: "/dashboard/blog", icon: "pencil", roles: staff, module: "CONTENT", action: "edit" },
      { label: "Testimonials", href: "/dashboard/testimonials", icon: "star", roles: staff, module: "CONTENT", action: "edit" },
      { label: "Partners", href: "/dashboard/partners", icon: "handshake", roles: staff, module: "CONTENT", action: "edit" },
      { label: "FAQs", href: "/dashboard/faqs", icon: "help", roles: staff, module: "CONTENT", action: "edit" },
      { label: "Offices", href: "/dashboard/offices", icon: "pin", roles: staff, module: "CONTENT", action: "edit" },
    ],
  },
  {
    label: "Admin",
    collapsible: true,
    entries: [
      { label: "Users and roles", href: "/dashboard/users", icon: "users", roles: staff, module: "USERS" },
      { label: "Site settings", href: "/dashboard/settings", icon: "settings", roles: staff, module: "SETTINGS", action: "edit" },
      { label: "Activity log", href: "/dashboard/activity", icon: "search", roles: ["ADMIN"] },
    ],
  },
  {
    label: "Account",
    entries: [{ label: "Account and security", href: "/dashboard/account", icon: "shield", roles: all }],
  },
];

export async function getDashboardNav(user: CurrentUser): Promise<NavGroup[]> {
  const result: NavGroup[] = [];
  const agentScope = user.role === "AGENT" ? await findAgentScope(user) : null;
  const onboarding = user.role === "AGENT" && !agentScope ? Boolean(await findOnboardingAgent(user)) : false;
  for (const group of groups) {
    const items: NavItem[] = [];
    for (const { roles, module, action, agent, ...item } of group.entries) {
      if (!roles.includes(user.role)) continue;
      if (agent === "onboarding" && !onboarding) continue;
      if (agent && agent !== "onboarding") {
        if (!agentScope) continue;
        if (agent === "agency-team" && (agentScope.kind !== "AGENCY" || !agentScope.can("TEAM"))) continue;
        if (agent !== "approved" && agent !== "agency-team" && !agentScope.can(agent)) continue;
      }
      // Module limits apply to staff; agents and students only ever see their own records.
      if (module && (user.role === "ADMIN" || user.role === "STAFF") && !(await can(user, module, action))) continue;
      if (item.href === "/dashboard/reminders") {
        const due = await dueReminderCount(user.id);
        items.push(due ? { ...item, badge: due } : item);
        continue;
      }
      if (item.href === "/dashboard/notifications") {
        const unread = await unreadNotificationCount(user.id);
        items.push(unread ? { ...item, badge: unread } : item);
        continue;
      }
      if (item.href === "/dashboard/messages") {
        const unread = user.role === "STUDENT" ? await studentUnreadCount(user.id) : await staffUnreadCount(user.id);
        items.push(unread ? { ...item, badge: unread } : item);
        continue;
      }
      items.push(item);
    }
    if (items.length) result.push({ label: group.label, collapsible: group.collapsible, items });
  }
  return result;
}
