import type { Metadata, Viewport } from "next";
import type { CSSProperties } from "react";
import { projectConfig } from "@/data/project-config";
import { getSiteUrl } from "@/lib/site-url";
import "./globals.css";

const siteUrl = getSiteUrl();


export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: projectConfig.theme.browserTheme,
};

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: projectConfig.seo.title,
    template: projectConfig.seo.titleTemplate,
  },
  applicationName: projectConfig.identity.name,
  creator: projectConfig.identity.name,
  publisher: projectConfig.identity.name,
  formatDetection: { email: false, address: false, telephone: false },
  manifest: "/manifest.webmanifest",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const themeStyle = {
    "--navy": projectConfig.theme.primary,
    "--navy2": projectConfig.theme.primaryAlt,
    "--gold": projectConfig.theme.accent,
    "--cream": projectConfig.theme.surface,
    "--ink": projectConfig.theme.text,
  } as CSSProperties;

  return (
    <html lang={projectConfig.seo.language.split("-")[0]} style={themeStyle}>
      <body><a className="skipLink" href="#main-content">본문으로 바로가기</a>{children}</body>
    </html>
  );
}
