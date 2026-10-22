import type { Metadata } from "next";
import { Suspense } from "react";
import Link from "next/link";
import { PageHeader } from "@/components/dashboard/page-header";
import { Badge } from "@/components/ui/badge";
import { buttonStyles } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { IconTile } from "@/components/ui/icon";
import type { IconName, TileColor } from "@/components/ui/icon";
import { db } from "@/lib/db";
import { can, requireUser } from "@/lib/session";
import type { CurrentUser } from "@/lib/session";
import { requireMyStudentId } from "@/lib/student";
import { redirect } from "next/navigation";
import { findAgentScope, findOnboardingAgent } from "@/lib/agent";
import { closedStages, stageTones } from "./applications/labels";
import { StaffOverview } from "./staff-overview";
import { stageLabel } from "@/lib/application-flow";
import { formatDate } from "@/lib/format";

export const metadata: Metadata = { title: "Dashboard", robots: { index: false } };

export default function DashboardPage() {
  return (
    <Suspense fallback={<Card tone="solid">Loading your dashboard…</Card>}>
      <Overview />
    </Suspense>
  );
}

type Stat = { label: string; value: number; icon: IconName; color: TileColor; href?: string };

async function getStats(user: CurrentUser): Promise<Stat[]> {
  const [leads, students, applications, agents] = await Promise.all([
    can(user, "LEADS"),
    can(user, "STUDENTS"),
    can(user, "APPLICATIONS"),
    can(user, "AGENTS", "edit"),
  ]);
  const [newLeads, toReview, openApps, waitingAgents] = await Promise.all([
    leads ? db.lead.count({ where: { status: "NEW" } }) : 0,
    students ? db.document.count({ where: { status: "PENDING" } }) : 0,
    applications ? db.application.count({ where: { stage: { notIn: closedStages } } }) : 0,
    agents ? db.agentProfile.count({ where: { approvalStatus: "PENDING", submittedAt: { not: null } } }) : 0,
  ]);

  const stats: Stat[] = [];
  if (leads) stats.push({ label: "New leads", value: newLeads, icon: "inbox", color: "sky", href: "/dashboard/leads?tab=NEW" });
  if (applications) stats.push({ label: "Open applications", value: openApps, icon: "document", color: "violet", href: "/dashboard/applications" });
  if (students) stats.push({ label: "Documents to review", value: toReview, icon: "shield", color: "emerald", href: "/dashboard/students?docs=pending" });
  if (agents) stats.push({ label: "Agents waiting for approval", value: waitingAgents, icon: "briefcase", color: "amber", href: "/dashboard/agents" });
  return stats;
}

async function Overview() {
  const user = await requireUser();
  // Agents finish onboarding (profile and verification documents) before anything else.
  if (user.role === "AGENT" && (await findOnboardingAgent(user))) redirect("/dashboard/agent/onboarding");
  const stats = await getStats(user);
  const firstName = user.name.split(" ")[0];

  return (
    <>
      <PageHeader title={`Welcome, ${firstName}`} description="Here is what is happening today." />

      {stats.length > 0 && (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {stats.map((stat) => {
            const body = (
              <Card tone="solid" className="flex h-full items-center gap-4 p-5">
                <IconTile name={stat.icon} color={stat.color} />
                <div>
                  <p className="font-display text-3xl font-bold">{stat.value}</p>
                  <p className="text-sm text-muted">{stat.label}</p>
                </div>
              </Card>
            );
            return stat.href ? (
              <Link key={stat.label} href={stat.href} className="rounded-3xl transition hover:-translate-y-0.5">
                {body}
              </Link>
            ) : (
              <div key={stat.label}>{body}</div>
            );
          })}
        </div>
      )}

      {(user.role === "ADMIN" || user.role === "STAFF") && <StaffOverview user={user} />}
      {user.role === "STUDENT" && <StudentOverview />}
      {user.role === "AGENT" && <AgentOverview user={user} />}
    </>
  );
}

