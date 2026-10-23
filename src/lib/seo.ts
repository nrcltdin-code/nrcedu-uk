import type { Metadata } from "next";
import { siteUrl } from "@/lib/site-url";
import type { SiteSettings } from "@/lib/settings";

// Search engine helpers: page metadata with a canonical address and share preview, and
// schema.org structured data (JSON-LD) for the public pages.

export const siteName = "NRC Educational Consultants";
export const defaultImage = "/nrc-logo.jpeg";

// Full address for a path or an already absolute URL (uploaded images live on another domain).
export const absoluteUrl = (pathOrUrl: string) => (/^https?:\/\//.test(pathOrUrl) ? pathOrUrl : `${siteUrl}${pathOrUrl}`);

// Search results cut descriptions at about 160 characters, so trim at a word boundary.
export function clip(text: string, max = 160) {
  const clean = text.replace(/\s+/g, " ").trim();
  if (clean.length <= max) return clean;
  return `${clean.slice(0, max - 1).replace(/\s+\S*$/, "")}…`;
}

type PageMeta = {
  title: string;
  description?: string;
  path: string;
  image?: string | null;
  type?: "website" | "article";
  publishedTime?: Date | null;
};

// Next replaces the whole openGraph object of the layout when a page sets one, so every page
// sets all of it here: title, description, address, image and site name.
export function pageMetadata({ title, description, path, image, type = "website", publishedTime }: PageMeta): Metadata {
  const desc = description ? clip(description) : undefined;
  const images = [image || defaultImage];
  return {
    title,
    description: desc,
    alternates: { canonical: path },
    openGraph: {
      type,
      siteName,
      locale: "en_GB",
      url: path,
      title,
      description: desc,
      images,
      ...(type === "article" && publishedTime ? { publishedTime: publishedTime.toISOString() } : {}),
    },
    twitter: { card: image ? "summary_large_image" : "summary", title, description: desc, images },
  };
}

// ---- Structured data ----

type Thing = Record<string, unknown>;

export const organizationId = `${siteUrl}/#organization`;

export function organizationLd({ contact, social }: SiteSettings): Thing {
  const sameAs = Object.values(social).filter(Boolean);
  return {
    "@type": ["Organization", "EducationalOrganization"],
    "@id": organizationId,
    name: siteName,
    url: siteUrl,
    logo: absoluteUrl(defaultImage),
    ...(contact.email ? { email: contact.email } : {}),
    ...(contact.phone ? { telephone: contact.phone } : {}),
    ...(contact.address ? { address: contact.address } : {}),
    ...(contact.phone || contact.email
      ? {
          contactPoint: {
            "@type": "ContactPoint",
            contactType: "customer service",
            ...(contact.phone ? { telephone: contact.phone } : {}),
            ...(contact.email ? { email: contact.email } : {}),
          },
        }
      : {}),
    ...(sameAs.length ? { sameAs } : {}),
  };
}

// Short form of the business for "publisher" and "author" fields on articles.
export const publisherLd: Thing = {
  "@type": "Organization",
  name: siteName,
  url: siteUrl,
  logo: { "@type": "ImageObject", url: absoluteUrl(defaultImage) },
};

export const websiteLd =(): Thing => ({
  "@type": "WebSite",
  "@id": `${siteUrl}/#website`,
  name: siteName,
  url: siteUrl,
  publisher: { "@id": organizationId },
});

// Page trail shown in search results, e.g. Home › Universities › Oxford.
export function breadcrumbLd(items: { name: string; path: string }[]): Thing {
  return {
    "@type": "BreadcrumbList",
    itemListElement: [{ name: "Home", path: "/" }, ...items].map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: absoluteUrl(item.path),
    })),
  };
}

// One or more schema.org objects as a JSON-LD string, with "<" escaped so text from the
// database cannot close the script tag.
export function serializeLd(things: Thing[]) {
  const body = things.length === 1 ? { "@context": "https://schema.org", ...things[0] } : { "@context": "https://schema.org", "@graph": things };
  return JSON.stringify(body).replace(/</g, "\\u003c");
}
