import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "영종 디에트르 라 메르",
    short_name: "영종 디에트르",
    description:
      "영종 디에트르 라 메르 분양 안내와 관심고객 등록을 위한 공식 안내 페이지",
    start_url: "/",
    display: "standalone",
    background_color: "#07162b",
    theme_color: "#07162b",
    lang: "ko-KR",
    icons: [
      {
        src: "/favicon.ico",
        sizes: "any",
        type: "image/x-icon",
      },
    ],
  };
}
