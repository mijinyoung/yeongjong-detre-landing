"use client";

import { useEffect } from "react";
import {
  ANALYTICS_CONSENT_EVENT,
  getAnalyticsConsent,
  getTrackingSessionId,
  trackEvent,
} from "@/lib/analytics";
import {
  captureAttribution,
  clearPersistentAttribution,
  persistSessionAttribution,
} from "@/lib/attribution";

export default function UtmCapture() {
  useEffect(() => {
    const initialConsent = getAnalyticsConsent();
    const attribution = captureAttribution(initialConsent === "accepted");
    let landingTracked = false;

    getTrackingSessionId();

    const trackLanding = () => {
      if (landingTracked || getAnalyticsConsent() !== "accepted") return;
      landingTracked = true;
      trackEvent("landing_view", {
        has_campaign: attribution.hasCampaignValue,
        source: attribution.source,
      });
    };

    trackLanding();

    const onConsentChanged = () => {
      if (getAnalyticsConsent() === "accepted") {
        persistSessionAttribution();
        trackLanding();
      } else {
        clearPersistentAttribution();
      }
    };

    window.addEventListener(ANALYTICS_CONSENT_EVENT, onConsentChanged);
    return () =>
      window.removeEventListener(ANALYTICS_CONSENT_EVENT, onConsentChanged);
  }, []);

  return null;
}
