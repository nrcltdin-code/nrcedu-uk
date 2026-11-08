// Fills the test prep pages (IELTS, TOEFL, PTE, Duolingo, GRE, GMAT, SAT, ACT, C1 Advanced)
// with the guides in scripts/test-prep-content.ts. Runs automatically before the server starts.
//
// Safe to run on every start: each test is filled at most once. A test that already has guide
// text is left alone, and once a test has been handled it is remembered (SiteSetting
// "seeded.test-prep"), so dashboard edits are never overwritten and a deleted test stays deleted.
//
//   npm run db:seed-test-prep
import "dotenv/config";
import { db } from "../src/lib/db";
import { parseFacts, parseTables } from "../src/lib/test-prep";
import { testPrepContent } from "./test-prep-content";

const KEY = "seeded.test-prep";

async function main() {
  const setting = await db.siteSetting.findUnique({ where: { key: KEY } });
  const done = new Set<string>(Array.isArray(setting?.value) ? (setting.value as string[]) : []);
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

  await db.siteSetting.upsert({
    where: { key: KEY },
    update: { value: [...done] },
    create: { key: KEY, value: [...done] },
  });
}

main()
  .catch((error) => {
    // Never stop the server from starting because of this.
    console.error("test prep seed skipped:", error instanceof Error ? error.message : error);
  })
  .finally(() => db.$disconnect());
