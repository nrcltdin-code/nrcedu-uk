import type { Metadata } from "next";
import { Suspense } from "react";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { CtaBand } from "@/components/site/cta-band";
import { Prose } from "@/components/site/prose";
import { Card } from "@/components/ui/card";
import { Icon } from "@/components/ui/icon";
import { Container } from "@/components/ui/section";
import { getPost, getPostSlugs } from "@/lib/data/content";
import { formatDate } from "@/lib/format";
import { absoluteUrl, breadcrumbLd, defaultImage, pageMetadata, publisherLd } from "@/lib/seo";
import { JsonLd } from "@/components/site/json-ld";

type Props = PageProps<"/blog/[slug]">;

export async function generateStaticParams() {
  const posts = await getPostSlugs();
  return posts.length > 0 ? posts : [{ slug: "__none__" }];
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const post = await getPost((await params).slug);
  if (!post) return {};
  return pageMetadata({
    title: post.title,
    description: post.excerpt ?? undefined,
    path: `/blog/${post.slug}`,
    image: post.coverUrl,
    type: "article",
    publishedTime: post.publishedAt,
  });
}

// Params are read inside <Suspense>: with Partial Prefetching, an address that was not built ahead of
// time (a new record, or a page whose cache a content change refreshed) is generated on request, and
// reading params above the boundary makes that render fail.
export default function BlogPostPage({ params }: Props) {
  return (
    <Suspense fallback={<main className="min-h-dvh" />}>
      <BlogPostContent params={params} />
    </Suspense>
  );
}

async function BlogPostContent({ params }: Pick<Props, "params">) {
  const post = await getPost((await params).slug);
  if (!post) notFound();

  return (
    <main>
      <JsonLd
        data={[
          {
            "@type": "BlogPosting",
            headline: post.title,
            ...(post.excerpt ? { description: post.excerpt } : {}),
            image: absoluteUrl(post.coverUrl ?? defaultImage),
            ...(post.publishedAt ? { datePublished: post.publishedAt.toISOString() } : {}),
            mainEntityOfPage: absoluteUrl(`/blog/${post.slug}`),
            author: post.author?.name ? { "@type": "Person", name: post.author.name } : publisherLd,
            publisher: publisherLd,
          },
          breadcrumbLd([
            { name: "Blog", path: "/blog" },
            { name: post.title, path: `/blog/${post.slug}` },
          ]),
        ]}
      />
      <Container className="max-w-3xl py-10 sm:py-14">
        <Link href="/blog" className="inline-flex items-center gap-1 text-sm font-semibold text-brand-700 hover:underline">
          <Icon name="arrowLeft" className="size-4" /> All articles
        </Link>

        <article className="mt-6">
          <header>
            <p className="text-sm font-medium text-muted">
              {post.publishedAt && <time dateTime={post.publishedAt.toISOString()}>{formatDate(post.publishedAt)}</time>}
              {post.author && <> · {post.author.name}</>}
            </p>
            <h1 className="mt-3 text-4xl font-extrabold tracking-tight sm:text-5xl">{post.title}</h1>
            {post.excerpt && <p className="mt-4 text-xl text-muted">{post.excerpt}</p>}
          </header>

          {post.coverUrl && (
            <div className="bg-deep relative mt-8 aspect-[16/9] overflow-hidden rounded-3xl shadow-xl shadow-brand-900/20">
              <Image src={post.coverUrl} alt="" fill priority sizes="(min-width: 768px) 720px, 100vw" className="object-cover" />
            </div>
          )}

          <Card tone="solid" className="mt-8 p-6 sm:p-10">
            <Prose text={post.content} />
          </Card>
        </article>
      </Container>

      <CtaBand title="Have a question about studying abroad?" text="Ask a counsellor. The first consultation is free." />
    </main>
  );
}
