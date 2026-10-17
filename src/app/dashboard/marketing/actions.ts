"use server";

import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { isHttpsUrl, optionalDate, optionalInt, optionalNumber, text } from "@/lib/form";
import type { FormState } from "@/lib/form";
import { decryptSecret, encryptSecret } from "@/lib/secret-box";
import { requirePermission, requireRole } from "@/lib/session";
import { asCampaignStatus, asChannel, asPlatform, asPostStatus } from "./labels";

const base = "/dashboard/marketing";
const tooLong = (value: string | null, max: number) => Boolean(value && value.length > max);
const badLink = (value: string | null) => Boolean(value && !isHttpsUrl(value));

// ── Campaigns ────────────────────────────────────────────────────────────────

export async function saveCampaign(_previous: FormState, form: FormData): Promise<FormState> {
  const user = await requirePermission("MARKETING", "edit");

  const id = text(form, "id");
  const channel = asChannel(text(form, "channel"));
  const status = asCampaignStatus(text(form, "status"));
  const startDate = optionalDate(text(form, "startDate"));
  const endDate = optionalDate(text(form, "endDate"));
  const budget = optionalNumber(text(form, "budget"));
  const data = {
    name: text(form, "name"),
    goal: text(form, "goal") || null,
    audience: text(form, "audience") || null,
    message: text(form, "message") || null,
    designUrl: text(form, "designUrl") || null,
    owner: text(form, "owner") || null,
    results: text(form, "results") || null,
    currency: text(form, "currency").toUpperCase() || "GBP",
  };

  if (data.name.length < 2 || data.name.length > 150) return { error: "Enter the campaign name." };
  if (!channel) return { error: "Choose a channel." };
  if (!status) return { error: "Choose a status." };
  if (startDate === undefined || endDate === undefined) return { error: "Enter valid dates." };
  if (startDate && endDate && endDate < startDate) return { error: "The end date is before the start date." };
  if (budget === undefined) return { error: "Enter the budget as a number, e.g. 250." };
  if (!/^[A-Z]{3}$/.test(data.currency)) return { error: "Enter the currency as a 3-letter code, e.g. GBP." };
  if (badLink(data.designUrl)) return { error: "The design link must start with https://." };
  if (tooLong(data.goal, 500) || tooLong(data.audience, 500) || tooLong(data.owner, 120)) return { error: "Some fields are too long." };
  if (tooLong(data.message, 5000) || tooLong(data.results, 5000)) return { error: "Keep the message and results under 5,000 characters." };

  const values = { ...data, channel, status, startDate, endDate, budget };
  const saved = id ? await db.campaign.update({ where: { id }, data: values }) : await db.campaign.create({ data: values });
  await db.activityLog.create({ data: { userId: user.id, action: id ? "campaign.update" : "campaign.create", entityType: "Campaign", entityId: saved.id } });
  redirect(`${base}/campaigns`);
}

export async function deleteCampaign(id: string) {
  const user = await requirePermission("MARKETING", "edit");
  await db.campaign.delete({ where: { id } });
  await db.activityLog.create({ data: { userId: user.id, action: "campaign.delete", entityType: "Campaign", entityId: id } });
  redirect(`${base}/campaigns`);
}

// ── Content plan ─────────────────────────────────────────────────────────────

export async function savePost(_previous: FormState, form: FormData): Promise<FormState> {
  await requirePermission("MARKETING", "edit");

  const id = text(form, "id");
  const platform = asPlatform(text(form, "platform"));
  const status = asPostStatus(text(form, "status"));
  const publishOn = optionalDate(text(form, "publishOn"));
  const campaignId = text(form, "campaignId") || null;
  const data = {
    title: text(form, "title"),
    caption: text(form, "caption") || null,
    designUrl: text(form, "designUrl") || null,
    postUrl: text(form, "postUrl") || null,
    assignee: text(form, "assignee") || null,
  };

  if (data.title.length < 2 || data.title.length > 150) return { error: "Enter what the post is about." };
  if (!platform) return { error: "Choose a platform." };
  if (!status) return { error: "Choose a status." };
  if (!publishOn) return { error: "Choose the posting date." };
  if (badLink(data.designUrl) || badLink(data.postUrl)) return { error: "Links must start with https://." };
  if (tooLong(data.caption, 5000) || tooLong(data.assignee, 120)) return { error: "Some fields are too long." };
  if (campaignId && !(await db.campaign.findUnique({ where: { id: campaignId }, select: { id: true } }))) {
    return { error: "That campaign no longer exists." };
  }

  const values = { ...data, platform, status, publishOn, campaignId };
  if (id) await db.contentPost.update({ where: { id }, data: values });
  else await db.contentPost.create({ data: values });
  redirect(`${base}/content?month=${publishOn.toISOString().slice(0, 7)}`);
}

