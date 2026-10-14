import "server-only";
import { createHash, randomBytes, timingSafeEqual } from "node:crypto";
import { db } from "@/lib/db";

// Portal invites for students that staff created (they have no password yet). The link holds
// the user id and a random secret; only a hash of the secret is stored, it expires after
// 7 days and works once. Making a new link cancels the old one.

const DAYS = 7;
const identifier = (userId: string) => `portal-invite:${userId}`;
const hash = (secret: string) => createHash("sha256").update(secret).digest("hex");

export async function createInvite(userId: string) {
  const secret = randomBytes(32).toString("base64url");
  const expiresAt = new Date(Date.now() + DAYS * 24 * 3_600_000);
  await db.$transaction([
    db.verification.deleteMany({ where: { identifier: identifier(userId) } }),
    db.verification.create({ data: { identifier: identifier(userId), value: hash(secret), expiresAt } }),
  ]);
  const base = (process.env.APP_URL ?? "").replace(/\/+$/, "");
  return { url: `${base}/set-password?invite=${userId}.${secret}`, expiresAt };
}

// Returns the user id when the invite is valid; does not use it up.
export async function checkInvite(invite: string): Promise<string | null> {
  const [userId, secret] = invite.split(".");
  if (!userId || !secret) return null;
  const row = await db.verification.findFirst({ where: { identifier: identifier(userId), expiresAt: { gt: new Date() } } });
  if (!row) return null;
  const expected = Buffer.from(row.value);
  const given = Buffer.from(hash(secret));
  return expected.length === given.length && timingSafeEqual(expected, given) ? userId : null;
}

export const consumeInvite = (userId: string) => db.verification.deleteMany({ where: { identifier: identifier(userId) } });
