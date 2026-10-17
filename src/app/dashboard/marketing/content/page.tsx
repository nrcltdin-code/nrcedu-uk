import type { Metadata } from "next";
import { Suspense } from "react";
import Link from "next/link";
import { DeleteButton } from "@/components/dashboard/form-bits";
import { PageHeader } from "@/components/dashboard/page-header";
import { Badge } from "@/components/ui/badge";
import { buttonStyles } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/cn";
import { db } from "@/lib/db";
import { can, requirePermission } from "@/lib/session";
import { deletePost } from "../actions";
import { PostForm } from "../forms";
import { dateValue, platformLabels, postStatusLabels, postStatusTones } from "../labels";

export const metadata: Metadata = { title: "Content plan", robots: { index: false } };

const monthName = new Intl.DateTimeFormat("en-GB", { month: "long", year: "numeric", timeZone: "UTC" });
const dayName = new Intl.DateTimeFormat("en-GB", { weekday: "short", day: "numeric", month: "short", timeZone: "UTC" });

export default function ContentPlanPage({ searchParams }: PageProps<"/dashboard/marketing/content">) {
  return (
    <>
      <PageHeader title="Content plan" description="Every planned post, month by month, from idea through design to posted." />
      <Suspense fallback={<Card tone="solid">Loading…</Card>}>
        <ContentPlan searchParams={searchParams} />
      </Suspense>
    </>
  );
}

async function ContentPlan({ searchParams }: Pick<PageProps<"/dashboard/marketing/content">, "searchParams">) {
  const user = await requirePermission("MARKETING", "view");
  const canEdit = await can(user, "MARKETING", "edit");
  const params = await searchParams;
  const one = (key: string) => (typeof params[key] === "string" ? (params[key] as string) : "");

  // ?month=YYYY-MM, this month by default.
  const now = new Date();
  const [year, month] = /^\d{4}-\d{2}$/.test(one("month"))
    ? one("month").split("-").map(Number)
    : [now.getUTCFullYear(), now.getUTCMonth() + 1];
  const start = new Date(Date.UTC(year, month - 1, 1));
  const end = new Date(Date.UTC(year, month, 1));
  const key = (date: Date) => date.toISOString().slice(0, 7);
  const previous = key(new Date(Date.UTC(year, month - 2, 1)));
  const next = key(end);

  const [posts, campaigns, editing] = await Promise.all([
    db.contentPost.findMany({
      where: { publishOn: { gte: start, lt: end } },
      orderBy: [{ publishOn: "asc" }, { createdAt: "asc" }],
      include: { campaign: { select: { name: true } } },
    }),
    canEdit ? db.campaign.findMany({ where: { status: { notIn: ["DONE", "CANCELLED"] } }, orderBy: { name: "asc" }, select: { id: true, name: true } }) : [],
    canEdit && one("edit") ? db.contentPost.findUnique({ where: { id: one("edit") } }) : null,
  ]);

  const days = new Map<string, typeof posts>();
  for (const post of posts) {
    const day = dateValue(post.publishOn);
    days.set(day, [...(days.get(day) ?? []), post]);
  }
  const counts = Object.keys(postStatusLabels).map((status) => ({ status, n: posts.filter((p) => p.status === status).length }));

  return (
    <div className={cn("grid items-start gap-8", canEdit && "lg:grid-cols-[1.3fr_1fr]")}>
      <div className="grid gap-4">
        <div className="flex flex-wrap items-center gap-2">
          <Link href={`?month=${previous}`} className={buttonStyles({ variant: "glass", size: "sm" })} aria-label="Previous month">←</Link>
          <h2 className="min-w-44 text-center font-display text-lg font-bold">{monthName.format(start)}</h2>
          <Link href={`?month=${next}`} className={buttonStyles({ variant: "glass", size: "sm" })} aria-label="Next month">→</Link>
          <span className="ml-auto flex flex-wrap gap-1.5">
            {counts.map(({ status, n }) => (
              <Badge key={status} tone={postStatusTones[status as keyof typeof postStatusTones]}>
                {postStatusLabels[status as keyof typeof postStatusLabels]}: {n}
              </Badge>
            ))}
          </span>
        </div>

        {days.size === 0 && <Card tone="solid">Nothing planned for this month yet.</Card>}
        {[...days].map(([day, items]) => (
          <section key={day}>
            <h3 className="mb-2 text-sm font-semibold text-muted">{dayName.format(new Date(`${day}T00:00:00Z`))}</h3>
            <ul className="grid gap-3">
              {items.map((post) => (
                <li key={post.id}>
                  <Card tone="solid" className="p-4">
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge tone="neutral">{platformLabels[post.platform]}</Badge>
                      <h4 className="font-semibold">{post.title}</h4>
                      <Badge tone={postStatusTones[post.status]}>{postStatusLabels[post.status]}</Badge>
                    </div>
                    <p className="mt-1 text-sm text-muted">
                      {[post.campaign?.name && `Campaign: ${post.campaign.name}`, post.assignee].filter(Boolean).join(" · ")}
                    </p>
                    {post.caption && <p className="mt-2 line-clamp-3 whitespace-pre-line text-sm">{post.caption}</p>}
                    <div className="mt-2 flex flex-wrap items-center gap-1">
                      {post.designUrl && <a href={post.designUrl} target="_blank" rel="noreferrer" className={buttonStyles({ variant: "ghost", size: "sm" })}>Design</a>}
                      {post.postUrl && <a href={post.postUrl} target="_blank" rel="noreferrer" className={buttonStyles({ variant: "ghost", size: "sm" })}>Live post</a>}
                      {canEdit && (
                        <>
                          <Link href={`?month=${key(start)}&edit=${post.id}`} className={buttonStyles({ variant: "glass", size: "sm" })}>Edit</Link>
                          <DeleteButton action={deletePost.bind(null, post.id)} question="Delete this post from the plan?" />
                        </>
                      )}
                    </div>
                  </Card>
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>

      {canEdit && (
        <Card tone="solid">
          <h2 className="mb-4 text-xl font-bold">{editing ? "Edit post" : "Plan a post"}</h2>
          <PostForm key={editing?.id ?? "new"} post={editing && { ...editing, publishOn: dateValue(editing.publishOn) }} campaigns={campaigns} />
        </Card>
      )}
    </div>
  );
}
