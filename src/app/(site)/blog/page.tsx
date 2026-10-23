import type { Metadata } from "next";
import { Suspense } from "react";
import Image from "next/image";
import Link from "next/link";
import { PageHero } from "@/components/site/page-hero";
import { Badge } from "@/components/ui/badge";
import { buttonStyles } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Icon } from "@/components/ui/icon";
import { Section } from "@/components/ui/section";
import { getPosts } from "@/lib/data/content";
import { formatDate } from "@/lib/format";
import { pageMetadata } from "@/lib/seo";

export const metadata: Metadata = pageMetadata({
  title: "Blog",
  description: "Advice on choosing a country and university, applications, student visas and life abroad.",
  path: "/blog",
});

export default function BlogPage({ searchParams }: PageProps<"/blog">) {
  return (
    <main>
      <PageHero eyebrow="Blog" title="Advice for" highlight="studying abroad">
        Guides from our counsellors on universities, applications, visas and student life.
      </PageHero>

      <Section tint="amber">
        {/* The page number comes from the address bar, which is only known at request time. */}
        <Suspense fallback={<Card tone="solid">Loading articles…</Card>}>
          <Posts searchParams={searchParams} />
        </Suspense>
      </Section>
    </main>
  );
}

async function Posts({ searchParams }: Pick<PageProps<"/blog">, "searchParams">) {
  const raw = (await searchParams).page;
  const page = Math.max(1, Number.parseInt((Array.isArray(raw) ? raw[0] : raw) ?? "1", 10) || 1);
  const { posts, pages } = await getPosts(page);

  if (posts.length === 0) {
    return <Card>No articles yet. Please check back soon.</Card>;
  }

  return (
    <>
      <ul className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {posts.map((post) => (
          <li key={post.id}>
            <Link href={`/blog/${post.slug}`} className="group block h-full">
              <Card tone="solid" className="h-full overflow-hidden p-0 transition duration-300 group-hover:-translate-y-1.5 group-hover:shadow-2xl group-hover:shadow-brand-600/20">
                <div className="bg-deep relative h-48 overflow-hidden">
                  {post.coverUrl && (
                    <Image src={post.coverUrl} alt="" fill sizes="(min-width: 1024px) 352px, (min-width: 768px) 50vw, 100vw" className="object-cover transition duration-500 group-hover:scale-105" />
                  )}
                </div>
                <div className="p-6">
                  {post.publishedAt && (
                    <Badge>
                      <time dateTime={post.publishedAt.toISOString()}>{formatDate(post.publishedAt)}</time>
                    </Badge>
                  )}
                  <h2 className="mt-3 text-lg font-bold leading-snug group-hover:text-brand-700">{post.title}</h2>
                  {post.excerpt && <p className="mt-2 text-sm text-muted">{post.excerpt}</p>}
                  <span className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-brand-700">
                    Read more <Icon name="arrowRight" className="size-4 transition group-hover:translate-x-1" />
                  </span>
                </div>
              </Card>
            </Link>
          </li>
        ))}
      </ul>

      {pages > 1 && (
        <nav aria-label="Article pages" className="mt-10 flex items-center justify-center gap-3">
          {page > 1 && (
            <Link href={page === 2 ? "/blog" : `/blog?page=${page - 1}`} className={buttonStyles({ variant: "glass", size: "sm" })}>
              Newer
            </Link>
          )}
          <span className="text-sm text-muted">
            Page {page} of {pages}
          </span>
          {page < pages && (
            <Link href={`/blog?page=${page + 1}`} className={buttonStyles({ variant: "glass", size: "sm" })}>
              Older
            </Link>
          )}
        </nav>
      )}
    </>
  );
}
