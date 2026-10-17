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
import { requireAgentScope } from "@/lib/agent";
import { closedStages, stageLabels, stageTones } from "./applications/labels";
import { StaffOverview } from "./staff-overview";

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
    agents ? db.agentProfile.count({ where: { approvalStatus: "PENDING" } }) : 0,
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
      {user.role === "AGENT" && <AgentOverview />}
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
      documents: { where: { status: "REJECTED" }, select: { id: true } },
      applications: {
        where: { stage: { notIn: ["WITHDRAWN"] } },
        orderBy: { updatedAt: "desc" },
        select: { id: true, stage: true, course: { select: { name: true, university: { select: { name: true } } } } },
      },
    },
  });

  const todo = [
    { done: Boolean(student.phone && student.dateOfBirth && student.nationality), text: "Add your phone, date of birth and nationality", href: "/dashboard/profile" },
    { done: Boolean(student.passportNumber), text: "Add your passport details", href: "/dashboard/profile" },
    { done: student._count.educationRecords > 0, text: "Add your education history", href: "/dashboard/profile" },
    { done: student._count.testScores > 0, text: "Add your English test score, if you have one", href: "/dashboard/profile" },
    { done: student.documents.length === 0, text: `Upload ${student.documents.length} document${student.documents.length === 1 ? "" : "s"} again`, href: "/dashboard/documents" },
  ].filter((item) => !item.done);

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
              <Badge tone={stageTones[app.stage]}>{stageLabels[app.stage]}</Badge>
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
                <li key={item.text}>
                  <Link href={item.href} className="flex items-center gap-2 text-brand-700 hover:underline">
                    <span aria-hidden>○</span> {item.text}
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

async function AgentOverview() {
  const scope = await requireAgentScope();
  const where = scope.students;
  const [students, open, enrolled, due] = await Promise.all([
    db.studentProfile.count({ where }),
    db.application.count({ where: { student: where, stage: { notIn: closedStages } } }),
    db.application.count({ where: { student: where, stage: "ENROLLED" } }),
    // Commission is paid to the agency, so only the owner sees it.
    scope.isOwner ? db.commission.count({ where: { agentId: scope.agentId, direction: "NRC_TO_AGENT", status: "PENDING" } }) : 0,
  ]);
  const tiles = [
    { label: "Students", value: students, href: "/dashboard/agent/students" },
    { label: "Applications in progress", value: open, href: "/dashboard/agent/students" },
    { label: "Enrolled", value: enrolled, href: "/dashboard/agent/students" },
    ...(scope.isOwner ? [{ label: "Commission payments due", value: due, href: "/dashboard/agent/commissions" }] : []),
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
