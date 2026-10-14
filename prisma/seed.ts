import "dotenv/config";
import { hashPassword } from "better-auth/crypto";
import { db } from "../src/lib/db";

const destinations = [
  { name: "United Kingdom", slug: "united-kingdom", isoCode: "GB" },
  { name: "United States", slug: "united-states", isoCode: "US" },
  { name: "Canada", slug: "canada", isoCode: "CA" },
  { name: "Australia", slug: "australia", isoCode: "AU" },
  { name: "Germany", slug: "germany", isoCode: "DE" },
];

// Every country a student, agent or lead can come from (ISO 3166-1 codes).
const worldCodes =
  "AF AL DZ AD AO AG AR AM AU AT AZ BS BH BD BB BY BE BZ BJ BT BO BA BW BR BN BG BF BI CV KH CM CA CF TD CL CN CO KM CG CD CR CI HR CU CY CZ DK DJ DM DO EC EG SV GQ ER EE SZ ET FJ FI FR GA GM GE DE GH GR GD GT GN GW GY HT HN HK HU IS IN ID IR IQ IE IL IT JM JP JO KZ KE KI KP KR KW KG LA LV LB LS LR LY LI LT LU MG MW MY MV ML MT MH MR MU MX FM MD MC MN ME MA MZ MM NA NR NP NL NZ NI NE NG MK NO OM PK PW PS PA PG PY PE PH PL PT QA RO RU RW KN LC VC WS SM ST SA SN RS SC SL SG SK SI SB SO ZA SS ES LK SD SR SE CH SY TW TJ TZ TH TL TG TO TT TN TR TM TV UG UA AE GB US UY UZ VU VA VE VN YE ZM ZW".split(
    " ",
  );

const slugify = (value: string) =>
  value
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");

async function seedCountries() {
  for (const country of destinations) {
    await db.country.upsert({
      where: { slug: country.slug },
      update: {},
      create: { ...country, isDestination: true },
    });
  }

  const names = new Intl.DisplayNames("en", { type: "region" });
  const world = worldCodes.flatMap((isoCode) => {
    const name = names.of(isoCode);
    return name ? [{ isoCode, name, slug: slugify(name) }] : [];
  });
  const added = await db.country.createMany({ data: world, skipDuplicates: true });

  console.log(`Countries: ${destinations.length} destinations ready, ${added.count} other countries added.`);
}

async function seedAdmin() {
  const email = process.env.SEED_ADMIN_EMAIL?.trim().toLowerCase();
  const password = process.env.SEED_ADMIN_PASSWORD;

  if (!email || !password) {
    console.log("Admin: skipped. Set SEED_ADMIN_EMAIL and SEED_ADMIN_PASSWORD in .env, then run again.");
    return;
  }
  if (password.length < 8) {
    throw new Error("SEED_ADMIN_PASSWORD must be at least 8 characters.");
  }
  if (await db.user.findUnique({ where: { email } })) {
    console.log(`Admin: ${email} already exists, left unchanged.`);
    return;
  }

  const user = await db.user.create({
    data: {
      name: process.env.SEED_ADMIN_NAME || "Admin",
      email,
      emailVerified: true,
      role: "ADMIN",
      status: "ACTIVE",
    },
  });
  await db.account.create({
    data: {
      userId: user.id,
      accountId: user.id,
      providerId: "credential",
      password: await hashPassword(password),
    },
  });
  console.log(`Admin: created ${email}.`);
}

async function main() {
  await seedCountries();
  await seedAdmin();
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => db.$disconnect());
