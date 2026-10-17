import "server-only";
import { createHash } from "node:crypto";

// Turns a page view's referrer and campaign tags into a readable source such as
// "Google search", "Facebook" or "Direct". utm_source wins when a link was tagged.

const known: [RegExp, string][] = [
  [/(^|\.)google\./, "Google search"],
  [/(^|\.)bing\.com$/, "Bing search"],
  [/(^|\.)(duckduckgo\.com|yahoo\.com|yandex\.)/, "Other search"],
  [/(^|\.)(facebook\.com|fb\.com|fb\.me|messenger\.com)$/, "Facebook"],
  [/(^|\.)instagram\.com$/, "Instagram"],
  [/(^|\.)(t\.co|x\.com|twitter\.com)$/, "X (Twitter)"],
  [/(^|\.)(youtube\.com|youtu\.be)$/, "YouTube"],
  [/(^|\.)(linkedin\.com|lnkd\.in)$/, "LinkedIn"],
  [/(^|\.)tiktok\.com$/, "TikTok"],
  [/(^|\.)(whatsapp\.com|wa\.me)$/, "WhatsApp"],
  [/(^|\.)(chatgpt\.com|openai\.com|perplexity\.ai|claude\.ai|gemini\.google\.com)$/, "AI assistant"],
];

const utmNames: Record<string, string> = {
  google: "Google search",
  facebook: "Facebook",
  fb: "Facebook",
  instagram: "Instagram",
  ig: "Instagram",
  youtube: "YouTube",
  linkedin: "LinkedIn",
  tiktok: "TikTok",
  whatsapp: "WhatsApp",
  email: "Email",
  newsletter: "Email",
  sms: "SMS",
};

export function trafficSource(referrerHost: string | null, utmSource: string | null) {
  if (utmSource) {
    const key = utmSource.toLowerCase();
    return utmNames[key] ?? utmSource.slice(0, 60);
  }
  if (!referrerHost) return "Direct";
  return known.find(([pattern]) => pattern.test(referrerHost))?.[1] ?? referrerHost.replace(/^www\./, "");
}

export const isBot = (userAgent: string) =>
  !userAgent || /bot|crawl|spider|slurp|preview|headless|lighthouse|pingdom|monitor|curl|wget|python|axios/i.test(userAgent);

export function deviceType(userAgent: string) {
  if (/iPad|Tablet/i.test(userAgent)) return "Tablet";
  if (/Mobi|iPhone|Android/i.test(userAgent)) return "Mobile";
  return "Desktop";
}

// Same visitor, same day → same hash. The daily part means it cannot link visits across days.
export function visitorHash(ip: string, userAgent: string, day: string) {
  return createHash("sha256").update(`${process.env.AUTH_SECRET}|${day}|${ip}|${userAgent}`).digest("base64url").slice(0, 22);
}

const regionNames = new Intl.DisplayNames(["en-GB"], { type: "region" });
export function countryName(code: string | null) {
  if (!code) return "Unknown";
  try {
    return regionNames.of(code) ?? code;
  } catch {
    return code;
  }
}
