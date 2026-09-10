import type { Metadata, Viewport } from "next";
import "./globals.css";

const googleSiteVerification = process.env.GOOGLE_SITE_VERIFICATION?.trim();
const naverSiteVerification = process.env.NAVER_SITE_VERIFICATION?.trim();


export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#101a2a",
};

export const metadata: Metadata = {
  metadataBase: new URL("https://exio.kr"),
  title: {
    default: "EXIO | 분양 현장 안내",
    template: "%s | EXIO",
  },
  applicationName: "EXIO",
  creator: "EXIO",
  publisher: "EXIO",
  formatDetection: { email: false, address: false, telephone: false },
  manifest: "/manifest.webmanifest",
  verification:
    googleSiteVerification || naverSiteVerification
      ? {
          ...(googleSiteVerification
            ? { google: googleSiteVerification }
            : {}),
          ...(naverSiteVerification
            ? {
                other: {
                  "naver-site-verification": naverSiteVerification,
                },
              }
            : {}),
        }
      : undefined,
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="ko">
      <body><a className="skipLink" href="#main-content">본문으로 바로가기</a>{children}</body>
    </html>
  );
}
