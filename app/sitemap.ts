import type { MetadataRoute } from "next";
import { getSiteUrl } from "@/lib/site-url";

export default function sitemap(): MetadataRoute.Sitemap {
  const siteUrl = getSiteUrl();

  return [
    {
      url: siteUrl,
      changeFrequency: "weekly",
      priority: 1,
      images: [
        `${siteUrl}/images/hero-og.jpg`,
        `${siteUrl}/images/video/hero-poster-v95.webp`,
      ],
      videos: [
        {
          title: "영종 디에트르 라 메르 브랜드 영상",
          description: "영종 디에트르 라 메르의 스카이라인과 주거 가치를 소개하는 브랜드 영상",
          thumbnail_loc: `${siteUrl}/images/video/brand-poster-v95.webp`,
          content_loc: `${siteUrl}/videos/brand-film.mp4`,
          duration: 100,
          family_friendly: "yes",
        },
        {
          title: "영종 디에트르 라 메르 단지 홍보영상",
          description: "단지 구성, 커뮤니티, 조경과 세대 계획을 소개하는 공식 홍보영상",
          thumbnail_loc: `${siteUrl}/images/video/complex-poster-v95.webp`,
          content_loc: `${siteUrl}/videos/complex-film.mp4`,
          duration: 211,
          family_friendly: "yes",
        },
      ],
    },
  ];
}
