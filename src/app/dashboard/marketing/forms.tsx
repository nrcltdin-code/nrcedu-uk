"use client";

import { useActionState, useState } from "react";
import Link from "next/link";
import { Checkbox, FormMessage } from "@/components/dashboard/form-bits";
import { Button, buttonStyles } from "@/components/ui/button";
import { Input, Label, Select, Textarea } from "@/components/ui/field";
import type { FormState } from "@/lib/form";
import { revealSocialPassword, saveCampaign, savePost, saveSocialAccount } from "./actions";
import { campaignStatusLabels, channelLabels, platformLabels, postStatusLabels } from "./labels";

function Options({ labels }: { labels: Record<string, string> }) {
  return Object.entries(labels).map(([value, label]) => (
    <option key={value} value={value}>{label}</option>
  ));
}

function Actions({ pending, editing, noun, cancelHref }: { pending: boolean; editing: boolean; noun: string; cancelHref: string }) {
  return (
    <div className="flex gap-3">
      <Button type="submit" disabled={pending}>{pending ? "Saving…" : editing ? "Save changes" : `Add ${noun}`}</Button>
      {editing && <Link href={cancelHref} className={buttonStyles({ variant: "ghost" })}>Cancel</Link>}
    </div>
  );
}

// ── Campaigns ────────────────────────────────────────────────────────────────

export type CampaignValues = {
  id: string;
  name: string;
  channel: string;
  status: string;
  startDate: string;
  endDate: string;
  budget: string;
  currency: string;
  goal: string | null;
  audience: string | null;
  message: string | null;
  designUrl: string | null;
  owner: string | null;
  results: string | null;
};

export function CampaignForm({ campaign }: { campaign: CampaignValues | null }) {
  const [state, action, pending] = useActionState<FormState, FormData>(saveCampaign, {});
  return (
    <form action={action} className="grid gap-4">
      {campaign && <input type="hidden" name="id" value={campaign.id} />}
      <div>
        <Label htmlFor="c-name">Campaign name</Label>
        <Input id="c-name" name="name" defaultValue={campaign?.name} maxLength={150} placeholder="September intake – UK universities" required />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <Label htmlFor="c-channel">Channel</Label>
          <Select id="c-channel" name="channel" defaultValue={campaign?.channel ?? "SOCIAL"}><Options labels={channelLabels} /></Select>
        </div>
        <div>
          <Label htmlFor="c-status">Status</Label>
          <Select id="c-status" name="status" defaultValue={campaign?.status ?? "PLANNING"}><Options labels={campaignStatusLabels} /></Select>
        </div>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <Label htmlFor="c-start">Starts</Label>
          <Input id="c-start" name="startDate" type="date" defaultValue={campaign?.startDate} />
        </div>
        <div>
          <Label htmlFor="c-end">Ends</Label>
          <Input id="c-end" name="endDate" type="date" defaultValue={campaign?.endDate} />
        </div>
      </div>
      <div className="grid gap-4 sm:grid-cols-[1fr_7rem]">
        <div>
          <Label htmlFor="c-budget">Budget</Label>
          <Input id="c-budget" name="budget" inputMode="decimal" defaultValue={campaign?.budget} placeholder="250" />
        </div>
        <div>
          <Label htmlFor="c-currency">Currency</Label>
          <Input id="c-currency" name="currency" defaultValue={campaign?.currency ?? "GBP"} maxLength={3} />
        </div>
      </div>
      <div>
        <Label htmlFor="c-goal">Goal</Label>
        <Input id="c-goal" name="goal" defaultValue={campaign?.goal ?? ""} maxLength={500} placeholder="50 consultation bookings" />
      </div>
      <div>
        <Label htmlFor="c-audience">Audience</Label>
        <Input id="c-audience" name="audience" defaultValue={campaign?.audience ?? ""} maxLength={500} placeholder="Students in Dhaka interested in business degrees" />
      </div>
      <div>
        <Label htmlFor="c-message">Message / copy</Label>
        <Textarea id="c-message" name="message" defaultValue={campaign?.message ?? ""} maxLength={5000} placeholder="Email or SMS text, ad copy, key points…" />
      </div>
      <div>
        <Label htmlFor="c-design">Design link</Label>
        <Input id="c-design" name="designUrl" type="url" defaultValue={campaign?.designUrl ?? ""} placeholder="https://www.canva.com/… or Google Drive folder" />
      </div>
      <div>
        <Label htmlFor="c-owner">Responsible</Label>
        <Input id="c-owner" name="owner" defaultValue={campaign?.owner ?? ""} maxLength={120} />
      </div>
      <div>
        <Label htmlFor="c-results">Results</Label>
        <Textarea id="c-results" name="results" defaultValue={campaign?.results ?? ""} maxLength={5000} placeholder="Reach, clicks, leads, bookings, what to change next time" />
      </div>
      <FormMessage state={state} />
      <Actions pending={pending} editing={Boolean(campaign)} noun="campaign" cancelHref="/dashboard/marketing/campaigns" />
    </form>
  );
}

