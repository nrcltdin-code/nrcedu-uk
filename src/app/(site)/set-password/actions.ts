"use server";

import { hashPassword } from "better-auth/crypto";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { checkInvite, consumeInvite } from "@/lib/invites";

export type SetPasswordState = { error?: string };

export async function setPasswordFromInvite(_previous: SetPasswordState, form: FormData): Promise<SetPasswordState> {
  const invite = String(form.get("invite") ?? "");
  const password = String(form.get("password") ?? "");
  const confirm = String(form.get("confirm") ?? "");

  if (password.length < 8 || password.length > 128) return { error: "Use at least 8 characters." };
  if (password !== confirm) return { error: "The two passwords do not match." };

  const userId = await checkInvite(invite);
  if (!userId) return { error: "This link has expired or was already used. Ask your counsellor for a new one." };

  const user = await db.user.findUnique({
    where: { id: userId },
    select: { role: true, status: true, agentTeamId: true, accounts: { where: { providerId: "credential" }, select: { id: true } } },
  });
  // Invites go to students staff added and to agents' team members.
  const invitable = user?.role === "STUDENT" || (user?.role === "AGENT" && user.agentTeamId);
  if (!user || !invitable || user.status !== "ACTIVE") return { error: "This link can no longer be used." };
  if (user.accounts.length) {
    await consumeInvite(userId);
    return { error: "You already have a password. Sign in, or use “Forgot password”." };
  }

  const passwordHash = await hashPassword(password);
  await db.$transaction([
    db.account.create({ data: { userId, accountId: userId, providerId: "credential", password: passwordHash } }),
    // Opening the link from their inbox or phone proves the address works.
    db.user.update({ where: { id: userId }, data: { emailVerified: true } }),
    db.activityLog.create({ data: { userId, action: "student.password-set", entityType: "User", entityId: userId } }),
  ]);
  await consumeInvite(userId);
  redirect("/?auth=login&next=/dashboard&notice=password-set");
}
