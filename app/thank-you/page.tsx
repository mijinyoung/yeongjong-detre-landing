import type { Metadata } from "next";
import { Suspense } from "react";
import MetaPixel from "@/components/MetaPixel";
import GoogleAnalytics from "@/components/GoogleAnalytics";
import ConversionTracker from "@/components/ConversionTracker";
import ThankYouClient from "@/components/ThankYouClient";

export const metadata: Metadata = {
  title: "관심고객 등록 완료",
  description: "영종 디에트르 라 메르 관심고객 등록 완료 페이지",
  robots: { index: false, follow: false },
};

export default function ThankYouPage() {
  return (
    <>
      <MetaPixel />
      <GoogleAnalytics />
      <ConversionTracker />
      <Suspense fallback={<main className="thankYouPage" />}>
        <ThankYouClient />
      </Suspense>
    </>
  );
}