// ── Content plan ─────────────────────────────────────────────────────────────

export type PostValues = {
  id: string;
  title: string;
  platform: string;
  publishOn: string;
  status: string;
  caption: string | null;
  designUrl: string | null;
  postUrl: string | null;
  assignee: string | null;
  campaignId: string | null;
};

export function PostForm({ post, campaigns }: { post: PostValues | null; campaigns: { id: string; name: string }[] }) {
  const [state, action, pending] = useActionState<FormState, FormData>(savePost, {});
  return (
    <form action={action} className="grid gap-4">
      {post && <input type="hidden" name="id" value={post.id} />}
      <div>
        <Label htmlFor="p-title">Post</Label>
        <Input id="p-title" name="title" defaultValue={post?.title} maxLength={150} placeholder="Student success story – Manchester" required />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <Label htmlFor="p-platform">Platform</Label>
          <Select id="p-platform" name="platform" defaultValue={post?.platform ?? "FACEBOOK"}><Options labels={platformLabels} /></Select>
        </div>
        <div>
          <Label htmlFor="p-date">Post on</Label>
          <Input id="p-date" name="publishOn" type="date" defaultValue={post?.publishOn} required />
        </div>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <Label htmlFor="p-status">Status</Label>
          <Select id="p-status" name="status" defaultValue={post?.status ?? "IDEA"}><Options labels={postStatusLabels} /></Select>
        </div>
        <div>
          <Label htmlFor="p-campaign">Campaign</Label>
          <Select id="p-campaign" name="campaignId" defaultValue={post?.campaignId ?? ""}>
            <option value="">None</option>
            {campaigns.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </Select>
        </div>
      </div>
      <div>
        <Label htmlFor="p-caption">Caption</Label>
        <Textarea id="p-caption" name="caption" defaultValue={post?.caption ?? ""} maxLength={5000} />
      </div>
      <div>
        <Label htmlFor="p-design">Design link</Label>
        <Input id="p-design" name="designUrl" type="url" defaultValue={post?.designUrl ?? ""} placeholder="https://www.canva.com/…" />
      </div>
      <div>
        <Label htmlFor="p-url">Live post link</Label>
        <Input id="p-url" name="postUrl" type="url" defaultValue={post?.postUrl ?? ""} placeholder="Add once it is posted" />
      </div>
      <div>
        <Label htmlFor="p-assignee">Designer / responsible</Label>
        <Input id="p-assignee" name="assignee" defaultValue={post?.assignee ?? ""} maxLength={120} />
      </div>
      <FormMessage state={state} />
      <Actions pending={pending} editing={Boolean(post)} noun="post" cancelHref="/dashboard/marketing/content" />
    </form>
  );
}

// ── Social pages ─────────────────────────────────────────────────────────────

export type SocialAccountValues = {
  id: string;
  platform: string;
  name: string;
  url: string | null;
  handle: string | null;
  loginEmail: string | null;
  twoFactorNote: string | null;
  managedBy: string | null;
  followers: number | null;
  notes: string | null;
  hasPassword: boolean;
};

export function SocialAccountForm({ account, isAdmin }: { account: SocialAccountValues | null; isAdmin: boolean }) {
  const [state, action, pending] = useActionState<FormState, FormData>(saveSocialAccount, {});
  return (
    <form action={action} className="grid gap-4" autoComplete="off">
      {account && <input type="hidden" name="id" value={account.id} />}
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <Label htmlFor="s-platform">Platform</Label>
          <Select id="s-platform" name="platform" defaultValue={account?.platform ?? "FACEBOOK"}><Options labels={platformLabels} /></Select>
        </div>
        <div>
          <Label htmlFor="s-name">Page name</Label>
          <Input id="s-name" name="name" defaultValue={account?.name} maxLength={120} placeholder="NRC Education UK" required />
        </div>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <Label htmlFor="s-url">Page link</Label>
          <Input id="s-url" name="url" type="url" defaultValue={account?.url ?? ""} placeholder="https://facebook.com/…" />
        </div>
        <div>
          <Label htmlFor="s-handle">Handle / username</Label>
          <Input id="s-handle" name="handle" defaultValue={account?.handle ?? ""} maxLength={120} placeholder="@nrcedu" />
        </div>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <Label htmlFor="s-login">Login email / phone</Label>
          <Input id="s-login" name="loginEmail" defaultValue={account?.loginEmail ?? ""} maxLength={200} />
        </div>
        <div>
          <Label htmlFor="s-followers">Followers</Label>
          <Input id="s-followers" name="followers" inputMode="numeric" defaultValue={account?.followers ?? ""} />
        </div>
      </div>
      {isAdmin ? (
        <div>
          <Label htmlFor="s-password">{account?.hasPassword ? "New password (leave empty to keep the saved one)" : "Password"}</Label>
          <Input id="s-password" name="password" type="password" autoComplete="new-password" maxLength={500} />
          {account?.hasPassword && <div className="mt-2"><Checkbox name="clearPassword">Remove the saved password</Checkbox></div>}
          <p className="mt-1 text-xs text-muted">Stored encrypted. Only admins can see it, and every look is logged.</p>
        </div>
      ) : (
        <p className="text-sm text-muted">Only admins can see or change saved passwords.</p>
      )}
      <div>
        <Label htmlFor="s-2fa">Two-step code goes to</Label>
        <Input id="s-2fa" name="twoFactorNote" defaultValue={account?.twoFactorNote ?? ""} maxLength={300} placeholder="Office phone (+44 …), or Authenticator on the manager's phone" />
      </div>
      <div>
        <Label htmlFor="s-managed">Who has access</Label>
        <Input id="s-managed" name="managedBy" defaultValue={account?.managedBy ?? ""} maxLength={200} placeholder="Owner: …, Admins: …, Agency: …" />
      </div>
      <div>
        <Label htmlFor="s-notes">Notes</Label>
        <Textarea id="s-notes" name="notes" defaultValue={account?.notes ?? ""} maxLength={3000} placeholder="Business Manager ID, recovery email, ad account, renewal dates…" />
      </div>
      <FormMessage state={state} />
      <Actions pending={pending} editing={Boolean(account)} noun="page" cancelHref="/dashboard/marketing/accounts" />
    </form>
  );
}

export function RevealPassword({ id }: { id: string }) {
  const [shown, setShown] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function reveal() {
    setPending(true);
    const result = await revealSocialPassword(id);
    setPending(false);
    setError(result.error ?? null);
    setShown(result.password ?? null);
  }

  if (shown !== null) {
    return (
      <span className="inline-flex flex-wrap items-center gap-2">
        <code className="rounded-lg bg-brand-900/8 px-2 py-0.5 font-mono text-sm select-all">{shown}</code>
        <Button type="button" variant="ghost" size="sm" onClick={() => navigator.clipboard?.writeText(shown)}>Copy</Button>
        <Button type="button" variant="ghost" size="sm" onClick={() => setShown(null)}>Hide</Button>
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-2">
      <span className="font-mono text-sm">••••••••</span>
      <Button type="button" variant="ghost" size="sm" onClick={reveal} disabled={pending}>{pending ? "…" : "Show"}</Button>
      {error && <span className="text-xs text-red-700">{error}</span>}
    </span>
  );
}
