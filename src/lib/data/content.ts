import "server-only";
import { cacheLife, cacheTag } from "next/cache";
import { db } from "@/lib/db";

// Public reads for the blog, test prep pages, partners and form dropdowns.

export const POSTS_PER_PAGE = 9;

export async function getPosts(page: number) {
  "use cache";
  cacheTag("posts");
  cacheLife("hours");

  const where = { status: "PUBLISHED" as const };
  const [total, posts] = await Promise.all([
    db.blogPost.count({ where }),
    db.blogPost.findMany({
      where,
      orderBy: { publishedAt: "desc" },
      skip: (page - 1) * POSTS_PER_PAGE,
      take: POSTS_PER_PAGE,
      select: { id: true, title: true, slug: true, excerpt: true, coverUrl: true, publishedAt: true },
    }),
  ]);
  return { posts, pages: Math.max(1, Math.ceil(total / POSTS_PER_PAGE)) };
}

export async function getPost(slug: string) {
  "use cache";
  cacheTag("posts");
  cacheLife("hours");

  return db.blogPost.findFirst({
    where: { slug, status: "PUBLISHED" },
    select: {
      id: true,
      title: true,
      slug: true,
      excerpt: true,
      content: true,
      coverUrl: true,
      publishedAt: true,
      author: { select: { name: true } },
    },
  });
}

export async function getPostSlugs() {
  "use cache";
  cacheTag("posts");
  cacheLife("hours");

  return db.blogPost.findMany({ where: { status: "PUBLISHED" }, select: { slug: true } });
}

export async function getTestPrepPage(slug: string) {
  "use cache";
  cacheTag("test-prep");
  cacheLife("hours");

  return db.testPrepPage.findFirst({
    where: { slug, isPublished: true },
    select: { id: true, name: true, slug: true, summary: true, content: true, imageUrl: true },
  });
}

export async function getPartnerUniversities() {
  "use cache";
  cacheTag("universities");
  cacheLife("hours");

  return db.university.findMany({
    where: { isPublished: true, isOfficialPartner: true },
    orderBy: [{ country: { name: "asc" } }, { name: "asc" }],
    select: { id: true, name: true, slug: true, city: true, logoUrl: true, country: { select: { name: true } } },
  });
}

// For the "country you live in" and "where do you want to study" dropdowns.
export async function getCountryOptions() {
  "use cache";
  cacheTag("countries");
  cacheLife("days");

  const countries = await db.country.findMany({
    orderBy: { name: "asc" },
    select: { id: true, name: true, isDestination: true },
  });
  return {
    all: countries.map(({ id, name }) => ({ id, name })),
    destinations: countries.filter((country) => country.isDestination).map(({ id, name }) => ({ id, name })),
  };
}
