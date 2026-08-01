import type { Metadata } from "next";
import { Suspense } from "react";
import AdvertisingTracking from "@/components/AdvertisingTracking";
import ConversionTracker from "@/components/ConversionTracker";
import ThankYouClient from "@/components/ThankYouClient";
import { projectConfig } from "@/data/project-config";

export const metadata: Metadata = {
  title: "관심고객 등록 완료",
  description: `${projectConfig.identity.name} 관심고객 등록 완료 페이지`,
  robots: { index: false, follow: false },
};

export default function ThankYouPage() {
  return (
    <>
      <AdvertisingTracking />
      <ConversionTracker />
      <Suspense fallback={<main className="thankYouPage" id="main-content" />}>
        <ThankYouClient />
      </Suspense>
    </>
  );
}
