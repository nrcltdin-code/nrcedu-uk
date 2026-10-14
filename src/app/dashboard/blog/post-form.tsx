"use client";

import { useActionState } from "react";
import { FormMessage } from "@/components/dashboard/form-bits";
import { ImageField } from "@/components/dashboard/image-field";
import { MarkdownEditor } from "@/components/dashboard/markdown-editor";
import { Button } from "@/components/ui/button";
import { Input, Label, Textarea } from "@/components/ui/field";
import type { FormState } from "@/lib/form";
import { savePost } from "./actions";

export type PostValues = {
  id: string;
  title: string;
  slug: string;
  excerpt: string | null;
  coverUrl: string | null;
  content: string;
  status: "DRAFT" | "PUBLISHED";
};

export function PostForm({ post }: { post: PostValues | null }) {
  const [state, action, pending] = useActionState<FormState, FormData>(savePost, {});
  const live = post?.status === "PUBLISHED";

  return (
    <form action={action} className="grid items-start gap-6 xl:grid-cols-[1fr_20rem]">
      {post && <input type="hidden" name="id" value={post.id} />}

      <div className="grid gap-4">
        <div>
          <Label htmlFor="post-title">Title</Label>
          <Input id="post-title" name="title" defaultValue={post?.title} maxLength={200} required className="h-12 text-base font-semibold" />
        </div>
        <div>
          <Label htmlFor="post-content">Article</Label>
          <MarkdownEditor id="post-content" name="content" defaultValue={post?.content} required maxLength={100_000} />
        </div>
      </div>

      <div className="grid gap-4 xl:sticky xl:top-20">
        <div>
          <Label htmlFor="post-excerpt">Summary</Label>
          <Textarea id="post-excerpt" name="excerpt" defaultValue={post?.excerpt ?? ""} maxLength={300} placeholder="One or two sentences for the blog list and search results" />
        </div>
        <div>
          <Label htmlFor="post-slug">Web address</Label>
          <Input id="post-slug" name="slug" defaultValue={post?.slug} placeholder="Made from the title if left empty" />
          <p className="mt-1.5 text-xs text-muted">Shown as /blog/<em>address</em>. Changing it after publishing breaks old links.</p>
        </div>
        <ImageField name="coverUrl" label="Cover image" defaultValue={post?.coverUrl} />

        <FormMessage state={state} />
        <div className="flex flex-wrap gap-2">
          <Button type="submit" name="intent" value="publish" disabled={pending}>
            {pending ? "Saving…" : live ? "Update" : "Publish"}
          </Button>
          <Button type="submit" name="intent" value="draft" variant="glass" disabled={pending}>
            {live ? "Unpublish" : "Save draft"}
          </Button>
        </div>
      </div>
    </form>
  );
}
