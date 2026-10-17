import type { CampaignChannel, CampaignStatus, ContentPostStatus, SocialPlatform } from "@/generated/prisma/client";

export const platformLabels: Record<SocialPlatform, string> = {
  FACEBOOK: "Facebook",
  INSTAGRAM: "Instagram",
  TIKTOK: "TikTok",
  YOUTUBE: "YouTube",
  LINKEDIN: "LinkedIn",
  X: "X (Twitter)",
  WHATSAPP: "WhatsApp",
  GOOGLE_BUSINESS: "Google Business",
  OTHER: "Other",
};

export const channelLabels: Record<CampaignChannel, string> = {
  SOCIAL: "Social media",
  EMAIL: "Email",
  SMS: "SMS",
  ADS: "Paid ads",
  EVENT: "Event / seminar",
  OTHER: "Other",
};

export const campaignStatusLabels: Record<CampaignStatus, string> = {
  PLANNING: "Planning",
  DESIGN: "In design",
  READY: "Ready",
  LIVE: "Live",
  DONE: "Finished",
  CANCELLED: "Cancelled",
};

export const campaignStatusTones = {
  PLANNING: "neutral",
  DESIGN: "accent",
  READY: "brand",
  LIVE: "success",
  DONE: "neutral",
  CANCELLED: "danger",
} as const;

export const postStatusLabels: Record<ContentPostStatus, string> = {
  IDEA: "Idea",
  DESIGNING: "Designing",
  READY: "Ready to post",
  POSTED: "Posted",
};

export const postStatusTones = { IDEA: "neutral", DESIGNING: "accent", READY: "brand", POSTED: "success" } as const;

const pick = <T extends string>(labels: Record<T, string>, value: string): T | null =>
  value in labels ? (value as T) : null;

export const asPlatform = (value: string) => pick(platformLabels, value);
export const asChannel = (value: string) => pick(channelLabels, value);
export const asCampaignStatus = (value: string) => pick(campaignStatusLabels, value);
export const asPostStatus = (value: string) => pick(postStatusLabels, value);

// "YYYY-MM-DD" for a date input.
export const dateValue = (date: Date | null | undefined) => (date ? date.toISOString().slice(0, 10) : "");
