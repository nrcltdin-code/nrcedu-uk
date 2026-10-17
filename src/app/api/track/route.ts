import { db } from "@/lib/db";
import { describeDevice } from "@/lib/device";
import { deviceType, isBot, trafficSource, visitorHash } from "@/lib/analytics";
import { clientIp, withinLimit } from "@/lib/rate-limit";
import { isSameOrigin } from "@/lib/same-origin";

// Page views sent by the site's tracker (components/site/page-view-tracker.tsx). Location comes
// from Vercel's request headers, so it is the country and city of the visitor's network, not a GPS.

const header = (request: Request, name: string) => {
  const value = request.headers.get(name);
  if (!value) return null;
  try {
    return decodeURIComponent(value).slice(0, 80);
  } catch {
    return value.slice(0, 80);
  }
};

const clip = (value: unknown, max: number) => (typeof value === "string" && value ? value.slice(0, max) : null);

export async function POST(request: Request) {
  if (!isSameOrigin(request)) return new Response(null, { status: 204 });
  const userAgent = request.headers.get("user-agent") ?? "";
  if (isBot(userAgent)) return new Response(null, { status: 204 });
  // A normal visitor views far fewer than this; it stops one script filling the table.
  if (!(await withinLimit("track", 120, 600))) return new Response(null, { status: 204 });

  const body = await request.json().catch(() => null);
  const path = clip(body?.path, 300);
  if (!path?.startsWith("/") || path.startsWith("/dashboard") || path.startsWith("/api")) return new Response(null, { status: 204 });

  let referrerHost: string | null = null;
  const referrer = clip(body?.referrer, 500);
  if (referrer) {
    try {
      const url = new URL(referrer);
      const ownHost = request.headers.get("x-forwarded-host") ?? request.headers.get("host");
      // Moving between our own pages is not a new source.
      if (url.host !== ownHost && /^https?:$/.test(url.protocol)) referrerHost = url.hostname.toLowerCase();
    } catch {}
  }

  const day = new Date().toISOString().slice(0, 10);
  await db.pageView.create({
    data: {
      path,
      source: trafficSource(referrerHost, clip(body?.utmSource, 100)),
      referrer: referrerHost,
      utmMedium: clip(body?.utmMedium, 100),
      utmCampaign: clip(body?.utmCampaign, 150),
      country: header(request, "x-vercel-ip-country"),
      region: header(request, "x-vercel-ip-country-region"),
      city: header(request, "x-vercel-ip-city"),
      device: deviceType(userAgent),
      browser: describeDevice(userAgent).split(" on ")[0],
      visitorHash: visitorHash(await clientIp(), userAgent, day),
    },
  });
  return new Response(null, { status: 204 });
}
