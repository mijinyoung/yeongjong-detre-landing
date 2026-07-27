"use client";

import Script from "next/script";
import { useEffect, useMemo, useState } from "react";
import {
  ANALYTICS_CONSENT_EVENT,
  hasAnalyticsConsent,
} from "@/lib/analytics";

export default function GoogleAnalytics() {
  const gaId = process.env.NEXT_PUBLIC_GA_ID;
  const adsId = process.env.NEXT_PUBLIC_GOOGLE_ADS_ID;
  const [enabled, setEnabled] = useState(false);

  useEffect(() => {
    const update = () => setEnabled(hasAnalyticsConsent());
    update();

    window.addEventListener(ANALYTICS_CONSENT_EVENT, update);
    return () =>
      window.removeEventListener(
        ANALYTICS_CONSENT_EVENT,
        update,
      );
  }, []);

  const primaryId = useMemo(
    () => gaId || adsId || "",
    [gaId, adsId],
  );

  if (!primaryId || !enabled) return null;

  return (
    <>
      <Script
        src={`https://www.googletagmanager.com/gtag/js?id=${primaryId}`}
        strategy="afterInteractive"
      />
      <Script id="google-tag" strategy="afterInteractive">
        {`
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          window.gtag = gtag;
          gtag('js', new Date());
          ${
            gaId
              ? `gtag('config', '${gaId}', {
                  send_page_view: true,
                  transport_type: 'beacon'
                });`
              : ""
          }
          ${
            adsId
              ? `gtag('config', '${adsId}', {
                  send_page_view: false
                });`
              : ""
          }
        `}
      </Script>
    </>
  );
}