export async function deletePost(id: string) {
  await requirePermission("MARKETING", "edit");
  await db.contentPost.delete({ where: { id } });
  redirect(`${base}/content`);
}

// ── Social pages and access ──────────────────────────────────────────────────

export async function saveSocialAccount(_previous: FormState, form: FormData): Promise<FormState> {
  const user = await requirePermission("MARKETING", "edit");

  const id = text(form, "id");
  const platform = asPlatform(text(form, "platform"));
  const followers = optionalInt(text(form, "followers"));
  const data = {
    name: text(form, "name"),
    url: text(form, "url") || null,
    handle: text(form, "handle") || null,
    loginEmail: text(form, "loginEmail").toLowerCase() || null,
    twoFactorNote: text(form, "twoFactorNote") || null,
    managedBy: text(form, "managedBy") || null,
    notes: text(form, "notes") || null,
  };

  if (data.name.length < 2 || data.name.length > 120) return { error: "Enter the page name." };
  if (!platform) return { error: "Choose a platform." };
  if (badLink(data.url)) return { error: "The page link must start with https://." };
  if (followers === undefined || (followers !== null && followers < 0)) return { error: "Enter followers as a whole number." };
  if (tooLong(data.handle, 120) || tooLong(data.loginEmail, 200) || tooLong(data.twoFactorNote, 300) || tooLong(data.managedBy, 200)) {
    return { error: "Some fields are too long." };
  }
  if (tooLong(data.notes, 3000)) return { error: "Keep the notes under 3,000 characters." };

  // Only admins may set or clear the saved password; the field is not shown to anyone else.
  const password = String(form.get("password") ?? "");
  const clearPassword = form.get("clearPassword") === "on";
  const passwordChange =
    user.role !== "ADMIN" ? {} : clearPassword ? { passwordEncrypted: null } : password ? { passwordEncrypted: encryptSecret(password) } : {};
  if (password.length > 500) return { error: "That password is too long." };

  const values = { ...data, platform, followers, ...passwordChange };
  const saved = id ? await db.socialAccount.update({ where: { id }, data: values }) : await db.socialAccount.create({ data: values });
  await db.activityLog.create({
    data: {
      userId: user.id,
      action: id ? "social-account.update" : "social-account.create",
      entityType: "SocialAccount",
      entityId: saved.id,
      meta: { passwordChanged: "passwordEncrypted" in passwordChange },
    },
  });
  redirect(`${base}/accounts`);
}

export async function deleteSocialAccount(id: string) {
  const user = await requirePermission("MARKETING", "edit");
  await db.socialAccount.delete({ where: { id } });
  await db.activityLog.create({ data: { userId: user.id, action: "social-account.delete", entityType: "SocialAccount", entityId: id } });
  redirect(`${base}/accounts`);
}

// Admins only, and every look is written to the activity log.
export async function revealSocialPassword(id: string): Promise<{ password?: string; error?: string }> {
  const user = await requireRole("ADMIN");
  const account = await db.socialAccount.findUnique({ where: { id }, select: { passwordEncrypted: true } });
  if (!account?.passwordEncrypted) return { error: "No password saved." };
  const password = decryptSecret(account.passwordEncrypted);
  if (password === null) return { error: "This password cannot be read. It may have been saved before the site's secret key changed; save it again." };
  await db.activityLog.create({ data: { userId: user.id, action: "social-account.reveal", entityType: "SocialAccount", entityId: id } });
  return { password };
}
