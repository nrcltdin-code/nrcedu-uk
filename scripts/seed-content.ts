// Loads starter content: the nine test prep guides (scripts/test-prep-content.ts) and the
// blog posts (scripts/blog-content.ts). Runs automatically before the server starts.
//
// Safe to run on every start: each item is loaded at most once. An item that already has real
// content is left alone, and once an item has been handled it is remembered (SiteSetting
// "seeded.test-prep" / "seeded.blog"), so dashboard edits are never overwritten and anything
// deleted stays deleted.
//
//   npm run db:seed-content
import "dotenv/config";
import { db } from "../src/lib/db";
import { parseFacts, parseTables } from "../src/lib/test-prep";
import { blogContent } from "./blog-content";
import { testPrepContent } from "./test-prep-content";

async function loadDone(key: string) {
  const setting = await db.siteSetting.findUnique({ where: { key } });
  return new Set<string>(Array.isArray(setting?.value) ? (setting.value as string[]) : []);
}

async function saveDone(key: string, done: Set<string>) {
  await db.siteSetting.upsert({ where: { key }, update: { value: [...done] }, create: { key, value: [...done] } });
}

async function seedTestPrep() {
  const KEY = "seeded.test-prep";
  const done = await loadDone(KEY);
  const pending = testPrepContent.filter((t) => !done.has(t.slug));
  if (pending.length === 0) return;

  for (const test of pending) {
    const existing = await db.testPrepPage.findUnique({ where: { slug: test.slug }, select: { content: true } });
    if (existing?.content?.trim()) {
      console.log(`test prep: kept ${test.name} (already has content)`);
    } else {
      const data = {
        name: test.name,
        summary: test.summary,
        content: test.content,
        facts: parseFacts(test.facts),
        tables: parseTables(test.tables),
        sortOrder: testPrepContent.indexOf(test),
      };
      await db.testPrepPage.upsert({
        where: { slug: test.slug },
        update: data,
        create: { ...data, slug: test.slug, isPublished: true },
      });
      console.log(`test prep: ${existing ? "filled" : "created"} ${test.name}`);
    }
    done.add(test.slug);
  }
  await saveDone(KEY, done);
}

// The old demo posts carry placeholder text; those are replaced, real posts are kept.
const PLACEHOLDER = "This is sample text.";

async function seedBlog() {
  const KEY = "seeded.blog";
  const done = await loadDone(KEY);
  const pending = blogContent.filter((p) => !done.has(p.slug));
  if (pending.length === 0) return;

  for (const post of pending) {
    const existing = await db.blogPost.findUnique({ where: { slug: post.slug }, select: { content: true } });
    if (existing && !existing.content.includes(PLACEHOLDER)) {
      console.log(`blog: kept "${post.title}" (already written)`);
    } else {
      const { title, excerpt, content } = post;
      // Newest first in list order, a week apart.
      const publishedAt = new Date(Date.now() - blogContent.indexOf(post) * 7 * 24 * 60 * 60 * 1000);
      await db.blogPost.upsert({
        where: { slug: post.slug },
        update: { title, excerpt, content },
        create: { title, excerpt, content, slug: post.slug, status: "PUBLISHED", publishedAt },
      });
      console.log(`blog: ${existing ? "filled" : "created"} "${post.title}"`);
    }
    done.add(post.slug);
  }
  await saveDone(KEY, done);
}

// Built-in cover illustrations (public/banners) for posts that have no cover yet.
// Set once per post: a cover changed or removed in the dashboard is left alone.
async function seedBlogCovers() {
  const KEY = "seeded.blog-covers";
  const done = await loadDone(KEY);
  const pending = blogContent.filter((p) => p.coverUrl && !done.has(p.slug));
  if (pending.length === 0) return;

  for (const post of pending) {
    const { count } = await db.blogPost.updateMany({ where: { slug: post.slug, coverUrl: null }, data: { coverUrl: post.coverUrl } });
    if (count) console.log(`blog: cover added to "${post.title}"`);
    done.add(post.slug);
  }
  await saveDone(KEY, done);
}

async function main() {
  await seedTestPrep();
  await seedBlog();
  await seedBlogCovers();
}

main()
  .catch((error) => {
    // Never stop the server from starting because of this.
    console.error("content seed skipped:", error instanceof Error ? error.message : error);
  })
  .finally(() => db.$disconnect());
