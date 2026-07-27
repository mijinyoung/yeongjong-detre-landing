export type TrackingPayload = Record<
  string,
  string | number | boolean | undefined
>;

export type AnalyticsConsent = "accepted" | "rejected" | null;

export const ANALYTICS_CONSENT_KEY = "yd_analytics_consent";
export const ANALYTICS_CONSENT_EVENT = "analytics-consent-changed";

const SESSION_ID_KEY = "yd_session_id";
const LEAD_EVENT_PREFIX = "yd_lead_sent_";

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

export function setAnalyticsConsent(
  value: Exclude<AnalyticsConsent, null>,
) {
  if (typeof window === "undefined") return;

  window.localStorage.setItem(ANALYTICS_CONSENT_KEY, value);
  window.dispatchEvent(
    new CustomEvent(ANALYTICS_CONSENT_EVENT, {
      detail: { value },
    }),
  );
}

export function openAnalyticsSettings() {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent("open-analytics-settings"));
}

export function getTrackingSessionId() {
  if (typeof window === "undefined") return "";

  const existing = window.sessionStorage.getItem(SESSION_ID_KEY);
  if (existing) return existing;

  const created =
    typeof crypto !== "undefined" &&
    typeof crypto.randomUUID === "function"
      ? crypto.randomUUID()
      : `session-${Date.now()}-${Math.random().toString(16).slice(2)}`;

  window.sessionStorage.setItem(SESSION_ID_KEY, created);
  return created;
}

function getCommonTrackingPayload(): TrackingPayload {
  if (typeof window === "undefined") return {};

  return {
    tracking_session_id: getTrackingSessionId(),
    page_path: window.location.pathname,
    page_title: document.title,
  };
}

export function trackEvent(
  event: string,
  payload: TrackingPayload = {},
) {
  if (typeof window === "undefined" || !hasAnalyticsConsent()) return;

  const completePayload = {
    ...getCommonTrackingPayload(),
    ...payload,
  };

  window.dataLayer = window.dataLayer || [];
  window.dataLayer.push({
    event,
    ...completePayload,
  });

  if (typeof window.gtag === "function") {
    window.gtag("event", event, completePayload);
  }

  if (typeof window.fbq === "function") {
    const standardMetaEvents: Record<string, string> = {
      lead_complete: "Lead",
      phone_click: "Contact",
      lead_cta_click: "Contact",
      brochure_view: "ViewContent",
    };

    const metaEvent = standardMetaEvents[event];

    if (metaEvent) {
      window.fbq("track", metaEvent, completePayload);
    } else {
      window.fbq("trackCustom", event, completePayload);
    }
  }
}

export function openLeadModal(placement: string) {
  if (typeof window === "undefined") return;

  trackEvent("lead_cta_click", { placement });
  window.dispatchEvent(
    new CustomEvent("open-lead-modal", {
      detail: { placement },
    }),
  );
}

export function trackLeadComplete(
  eventId: string,
  payload: TrackingPayload = {},
) {
  if (
    typeof window === "undefined" ||
    !hasAnalyticsConsent() ||
    !eventId
  ) {
    return;
  }

  const dedupeKey = `${LEAD_EVENT_PREFIX}${eventId}`;
  if (window.sessionStorage.getItem(dedupeKey)) return;
  window.sessionStorage.setItem(dedupeKey, "1");

  const completePayload = {
    ...getCommonTrackingPayload(),
    event_id: eventId,
    ...payload,
  };

  window.dataLayer = window.dataLayer || [];
  window.dataLayer.push({
    event: "lead_complete",
    ...completePayload,
  });

  if (typeof window.gtag === "function") {
    window.gtag("event", "generate_lead", completePayload);

    const googleAdsId =
      process.env.NEXT_PUBLIC_GOOGLE_ADS_ID;
    const googleAdsLabel =
      process.env.NEXT_PUBLIC_GOOGLE_ADS_LEAD_LABEL;

    if (googleAdsId && googleAdsLabel) {
      window.gtag("event", "conversion", {
        send_to: `${googleAdsId}/${googleAdsLabel}`,
        transaction_id: eventId,
      });
    }
  }

  if (typeof window.fbq === "function") {
    window.fbq(
      "track",
      "Lead",
      completePayload,
      { eventID: eventId },
    );
  }
}
