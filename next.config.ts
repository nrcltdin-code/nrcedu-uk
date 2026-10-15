import type { NextConfig } from "next";
import { imageHosts } from "./src/lib/image-hosts";

const nextConfig: NextConfig = {
  /* config options here */
  cacheComponents: true,
  partialPrefetching: true,
  // Addresses from the old site (see its sitemap), so search results and bookmarks keep working.
  // /test-prep/<test> and /services kept the same address.
  async redirects() {
    return [
      { source: "/about-us", destination: "/about", permanent: true },
      { source: "/blogs", destination: "/blog", permanent: true },
      { source: "/blogs/:path*", destination: "/blog", permanent: true },
      { source: "/university", destination: "/universities", permanent: true },
      { source: "/university/:path*", destination: "/universities", permanent: true },
      { source: "/affiliated-university", destination: "/partners", permanent: true },
      { source: "/recruitment-partner/become-agent", destination: "/become-an-agent", permanent: true },
      { source: "/recruitment-partner", destination: "/become-an-agent", permanent: true },
      { source: "/proceed", destination: "/consultation", permanent: true },
      { source: "/login", destination: "/?auth=login", permanent: true },
      { source: "/signup", destination: "/?auth=register", permanent: true },
      { source: "/reset-pass", destination: "/?auth=login", permanent: true },
    ];
  },
  images: {
    remotePatterns: imageHosts.map((hostname) => ({ protocol: "https" as const, hostname })),
  },
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
