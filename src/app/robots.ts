import { MetadataRoute } from "next";

const BASE = process.env.NEXT_PUBLIC_SITE_URL ?? "https://caranalizer.com";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: ["/", "/api/sitemaps/"],
        disallow: ["/api/"],
      },
    ],
    sitemap: [`${BASE}/api/sitemaps/index`],
  };
}
