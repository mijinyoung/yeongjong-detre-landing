export type TrackingPayload = Record<string, string | number | boolean | undefined>;

declare global {
  interface Window {
    dataLayer?: unknown[];
    fbq?: (...args: unknown[]) => void;
    gtag?: (...args: unknown[]) => void;
  }
}

export function trackEvent(event: string, payload: TrackingPayload = {}) {
  if (typeof window === "undefined") return;

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
  window.dispatchEvent(new CustomEvent("open-lead-modal", { detail: { placement } }));
}
