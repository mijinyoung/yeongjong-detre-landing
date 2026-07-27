import type { Metadata, Viewport } from "next";
import "./globals.css";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://yeongjong-detre-landing.vercel.app";


export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#07162b",
};

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "영종 디에트르 라 메르 | 관심고객 등록",
    template: "%s | 영종 디에트르 라 메르",
  },
  description: "청라하늘대교 생활권, 최고 49층 영종 디에트르 라 메르 분양 안내 및 관심고객 등록",
  keywords: ["영종 디에트르", "영종 디에트르 라 메르", "청라하늘대교", "영종 분양", "관심고객 등록"],
  alternates: { canonical: "/" },
  category: "real estate",
  openGraph: {
    type: "website",
    locale: "ko_KR",
    url: "/",
    title: "영종 디에트르 라 메르",
    description: "청라하늘대교 생활권, 최고 49층 랜드마크 분양 안내",
    siteName: "영종 디에트르 라 메르",
    images: [{ url: "/images/hero-v2.png", width: 1536, height: 1024, alt: "영종 디에트르 라 메르 투시도" }],
  },
  twitter: { card: "summary_large_image", title: "영종 디에트르 라 메르", description: "청라하늘대교 생활권, 최고 49층 랜드마크 분양 안내", images: ["/images/hero-v2.png"] },
  robots: { index: true, follow: true },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="ko">
      <body><a className="skipLink" href="#main-content">본문으로 바로가기</a>{children}</body>
    </html>
  );
}
