"use client";

import { useEffect } from "react";
import {
  getTrackingSessionId,
  trackEvent,
} from "@/lib/analytics";

const ATTRIBUTION_KEYS = [
  "utm_source",
  "utm_medium",
  "utm_campaign",
  "utm_content",
  "utm_term",
  "gclid",
  "fbclid",
] as const;

export default function UtmCapture() {
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    let hasCampaignValue = false;

    ATTRIBUTION_KEYS.forEach((key) => {
      const value = params.get(key);
      if (!value) return;

      window.sessionStorage.setItem(key, value);
      hasCampaignValue = true;
    });

    if (!window.sessionStorage.getItem("landing_page")) {
      window.sessionStorage.setItem(
        "landing_page",
        `${window.location.pathname}${window.location.search}`,
      );
    }

    if (!window.sessionStorage.getItem("landing_referrer")) {
      window.sessionStorage.setItem(
        "landing_referrer",
        document.referrer || "",
      );
    }

    getTrackingSessionId();

    trackEvent("landing_view", {
      has_campaign: hasCampaignValue,
      source:
        params.get("utm_source") ||
        window.sessionStorage.getItem("utm_source") ||
        "direct",
    });
  }, []);

  return null;
}
