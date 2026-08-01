"use client";

import Script from "next/script";
import { useEffect, useState } from "react";
import {
  ANALYTICS_CONSENT_EVENT,
  hasAnalyticsConsent,
} from "@/lib/analytics";

export default function KakaoPixel() {
  const trackId = process.env.NEXT_PUBLIC_KAKAO_PIXEL_ID?.trim() || "";
  const [enabled, setEnabled] = useState(false);

  useEffect(() => {
    const update = () => setEnabled(hasAnalyticsConsent());
    update();
    window.addEventListener(ANALYTICS_CONSENT_EVENT, update);
    return () => window.removeEventListener(ANALYTICS_CONSENT_EVENT, update);
  }, []);

  const initialize = () => {
    if (!trackId || typeof window.kakaoPixel !== "function") return;

    window.__propertyCampaignKakaoPageViews ||= {};
    if (window.__propertyCampaignKakaoPageViews[trackId]) return;

    window.kakaoPixel(trackId).pageView();
    window.__propertyCampaignKakaoPageViews[trackId] = true;
  };

  if (!enabled || !trackId) return null;

  return (
    <Script
      id="kakao-pixel"
      src="https://t1.daumcdn.net/kas/static/kp.js"
      strategy="afterInteractive"
      onLoad={initialize}
      onReady={initialize}
    />
  );
}
