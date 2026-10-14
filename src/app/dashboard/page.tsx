import type { Metadata } from "next";
import { Suspense } from "react";
import Link from "next/link";
import { PageHeader } from "@/components/dashboard/page-header";
import { Card } from "@/components/ui/card";
import { IconTile } from "@/components/ui/icon";
import type { IconName, TileColor } from "@/components/ui/icon";
import { db } from "@/lib/db";
import { can, requireUser } from "@/lib/session";
import type { CurrentUser } from "@/lib/session";

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
  const stats: Stat[] = [];

  if (await can(user, "LEADS")) {
    stats.push({ label: "New leads", value: await db.lead.count({ where: { status: "NEW" } }), icon: "inbox", color: "sky" });
  }
  if (await can(user, "AGENTS", "edit")) {
    const pending = await db.agentProfile.count({ where: { approvalStatus: "PENDING" } });
    stats.push({ label: "Agents waiting for approval", value: pending, icon: "briefcase", color: "amber", href: "/dashboard/agents" });
  }
  if (await can(user, "USERS")) {
    const students = await db.user.count({ where: { role: "STUDENT", status: "ACTIVE" } });
    stats.push({ label: "Registered students", value: students, icon: "cap", color: "violet", href: "/dashboard/users?role=STUDENT" });
  }
  if (await can(user, "CONTENT", "edit")) {
    const slides = await db.heroSlide.count({ where: { isPublished: true } });
    stats.push({ label: "Slides on the home page", value: slides, icon: "image", color: "emerald", href: "/dashboard/slides" });
  }
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

      {(user.role === "STUDENT" || user.role === "AGENT") && (
        <Card tone="solid" className="max-w-2xl">
          <h2 className="text-xl font-bold">{user.role === "STUDENT" ? "Your applications" : "Your students"}</h2>
          <p className="mt-2 text-muted">
            {user.role === "STUDENT"
              ? "Your profile, documents and application progress will appear here soon."
              : "Your referred students, their applications and your commission will appear here soon."}
          </p>
        </Card>
      )}
    </>
  );
}
