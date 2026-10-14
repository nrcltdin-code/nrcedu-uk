import type { Metadata } from "next";
import { Suspense } from "react";
import Link from "next/link";
import { PageHeader } from "@/components/dashboard/page-header";
import { Badge } from "@/components/ui/badge";
import { Button, buttonStyles } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input, Select } from "@/components/ui/field";
import { db } from "@/lib/db";
import { formatDate } from "@/lib/format";
import { requirePermission } from "@/lib/session";
import type { Prisma } from "@/generated/prisma/client";

export const metadata: Metadata = { title: "Blog", robots: { index: false } };

const first = (value: string | string[] | undefined) => (Array.isArray(value) ? value[0] : value) ?? "";
const pageSize = 20;

export default function BlogAdminPage({ searchParams }: PageProps<"/dashboard/blog">) {
  return (
    <>
      <PageHeader
        title="Blog"
        description="Articles for the blog. Drafts stay off the website until published."
        actions={<Link href="/dashboard/blog/new" className={buttonStyles()}>Write a post</Link>}
      />
      <Suspense fallback={<Card tone="solid">Loading posts…</Card>}>
        <PostList searchParams={searchParams} />
      </Suspense>
    </>
  );
}

async function PostList({ searchParams }: Pick<PageProps<"/dashboard/blog">, "searchParams">) {
  await requirePermission("CONTENT", "edit");

  const params = await searchParams;
  const q = first(params.q).trim();
  const status = first(params.status);
  const page = Math.max(1, Number.parseInt(first(params.page) || "1", 10) || 1);

  const where: Prisma.BlogPostWhereInput = {
    ...(status === "DRAFT" || status === "PUBLISHED" ? { status } : {}),
    ...(q ? { title: { contains: q, mode: "insensitive" } } : {}),
  };
  const [posts, total] = await Promise.all([
    db.blogPost.findMany({
      where,
      orderBy: { updatedAt: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
      select: { id: true, title: true, status: true, publishedAt: true, updatedAt: true, author: { select: { name: true } } },
    }),
    db.blogPost.count({ where }),
  ]);
  const pages = Math.max(1, Math.ceil(total / pageSize));
  const pageHref = (n: number) => `/dashboard/blog?${new URLSearchParams({ q, status, page: String(n) })}`;

  return (
    <Card tone="solid">
      <form className="grid gap-3 sm:grid-cols-[1fr_auto_auto]">
        <Input name="q" defaultValue={q} placeholder="Search titles" aria-label="Search" />
        <Select name="status" defaultValue={status} aria-label="Status">
          <option value="">All posts</option>
          <option value="PUBLISHED">Published</option>
          <option value="DRAFT">Drafts</option>
        </Select>
        <Button type="submit" variant="glass">Filter</Button>
      </form>

      <ul className="mt-4 divide-y divide-brand-900/10">
        {posts.length === 0 && <li className="py-3 text-muted">No posts match.</li>}
        {posts.map((post) => (
          <li key={post.id}>
            <Link href={`/dashboard/blog/${post.id}`} className="flex flex-wrap items-center justify-between gap-3 rounded-xl px-2 py-3 hover:bg-brand-600/5">
              <span className="min-w-0">
                <span className="block font-semibold">{post.title}</span>
                <span className="block text-sm text-muted">
                  {post.status === "PUBLISHED" && post.publishedAt ? `Published ${formatDate(post.publishedAt)}` : `Edited ${formatDate(post.updatedAt)}`}
                  {post.author && ` · ${post.author.name}`}
                </span>
              </span>
              <Badge tone={post.status === "PUBLISHED" ? "success" : "neutral"}>{post.status === "PUBLISHED" ? "Published" : "Draft"}</Badge>
            </Link>
          </li>
        ))}
      </ul>

      {pages > 1 && (
        <div className="mt-4 flex items-center justify-between text-sm">
          {page > 1 ? <Link href={pageHref(page - 1)} className={buttonStyles({ variant: "ghost", size: "sm" })}>← Previous</Link> : <span />}
          <span className="text-muted">Page {page} of {pages}</span>
          {page < pages ? <Link href={pageHref(page + 1)} className={buttonStyles({ variant: "ghost", size: "sm" })}>Next →</Link> : <span />}
        </div>
      )}
    </Card>
  );
}
