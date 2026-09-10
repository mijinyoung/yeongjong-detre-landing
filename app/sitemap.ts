import type { MetadataRoute } from "next";

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    {
      url: "https://exio.kr",
      changeFrequency: "weekly",
      priority: 1,
    },
  ];
}
