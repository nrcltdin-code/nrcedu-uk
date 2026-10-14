import { activityWhere, describeAction, readActivityFilter } from "@/lib/activity";
import { csvResponse } from "@/lib/csv";
import { db } from "@/lib/db";
import type { PermissionModule } from "@/generated/prisma/client";
import { can, getCurrentUser } from "@/lib/session";
import { stageLabels } from "@/app/dashboard/applications/labels";
import { commissionStatusLabels, directionLabels } from "@/app/dashboard/commissions/labels";
import { leadSourceLabels, leadStatusLabels, studyLevelLabels } from "@/app/dashboard/leads/labels";

// CSV downloads for staff. Each needs view access to its area (the activity log: admins only),
// and every download is written to the activity log, since it takes personal data off the site.
// Passport numbers are left out on purpose.

const MAX_ROWS = 20_000;
const modules: Record<string, PermissionModule | "ADMIN"> = {
  leads: "LEADS",
  students: "STUDENTS",
  applications: "APPLICATIONS",
  commissions: "COMMISSIONS",
  activity: "ADMIN",
};

export async function GET(request: Request, { params }: RouteContext<"/api/export/[kind]">) {
  const { kind } = await params;
  const area = modules[kind];
  if (!area) return new Response("Not found.", { status: 404 });

  const user = await getCurrentUser();
  if (!user) return new Response("Please sign in.", { status: 401 });
  const allowed = area === "ADMIN" ? user.role === "ADMIN" : await can(user, area, "view");
  if (!allowed) return new Response("Not found.", { status: 404 });

  const response = await build(kind, new URL(request.url).searchParams);
  await db.activityLog.create({ data: { userId: user.id, action: `export.${kind}`, entityType: "Export", entityId: null } });
  return response;
}

async function build(kind: string, search: URLSearchParams) {
  switch (kind) {
    case "leads": {
      const rows = await db.lead.findMany({
        orderBy: { createdAt: "desc" },
        take: MAX_ROWS,
        include: {
          country: { select: { name: true } },
          destination: { select: { name: true } },
          assignedStaff: { select: { name: true } },
          assignedAgent: { select: { user: { select: { name: true } } } },
        },
      });
      return csvResponse(
        "leads",
        ["Received", "Name", "Email", "Phone", "Lives in", "Wants to study in", "Level", "Source", "Status", "Counsellor", "Agent", "Message"],
        rows.map((l) => [
          l.createdAt, l.name, l.email, l.phone, l.country?.name, l.destination?.name, l.studyLevel && studyLevelLabels[l.studyLevel],
          leadSourceLabels[l.source], leadStatusLabels[l.status], l.assignedStaff?.name, l.assignedAgent?.user.name, l.message,
        ]),
      );
    }
    case "students": {
      const rows = await db.studentProfile.findMany({
        orderBy: { createdAt: "desc" },
        take: MAX_ROWS,
        include: {
          user: { select: { name: true, email: true } },
          country: { select: { name: true } },
          counsellor: { select: { name: true } },
          agent: { select: { user: { select: { name: true } } } },
          _count: { select: { applications: true } },
        },
      });
      return csvResponse(
        "students",
        ["Added", "Name", "Email", "Phone", "Country", "Nationality", "Date of birth", "Counsellor", "Agent", "Applications"],
        rows.map((s) => [
          s.createdAt, s.user.name, s.user.email, s.phone, s.country?.name, s.nationality, s.dateOfBirth?.toISOString().slice(0, 10),
          s.counsellor?.name, s.agent?.user.name, s._count.applications,
        ]),
      );
    }
    case "applications": {
      const rows = await db.application.findMany({
        orderBy: { createdAt: "desc" },
        take: MAX_ROWS,
        include: {
          student: { select: { user: { select: { name: true, email: true } } } },
          course: { select: { name: true, university: { select: { name: true } } } },
          intake: { select: { name: true } },
          assignedStaff: { select: { name: true } },
          agent: { select: { user: { select: { name: true } } } },
        },
      });
      return csvResponse(
        "applications",
        ["Started", "Last update", "Student", "Student email", "University", "Course", "Intake", "Stage", "Handled by", "Agent"],
        rows.map((a) => [
          a.createdAt, a.updatedAt, a.student.user.name, a.student.user.email, a.course.university.name, a.course.name, a.intake?.name,
          stageLabels[a.stage], a.assignedStaff?.name, a.agent?.user.name,
        ]),
      );
    }
    case "commissions": {
      const rows = await db.commission.findMany({
        orderBy: { createdAt: "desc" },
        take: MAX_ROWS,
        include: {
          agent: { select: { user: { select: { name: true } } } },
          application: { select: { student: { select: { user: { select: { name: true } } } }, course: { select: { name: true, university: { select: { name: true } } } } } },
        },
      });
      return csvResponse(
        "commission",
        ["Added", "Direction", "Student", "University", "Course", "Agent", "Rate %", "Amount", "Currency", "Status", "Settled on", "Note"],
        rows.map((c) => [
          c.createdAt, directionLabels[c.direction], c.application.student.user.name, c.application.course.university.name, c.application.course.name,
          c.agent?.user.name, c.ratePercent?.toString(), c.amount.toString(), c.currency, commissionStatusLabels[c.direction][c.status],
          c.settledAt?.toISOString().slice(0, 10), c.note,
        ]),
      );
    }
    default: {
      const filter = readActivityFilter(Object.fromEntries(search));
      const rows = await db.activityLog.findMany({
        where: activityWhere(filter),
        orderBy: { createdAt: "desc" },
        take: MAX_ROWS,
        include: { user: { select: { name: true, email: true } } },
      });
      return csvResponse(
        "activity",
        ["When (UTC)", "Who", "Email", "Did", "Area", "Record id", "Details"],
        rows.map((r) => [r.createdAt, r.user?.name ?? "Someone", r.user?.email, describeAction(r.action), r.entityType, r.entityId, r.meta ? JSON.stringify(r.meta) : ""]),
      );
    }
  }
}