// A student's home: what is missing, what needs redoing and where each application is.
async function StudentOverview() {
  const studentId = await requireMyStudentId();
  const student = await db.studentProfile.findUniqueOrThrow({
    where: { id: studentId },
    select: {
      phone: true,
      dateOfBirth: true,
      nationality: true,
      passportNumber: true,
      counsellor: { select: { name: true, email: true } },
      _count: { select: { educationRecords: true, testScores: true } },
      // Requests the student can act on now: open for upload and waiting on them.
      documentRequests: {
        where: { isOpen: true, status: { in: ["REQUESTED", "NEEDS_REUPLOAD"] } },
        orderBy: [{ dueAt: { sort: "asc", nulls: "last" } }, { createdAt: "asc" }],
        select: { id: true, label: true, status: true, required: true, dueAt: true, application: { select: { course: { select: { university: { select: { name: true } } } } } } },
      },
      applications: {
        where: { stage: { notIn: ["WITHDRAWN"] } },
        orderBy: { updatedAt: "desc" },
        select: {
          id: true,
          stage: true,
          course: { select: { name: true, university: { select: { name: true, confirmationName: true } } } },
          conditions: { where: { metAt: null }, orderBy: { createdAt: "asc" }, select: { id: true, text: true } },
        },
      },
    },
  });

  const now = new Date();
  type Todo = { key: string; text: string; detail?: string; href: string; urgent?: boolean };
  const todo: Todo[] = [];
  for (const r of student.documentRequests) {
    const overdue = r.dueAt ? r.dueAt < now : false;
    todo.push({
      key: `req-${r.id}`,
      text: `${r.status === "NEEDS_REUPLOAD" ? "Upload again" : "Upload"}: ${r.label}${r.required ? "" : " (optional)"}`,
      detail: [r.application?.course.university.name, r.dueAt && `${overdue ? "was due" : "due"} ${formatDate(r.dueAt)}`].filter(Boolean).join(" · ") || undefined,
      href: "/dashboard/documents",
      urgent: r.status === "NEEDS_REUPLOAD" || overdue,
    });
  }
  for (const app of student.applications) {
    for (const c of app.conditions) {
      todo.push({ key: `cond-${c.id}`, text: `Offer condition: ${c.text}`, detail: app.course.university.name, href: "/dashboard/my-applications" });
    }
  }
  const profileSteps = [
    { done: Boolean(student.phone && student.dateOfBirth && student.nationality), text: "Add your phone, date of birth and nationality" },
    { done: Boolean(student.passportNumber), text: "Add your passport details" },
    { done: student._count.educationRecords > 0, text: "Add your education history" },
    { done: student._count.testScores > 0, text: "Add your English test score, if you have one" },
  ];
  for (const step of profileSteps) if (!step.done) todo.push({ key: step.text, text: step.text, href: "/dashboard/profile" });

  return (
    <div className="grid items-start gap-6 lg:grid-cols-2">
      <Card tone="solid">
        <h2 className="text-xl font-bold">Your applications</h2>
        <ul className="mt-3 divide-y divide-brand-900/10">
          {student.applications.map((app) => (
            <li key={app.id} className="flex flex-wrap items-center justify-between gap-2 py-3">
              <span className="min-w-0">
                <span className="block font-semibold">{app.course.name}</span>
                <span className="block text-sm text-muted">{app.course.university.name}</span>
              </span>
              <Badge tone={stageTones[app.stage]}>{stageLabel(app.stage, app.course.university.confirmationName)}</Badge>
            </li>
          ))}
          {student.applications.length === 0 && <li className="py-2 text-muted">None yet. Find a course and press Apply on its page.</li>}
        </ul>
        <Link href={student.applications.length ? "/dashboard/my-applications" : "/universities"} className={buttonStyles({ variant: "glass", size: "sm", className: "mt-3" })}>
          {student.applications.length ? "See progress" : "Browse universities"}
        </Link>
      </Card>

      <div className="grid gap-6">
        <Card tone="solid">
          <h2 className="text-xl font-bold">{todo.length ? "To do" : "All set"}</h2>
          {todo.length ? (
            <ul className="mt-3 grid gap-2">
              {todo.map((item) => (
                <li key={item.key}>
                  <Link href={item.href} className={`flex items-start gap-2 hover:underline ${item.urgent ? "text-red-800" : "text-brand-700"}`}>
                    <span aria-hidden>{item.urgent ? "!" : "○"}</span>
                    <span>
                      {item.text}
                      {item.detail && <span className="block text-xs text-muted">{item.detail}</span>}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-2 text-muted">Your profile is complete. Your counsellor will contact you about next steps.</p>
          )}
        </Card>
        <Card tone="solid">
          <h2 className="text-xl font-bold">Your counsellor</h2>
          {student.counsellor ? (
            <p className="mt-2">
              {student.counsellor.name} ·{" "}
              <a href={`mailto:${student.counsellor.email}`} className="text-brand-700 hover:underline">{student.counsellor.email}</a>
            </p>
          ) : (
            <p className="mt-2 text-muted">A counsellor will be assigned to you soon.</p>
          )}
        </Card>
      </div>
    </div>
  );
}

async function AgentOverview({ user }: { user: CurrentUser }) {
  const scope = await findAgentScope(user);
  if (!scope) {
    return <Card tone="solid">Your agency&apos;s account is not active right now. Contact the agency owner or NRC.</Card>;
  }
  const now = new Date();
  const [students, open, enrolled, due, newLeads, followUps] = await Promise.all([
    db.studentProfile.count({ where: scope.students }),
    db.application.count({ where: { ...scope.applications, stage: { notIn: closedStages } } }),
    db.application.count({ where: { ...scope.applications, stage: "ENROLLED" } }),
    scope.can("COMMISSION") ? db.commission.count({ where: { agentId: scope.agentId, direction: "NRC_TO_AGENT", status: "PENDING" } }) : 0,
    scope.can("LEADS") ? db.lead.count({ where: { ...scope.leads, status: "NEW" } }) : 0,
    scope.can("LEADS") ? db.lead.count({ where: { ...scope.leads, status: { notIn: ["CONVERTED", "LOST"] }, followUpAt: { lte: now } } }) : 0,
  ]);
  const tiles = [
    ...(scope.can("LEADS")
      ? [
          { label: "New leads", value: newLeads, href: "/dashboard/agent/leads?status=NEW" },
          { label: "Follow-ups due", value: followUps, href: "/dashboard/agent/leads?due=1" },
        ]
      : []),
    { label: "Students", value: students, href: "/dashboard/agent/students" },
    { label: "Applications in progress", value: open, href: "/dashboard/agent/applications" },
    { label: "Enrolled", value: enrolled, href: "/dashboard/agent/applications?status=ENROLLED" },
    ...(scope.can("COMMISSION") ? [{ label: "Commission payments due", value: due, href: "/dashboard/agent/commissions" }] : []),
  ];
  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {tiles.map((tile) => (
        <Link key={tile.label} href={tile.href} className="rounded-3xl transition hover:-translate-y-0.5">
          <Card tone="solid" className="h-full p-5">
            <p className="font-display text-3xl font-bold">{tile.value}</p>
            <p className="text-sm text-muted">{tile.label}</p>
          </Card>
        </Link>
      ))}
    </div>
  );
}
