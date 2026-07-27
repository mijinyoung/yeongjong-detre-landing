export type TrackingPayload = Record<string, string | number | boolean | undefined>;

export type AnalyticsConsent = "accepted" | "rejected" | null;

export const ANALYTICS_CONSENT_KEY = "yd_analytics_consent";
export const ANALYTICS_CONSENT_EVENT = "analytics-consent-changed";

declare global {
  interface Window {
    dataLayer?: unknown[];
    fbq?: (...args: unknown[]) => void;
    gtag?: (...args: unknown[]) => void;
  }
}

export function getAnalyticsConsent(): AnalyticsConsent {
  if (typeof window === "undefined") return null;
  const value = window.localStorage.getItem(ANALYTICS_CONSENT_KEY);
  return value === "accepted" || value === "rejected" ? value : null;
}

export function hasAnalyticsConsent() {
  return getAnalyticsConsent() === "accepted";
}

export function setAnalyticsConsent(value: Exclude<AnalyticsConsent, null>) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(ANALYTICS_CONSENT_KEY, value);
  window.dispatchEvent(
    new CustomEvent(ANALYTICS_CONSENT_EVENT, { detail: { value } }),
  );
}

export function openAnalyticsSettings() {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent("open-analytics-settings"));
}

export function trackEvent(event: string, payload: TrackingPayload = {}) {
  if (typeof window === "undefined" || !hasAnalyticsConsent()) return;

  window.dataLayer = window.dataLayer || [];
  window.dataLayer.push({ event, ...payload });

  if (typeof window.gtag === "function") {
    window.gtag("event", event, payload);
  }

  if (typeof window.fbq === "function") {
    if (event === "lead_complete") {
      window.fbq("track", "Lead", payload);
    } else {
      window.fbq("trackCustom", event, payload);
    }
  }
}

export function openLeadModal(placement: string) {
  if (typeof window === "undefined") return;
  trackEvent("lead_cta_click", { placement });
  window.dispatchEvent(
    new CustomEvent("open-lead-modal", { detail: { placement } }),
  );
}


export function trackLeadComplete(
  eventId: string,
  payload: TrackingPayload = {},
) {
  if (typeof window === "undefined" || !hasAnalyticsConsent()) return;

  window.dataLayer = window.dataLayer || [];
  window.dataLayer.push({ event: "lead_complete", event_id: eventId, ...payload });

  if (typeof window.gtag === "function") {
    window.gtag("event", "generate_lead", {
      event_id: eventId,
      ...payload,
    });
  }

  if (typeof window.fbq === "function") {
    window.fbq("track", "Lead", payload, { eventID: eventId });
  }
}
