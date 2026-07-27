"use client";

import Script from "next/script";
import { useEffect, useState } from "react";
import {
  ANALYTICS_CONSENT_EVENT,
  hasAnalyticsConsent,
} from "@/lib/analytics";

export default function GoogleAnalytics() {
  const measurementId = process.env.NEXT_PUBLIC_GA_ID;
  const [enabled, setEnabled] = useState(false);

  useEffect(() => {
    const update = () => setEnabled(hasAnalyticsConsent());
    update();
    window.addEventListener(ANALYTICS_CONSENT_EVENT, update);
    return () => window.removeEventListener(ANALYTICS_CONSENT_EVENT, update);
  }, []);

  if (!measurementId || !enabled) return null;

  return (
    <>
      <Script
        src={`https://www.googletagmanager.com/gtag/js?id=${measurementId}`}
        strategy="afterInteractive"
      />
      <Script id="google-analytics" strategy="afterInteractive">
        {`
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          window.gtag = gtag;
          gtag('js', new Date());
          gtag('config', '${measurementId}', { send_page_view: true });
        `}
      </Script>
    </>
  );
}
