// Uploads a folder of university logos and sets each one on its university.
// Name each file after the university, e.g. "University of Manchester.png" or
// "university-of-manchester.png" (JPG, PNG, WebP, GIF or AVIF, under 4 MB).
//
//   npm run db:import-logos -- "C:\logos"                    shows the matches, changes nothing
//   npm run db:import-logos -- "C:\logos" --confirm          uploads logos for universities without one
//   npm run db:import-logos -- "C:\logos" --confirm --replace  also replaces existing logos
import "dotenv/config";
import { readdir, readFile } from "node:fs/promises";
import { extname, join, parse } from "node:path";
import { db } from "../src/lib/db";
import { slugify } from "../src/lib/form";
import { MAX_IMAGE_BYTES } from "../src/lib/images";
import { storeImage } from "../src/lib/remote-image";
import { storageEnabled } from "../src/lib/storage";

const args = process.argv.slice(2);
const folder = args.find((a) => !a.startsWith("--"));
const confirm = args.includes("--confirm");
const replace = args.includes("--replace");

async function main() {
  if (!folder) throw new Error('Give the folder, e.g. npm run db:import-logos -- "C:\\logos"');
  if (confirm && !storageEnabled) throw new Error("File storage is not set up in .env (STORAGE_*).");

  const universities = await db.university.findMany({ select: { id: true, name: true, slug: true, logoUrl: true } });
  const bySlug = new Map(universities.map((u) => [u.slug, u]));
  const files = (await readdir(folder)).filter((f) => /\.(png|jpe?g|webp|gif|avif)$/i.test(extname(f)));

  let done = 0;
  const unmatched: string[] = [];
  for (const file of files) {
    const uni = bySlug.get(slugify(parse(file).name));
    if (!uni) { unmatched.push(file); continue; }
    if (uni.logoUrl && !replace) { console.log(`keep    ${uni.name} (already has a logo)`); continue; }
    if (!confirm) { console.log(`match   ${file} → ${uni.name}`); continue; }

    const bytes = await readFile(join(folder, file));
    if (bytes.byteLength > MAX_IMAGE_BYTES) { console.log(`skip    ${file}: over 4 MB`); continue; }
    try {
      const url = await storeImage(new Uint8Array(bytes), file);
      await db.university.update({ where: { id: uni.id }, data: { logoUrl: url } });
      console.log(`saved   ${uni.name}`);
      done++;
    } catch (error) {
      console.log(`skip    ${file}: ${error instanceof Error ? error.message : error}`);
    }
  }

  if (unmatched.length) console.log(`\nNo university matches these names (rename them to the university name):\n  ${unmatched.join("\n  ")}`);
  console.log(confirm ? `\n${done} logos saved.` : "\nNothing changed. Add --confirm to upload.");
}

main()
  .catch((error) => { console.error(error instanceof Error ? error.message : error); process.exitCode = 1; })
  .finally(() => db.$disconnect());
