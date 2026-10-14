import type { Metadata } from "next";
import { Suspense } from "react";
import { PageHeader } from "@/components/dashboard/page-header";
import { Card } from "@/components/ui/card";
import { requirePermission } from "@/lib/session";
import { PostForm } from "../post-form";

export const metadata: Metadata = { title: "Write a post", robots: { index: false } };

export default function NewPostPage() {
  return (
    <>
      <PageHeader title="Write a post" back={{ href: "/dashboard/blog", label: "Blog" }} />
      <Suspense fallback={<Card tone="solid">Loading…</Card>}>
        <NewPost />
      </Suspense>
    </>
  );
}

async function NewPost() {
  await requirePermission("CONTENT", "edit");
  return (
    <Card tone="solid">
      <PostForm post={null} />
    </Card>
  );
}
