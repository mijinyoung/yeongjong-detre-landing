"use client";

import Script from "next/script";
import { useEffect, useState } from "react";
import {
  ANALYTICS_CONSENT_EVENT,
  hasAnalyticsConsent,
} from "@/lib/analytics";

export default function NaverAdsTracking() {
  const accountId = process.env.NEXT_PUBLIC_NAVER_WCS_ACCOUNT_ID?.trim() || "";
  const configuredDomain = process.env.NEXT_PUBLIC_NAVER_WCS_DOMAIN?.trim() || "";
  const [enabled, setEnabled] = useState(false);

  useEffect(() => {
    const update = () => setEnabled(hasAnalyticsConsent());
    update();
    window.addEventListener(ANALYTICS_CONSENT_EVENT, update);
    return () => window.removeEventListener(ANALYTICS_CONSENT_EVENT, update);
  }, []);

  const initialize = () => {
    if (!accountId || !window.wcs || typeof window.wcs_do !== "function") return;

    window.wcs_add ||= {};
    window.wcs_add.wa = accountId;
    const domain = configuredDomain || window.location.hostname;
    window.wcs.inflow(domain);

    window.__propertyCampaignNaverPageViews ||= {};
    if (window.__propertyCampaignNaverPageViews[accountId]) return;

    window.wcs_do();
    window.__propertyCampaignNaverPageViews[accountId] = true;
  };

  if (!enabled || !accountId) return null;

  return (
    <Script
      id="naver-wcs"
      src="https://wcs.naver.net/wcslog.js"
      strategy="afterInteractive"
      onLoad={initialize}
      onReady={initialize}
    />
  );
}
