import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "영종 디에트르 라 메르 | 관심고객 등록",
  description: "영종 디에트르 라 메르 분양 안내와 관심고객 등록",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="ko">
      <body>{children}</body>
    </html>
  );
}
