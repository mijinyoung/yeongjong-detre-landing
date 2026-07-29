import type { MetadataRoute } from "next";
import { projectConfig, publicAssetPath } from "@/data/project-config";
import { getSiteUrl } from "@/lib/site-url";

export default function sitemap(): MetadataRoute.Sitemap {
  const siteUrl = getSiteUrl();

  return [
    {
      url: siteUrl,
      changeFrequency: "weekly",
      priority: 1,
      images: projectConfig.assets.sitemapImages.map((image) => `${siteUrl}${publicAssetPath(image)}`),
      videos: projectConfig.display.videos ? projectConfig.sections.videos.items.map((video) => ({
        title: `${projectConfig.identity.name} ${video.label}`,
        description: video.description,
        thumbnail_loc: `${siteUrl}${publicAssetPath(video.poster)}`,
        content_loc: `${siteUrl}${publicAssetPath(video.src)}`,
        duration: video.durationSeconds,
        family_friendly: "yes" as const,
      })) : [],
    },
  ];
}
