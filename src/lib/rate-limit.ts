import "server-only";
import { randomUUID } from "node:crypto";
import { headers } from "next/headers";
import { db } from "@/lib/db";

// Visitor address as Vercel reports it; falls back to one shared bucket when unknown (local dev).
export async function clientIp() {
  const list = await headers();
  return list.get("x-forwarded-for")?.split(",")[0]?.trim() || list.get("x-real-ip") || "unknown";
}

// Counts one attempt for `name` from this visitor and says whether it is within `max` per `windowSeconds`.
// One SQL statement, so two requests at once cannot both slip under the limit.
// Uses the same RateLimit table as sign-in; keys start with "form:" so they never clash.
export async function withinLimit(name: string, max: number, windowSeconds: number) {
  const key = `form:${name}:${await clientIp()}`;
  const now = BigInt(Date.now());
  const windowMs = BigInt(windowSeconds * 1000);
  const rows = await db.$queryRaw<{ count: number }[]>`
    INSERT INTO "RateLimit" ("id", "key", "count", "lastRequest")
    VALUES (${randomUUID()}, ${key}, 1, ${now})
    ON CONFLICT ("key") DO UPDATE SET
      "count" = CASE WHEN ${now} - "RateLimit"."lastRequest" >= ${windowMs} THEN 1 ELSE "RateLimit"."count" + 1 END,
      "lastRequest" = CASE WHEN ${now} - "RateLimit"."lastRequest" >= ${windowMs} THEN ${now} ELSE "RateLimit"."lastRequest" END
    RETURNING "count"`;
  return (rows[0]?.count ?? 1) <= max;
}

// Rows older than a day are past every window in use; the daily cron clears them.
export async function clearOldRateLimits() {
  const cutoff = BigInt(Date.now() - 24 * 60 * 60 * 1000);
  await db.rateLimit.deleteMany({ where: { lastRequest: { lt: cutoff } } });
}
