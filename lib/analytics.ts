import { projectConfig } from "@/data/project-config";

export type TrackingPayload = Record<
  string,
  string | number | boolean | undefined
>;

export type AnalyticsConsent = "accepted" | "rejected" | null;

export const ANALYTICS_CONSENT_KEY = "yd_analytics_consent";
export const ANALYTICS_CONSENT_EVENT = "analytics-consent-changed";

const SESSION_ID_KEY = "yd_session_id";
const LEAD_EVENT_PREFIX = "yd_lead_sent_";
const TRACKING_MODE =
  process.env.NEXT_PUBLIC_TRACKING_MODE?.trim().toLowerCase() === "gtm"
    ? "gtm"
    : "direct";
const TRACKING_DEBUG =
  process.env.NEXT_PUBLIC_TRACKING_DEBUG?.trim().toLowerCase() === "true";

declare global {
  interface Window {
    dataLayer?: unknown[];
    fbq?: (...args: unknown[]) => void;
    gtag?: (...args: unknown[]) => void;
    kakaoPixel?: (trackId: string) => {
      pageView: (tag?: string) => void;
      participation: (tag?: string) => void;
    };
    wcs?: {
      inflow: (domain: string) => void;
      trans: (event: { type: string; id?: string }) => void;
    };
    wcs_add?: Record<string, string | undefined>;
    wcs_do?: () => void;
    __propertyCampaignKakaoPageViews?: Record<string, boolean>;
    __propertyCampaignNaverPageViews?: Record<string, boolean>;
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
    project_code: projectConfig.projectCode,
    project_name: projectConfig.identity.name,
    page_path: window.location.pathname,
    page_title: document.title,
  };
}

function logTrackingEvent(
  event: string,
  payload: TrackingPayload,
) {
  if (!TRACKING_DEBUG) return;

  // 광고 운영 점검용 로그입니다. 이름과 전화번호 같은 개인정보는 넣지 않습니다.
  console.info(
    `[TRACKING_EVENT] ${JSON.stringify({
      event,
      ...payload,
    })}`,
  );
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
  logTrackingEvent(event, completePayload);

  if (TRACKING_MODE === "gtm") return;

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
  const leadEventPayload = {
    event: "generate_lead",
    event_alias: "lead_complete",
    conversion_name: "consultation_complete",
    ...completePayload,
  };
  window.dataLayer.push(leadEventPayload);
  logTrackingEvent("generate_lead", leadEventPayload);

  if (TRACKING_MODE === "gtm") return;

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

  const kakaoTrackId = process.env.NEXT_PUBLIC_KAKAO_PIXEL_ID?.trim() || "";
  const kakaoLeadTag = process.env.NEXT_PUBLIC_KAKAO_LEAD_TAG?.trim() || "Consulting";
  if (kakaoTrackId && typeof window.kakaoPixel === "function") {
    window.kakaoPixel(kakaoTrackId).participation(kakaoLeadTag);
  }

  const naverLeadTypeValue =
    process.env.NEXT_PUBLIC_NAVER_WCS_LEAD_TYPE?.trim() || "lead";
  const naverLeadType =
    naverLeadTypeValue === "test_lead" ? "test_lead" : "lead";
  if (window.wcs && typeof window.wcs.trans === "function") {
    window.wcs.trans({ type: naverLeadType, id: eventId });
  }
}
