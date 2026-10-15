// The public address of the site, from APP_URL, without a trailing slash. Used for absolute
// links in the sitemap, robots.txt and social previews.
export const siteUrl = (process.env.APP_URL || "http://localhost:3000").replace(/\/+$/, "");
