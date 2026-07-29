import type { Metadata, Viewport } from "next";
import { getSiteUrl } from "@/lib/site-url";
import "./globals.css";

const siteUrl = getSiteUrl();


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
  applicationName: "영종 디에트르 라 메르",
  creator: "영종 디에트르 라 메르",
  publisher: "영종 디에트르 라 메르",
  formatDetection: { email: false, address: false, telephone: false },
  manifest: "/manifest.webmanifest",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="ko">
      <body><a className="skipLink" href="#main-content">본문으로 바로가기</a>{children}</body>
    </html>
  );
}
