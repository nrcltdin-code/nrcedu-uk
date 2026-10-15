import type { MetadataRoute } from "next";
import { cacheLife, cacheTag } from "next/cache";
import { db } from "@/lib/db";
import { siteUrl } from "@/lib/site-url";

const staticPages = [
  "",
  "/about",
  "/services",
  "/universities",
  "/destinations",
  "/subjects",
  "/test-prep",
  "/blog",
  "/partners",
  "/contact",
  "/consultation",
  "/become-an-agent",
];

// Every public page, with published records only. Refreshed when content changes.
async function getEntries() {
  "use cache";
  cacheTag("universities", "countries", "subjects", "posts", "test-prep");
  cacheLife("hours");

  const [universities, countries, subjects, testPrep, posts] = await Promise.all([
    db.university.findMany({
      where: { isPublished: true },
      select: {
        slug: true,
        updatedAt: true,
        courses: { where: { isPublished: true }, select: { slug: true, updatedAt: true } },
      },
    }),
    db.country.findMany({ where: { isDestination: true }, select: { slug: true, updatedAt: true } }),
    db.subject.findMany({ select: { slug: true, updatedAt: true } }),
    db.testPrepPage.findMany({ where: { isPublished: true }, select: { slug: true, updatedAt: true } }),
    db.blogPost.findMany({ where: { status: "PUBLISHED" }, select: { slug: true, updatedAt: true } }),
  ]);

  return [
    ...universities.flatMap((u) => [
      { path: `/universities/${u.slug}`, updatedAt: u.updatedAt },
      ...u.courses.map((c) => ({ path: `/universities/${u.slug}/courses/${c.slug}`, updatedAt: c.updatedAt })),
    ]),
    ...countries.map((c) => ({ path: `/destinations/${c.slug}`, updatedAt: c.updatedAt })),
    ...subjects.map((s) => ({ path: `/subjects/${s.slug}`, updatedAt: s.updatedAt })),
    ...testPrep.map((t) => ({ path: `/test-prep/${t.slug}`, updatedAt: t.updatedAt })),
    ...posts.map((p) => ({ path: `/blog/${p.slug}`, updatedAt: p.updatedAt })),
  ];
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const entries = await getEntries();
  return [
    ...staticPages.map((path) => ({ url: `${siteUrl}${path}`, priority: path === "" ? 1 : 0.8 })),
    ...entries.map(({ path, updatedAt }) => ({ url: `${siteUrl}${path}`, lastModified: updatedAt })),
  ];
}
