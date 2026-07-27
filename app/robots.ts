import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://yeongjong-detre-landing.vercel.app";
  return {
    rules: { userAgent: "*", allow: "/", disallow: ["/thank-you", "/api/"] },
    sitemap: `${siteUrl}/sitemap.xml`,
  };
}
