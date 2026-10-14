import type { Metadata } from "next";
import { Suspense } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { DeleteButton } from "@/components/dashboard/form-bits";
import { PageHeader } from "@/components/dashboard/page-header";
import { Badge } from "@/components/ui/badge";
import { buttonStyles } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { db } from "@/lib/db";
import { requirePermission } from "@/lib/session";
import { deletePost } from "../actions";
import { PostForm } from "../post-form";

export const metadata: Metadata = { title: "Edit post", robots: { index: false } };

export default function EditPostPage({ params }: PageProps<"/dashboard/blog/[id]">) {
  return (
    <Suspense fallback={<Card tone="solid">Loading…</Card>}>
      <EditPost params={params} />
    </Suspense>
  );
}

async function EditPost({ params }: Pick<PageProps<"/dashboard/blog/[id]">, "params">) {
  await requirePermission("CONTENT", "edit");

  const { id } = await params;
  const post = await db.blogPost.findUnique({
    where: { id },
    select: { id: true, title: true, slug: true, excerpt: true, coverUrl: true, content: true, status: true },
  });
  if (!post) notFound();
  const live = post.status === "PUBLISHED";

  return (
    <>
      <PageHeader
        title={
          <span className="flex flex-wrap items-center gap-3">
            Edit post <Badge tone={live ? "success" : "neutral"}>{live ? "Published" : "Draft"}</Badge>
          </span>
        }
        back={{ href: "/dashboard/blog", label: "Blog" }}
        actions={
          <div className="flex items-center gap-2">
            {live && (
              <Link href={`/blog/${post.slug}`} target="_blank" className={buttonStyles({ variant: "glass", size: "sm" })}>
                View on website
              </Link>
            )}
            <DeleteButton action={deletePost.bind(null, post.id)} question="Delete this post for good?" />
          </div>
        }
      />
      <Card tone="solid">
        {/* key remounts the form after a save changes the status, so the buttons update. */}
        <PostForm key={post.status} post={post} />
      </Card>
    </>
  );
}
