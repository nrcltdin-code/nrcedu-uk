"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";

// Sends one page view per page the visitor opens, including moves inside the site.
// No cookies or storage. The referrer and campaign tags are only sent with the first view,
// since later pages were reached from our own site.
export function PageViewTracker() {
  const pathname = usePathname();
  const first = useRef(true);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const isFirst = first.current;
    first.current = false;
    const body = JSON.stringify({
      path: pathname,
      referrer: isFirst ? document.referrer : "",
      utmSource: isFirst ? params.get("utm_source") : null,
      utmMedium: isFirst ? params.get("utm_medium") : null,
      utmCampaign: isFirst ? params.get("utm_campaign") : null,
    });
    fetch("/api/track", { method: "POST", body, headers: { "content-type": "application/json" }, keepalive: true }).catch(() => {});
  }, [pathname]);

  return null;
}
