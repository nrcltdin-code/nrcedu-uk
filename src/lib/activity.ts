import type { Prisma } from "@/generated/prisma/client";

// Plain-language text for activity log entries, shared by the overview and the Activity log.

export const activityText: Record<string, string> = {
  "lead.create": "added a lead",
  "lead.update": "updated a lead",
  "lead.delete": "deleted a lead",
  "routing.update": "changed lead routing",
  "student.create": "added a student",
  "student.update": "updated a student",
  "student.invite": "made a portal invite",
  "student.password-set": "set their portal password",
  "application.create": "started an application",
  "application.assign": "reassigned an application",
  "application.delete": "deleted an application",
  "document.upload": "uploaded a document",
  "document.approved": "approved a document",
  "document.rejected": "asked for a document again",
  "document.delete": "deleted a document",
  "request.created": "asked a student for a document",
  "request.opened": "opened a document upload",
  "request.closed": "closed a document upload",
  "request.waived": "marked a document not needed",
  "request.deleted": "removed a document request",
  "whatsapp.open": "opened a WhatsApp chat with a student",
  "commission.create": "added commission",
  "commission.update": "updated commission",
  "settings.update": "changed site settings",
  "user.created": "added a staff account",
  "user.access": "changed a user's role or status",
  "user.permissions": "changed a staff member's access",
  "agent.approved": "approved an agent",
  "agent.team-add": "added a team member",
  "agent.team-invite": "made a team member invite",
  "agent.team-status": "changed a team member's access",
  "agent.rejected": "rejected an agent",
  "export.leads": "downloaded leads (CSV)",
  "export.students": "downloaded students (CSV)",
  "export.applications": "downloaded applications (CSV)",
  "export.commissions": "downloaded commission (CSV)",
  "export.activity": "downloaded the activity log (CSV)",
  "auth.sign-in": "signed in",
  "campaign.create": "added a marketing campaign",
  "campaign.update": "updated a marketing campaign",
  "campaign.delete": "deleted a marketing campaign",
  "social-account.create": "added a social media page",
  "social-account.update": "updated a social media page",
  "social-account.delete": "removed a social media page",
  "social-account.reveal": "viewed a social media password",
};

export const describeAction = (action: string) => activityText[action] ?? action;

// Areas for the Activity log filter.
export const activityAreas: Record<string, string> = {
  Lead: "Leads",
  StudentProfile: "Students",
  Application: "Applications",
  Document: "Documents",
  DocumentRequest: "Document requests",
  Commission: "Commission",
  User: "Users",
  SiteSetting: "Settings",
  Country: "Lead routing",
  Export: "Downloads",
  Session: "Sign-ins",
};

const pages: Record<string, string> = {
  Lead: "/dashboard/leads/",
  StudentProfile: "/dashboard/students/",
  Application: "/dashboard/applications/",
  User: "/dashboard/users/",
};

export const activityHref = (entityType: string, entityId: string | null) =>
  entityId && pages[entityType] ? pages[entityType] + entityId : null;

export type ActivityFilter = { who: string; area: string; from: string; to: string };

const day = (value: string) => (/^\d{4}-\d{2}-\d{2}$/.test(value) ? new Date(`${value}T00:00:00Z`) : null);

// Filters from the Activity log page's address, also used by its CSV download. Dates are whole
// days (UTC); "to" includes that day.
export function readActivityFilter(params: Record<string, string | string[] | undefined>): ActivityFilter {
  const get = (key: string) => {
    const value = params[key];
    return ((Array.isArray(value) ? value[0] : value) ?? "").trim();
  };
  return { who: get("who"), area: Object.hasOwn(activityAreas, get("area")) ? get("area") : "", from: get("from"), to: get("to") };
}

export function activityWhere(filter: ActivityFilter): Prisma.ActivityLogWhereInput {
  const from = day(filter.from);
  const to = day(filter.to);
  return {
    action: { not: "document.start" },
    ...(filter.who ? { userId: filter.who } : {}),
    ...(filter.area ? { entityType: filter.area } : {}),
    ...(from || to ? { createdAt: { ...(from ? { gte: from } : {}), ...(to ? { lt: new Date(to.getTime() + 86_400_000) } : {}) } } : {}),
  };
}
