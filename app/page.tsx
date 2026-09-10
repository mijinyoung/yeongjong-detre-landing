import type { Metadata } from "next";
import PortfolioHub from "@/components/PortfolioHub";

export const metadata: Metadata = {
  title: "EXIO | 분양 현장 안내",
  description: "EXIO가 운영하는 분양 현장을 지역별·연도별로 확인할 수 있는 공식 안내 페이지",
  alternates: { canonical: "https://exio.kr" },
  category: "real estate",
  openGraph: {
    type: "website",
    locale: "ko_KR",
    url: "https://exio.kr",
    title: "EXIO | 분양 현장 안내",
    description: "EXIO가 운영하는 분양 현장을 지역별·연도별로 확인할 수 있는 공식 안내 페이지",
    siteName: "EXIO",
  },
  twitter: {
    card: "summary",
    title: "EXIO | 분양 현장 안내",
    description: "EXIO가 운영하는 분양 현장을 지역별·연도별로 확인할 수 있는 공식 안내 페이지",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
      "max-video-preview": -1,
    },
  },
};

export default function Home() {
  return <PortfolioHub />;
}
