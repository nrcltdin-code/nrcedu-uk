// The public address of the site, from APP_URL, without a trailing slash. Used for absolute
// links in the sitemap, robots.txt and social previews.
export const siteUrl = (process.env.APP_URL || "http://localhost:3000").replace(/\/+$/, "");

// Self-hosted (Railway etc.), Next.js can't reliably infer the origin for a Server Action
// redirect that lands on a different dynamic route (it falls back to the app's own bind
// address, e.g. http://localhost:8080). Giving redirect() an absolute URL sidesteps that guess.
export const redirectPath = (path: string) => `${siteUrl}${path}`;
