// Fills the test prep pages (IELTS, TOEFL, PTE, Duolingo, GRE, GMAT, SAT, ACT, C1 Advanced)
// with full guides from scripts/test-prep-content.ts. Pages are matched by slug: existing ones
// are overwritten, missing ones created and published. Images are left as they are.
//
//   npm run db:seed-test-prep
import "dotenv/config";
import { db } from "../src/lib/db";
import { parseFacts, parseTables } from "../src/lib/test-prep";
import { testPrepContent } from "./test-prep-content";

async function main() {
  for (const [sortOrder, test] of testPrepContent.entries()) {
    const data = {
      name: test.name,
      summary: test.summary,
      content: test.content,
      facts: parseFacts(test.facts),
      tables: parseTables(test.tables),
      sortOrder,
    };
    const existing = await db.testPrepPage.findUnique({ where: { slug: test.slug }, select: { id: true } });
    await db.testPrepPage.upsert({
      where: { slug: test.slug },
      update: data,
      create: { ...data, slug: test.slug, isPublished: true },
    });
    console.log(`${existing ? "updated" : "created"}  ${test.name}`);
  }
  console.log("Done. The site shows the new content within a few hours, or straight away after saving any test prep page in the dashboard.");
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => db.$disconnect());
