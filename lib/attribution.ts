export const ATTRIBUTION_KEYS = [
  "utm_source",
  "utm_medium",
  "utm_campaign",
  "utm_content",
  "utm_term",
  "gclid",
  "fbclid",
] as const;

const ATTRIBUTION_STORAGE_KEY = "yd_campaign_attribution";
const ANALYTICS_CONSENT_KEY = "yd_analytics_consent";
const ATTRIBUTION_TTL_MS = 30 * 24 * 60 * 60 * 1000;

type AttributionKey = (typeof ATTRIBUTION_KEYS)[number];

type StoredAttribution = {
  values: Partial<Record<AttributionKey, string>>;
  landingPage: string;
  landingReferrer: string;
  capturedAt: number;
  expiresAt: number;
};

function safeSessionGet(key: string) {
  try {
    return window.sessionStorage.getItem(key) || "";
  } catch {
    return "";
  }
}

function safeSessionSet(key: string, value: string) {
  try {
    window.sessionStorage.setItem(key, value);
  } catch {
    // Some private browsing modes can disable browser storage.
  }
}

function readStoredAttribution() {
  try {
    const raw = window.localStorage.getItem(ATTRIBUTION_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<StoredAttribution>;

    if (
      !parsed.values ||
      typeof parsed.expiresAt !== "number" ||
      parsed.expiresAt <= Date.now()
    ) {
      window.localStorage.removeItem(ATTRIBUTION_STORAGE_KEY);
      return null;
    }

    return parsed as StoredAttribution;
  } catch {
    return null;
  }
}

function writeStoredAttribution() {
  const values: Partial<Record<AttributionKey, string>> = {};

  ATTRIBUTION_KEYS.forEach((key) => {
    const value = safeSessionGet(key).trim().slice(0, 200);
    if (value) values[key] = value;
  });

  if (!Object.keys(values).length) return;

  const capturedAt = Date.now();
  const stored: StoredAttribution = {
    values,
    landingPage: safeSessionGet("landing_page"),
    landingReferrer: safeSessionGet("landing_referrer"),
    capturedAt,
    expiresAt: capturedAt + ATTRIBUTION_TTL_MS,
  };

  try {
    window.localStorage.setItem(
      ATTRIBUTION_STORAGE_KEY,
      JSON.stringify(stored),
    );
  } catch {
    // Session attribution still remains available when persistent storage fails.
  }
}

function hydrateStoredAttribution() {
  const stored = readStoredAttribution();
  if (!stored) return;

  ATTRIBUTION_KEYS.forEach((key) => {
    const value = stored.values[key];
    if (value && !safeSessionGet(key)) safeSessionSet(key, value);
  });

  if (stored.landingPage && !safeSessionGet("landing_page")) {
    safeSessionSet("landing_page", stored.landingPage);
  }
  if (stored.landingReferrer && !safeSessionGet("landing_referrer")) {
    safeSessionSet("landing_referrer", stored.landingReferrer);
  }
}

export function clearPersistentAttribution() {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(ATTRIBUTION_STORAGE_KEY);
  } catch {
    // Nothing else is required when storage is unavailable.
  }
}

export function persistSessionAttribution() {
  if (typeof window === "undefined") return;
  writeStoredAttribution();
}

export function captureAttribution(persistAllowed: boolean) {
  if (typeof window === "undefined") {
    return { hasCampaignValue: false, source: "direct" };
  }

  const params = new URLSearchParams(window.location.search);
  let hasCampaignValue = false;

  ATTRIBUTION_KEYS.forEach((key) => {
    const value = params.get(key)?.trim().slice(0, 200) || "";
    if (!value) return;
    safeSessionSet(key, value);
    hasCampaignValue = true;
  });

  if (!safeSessionGet("landing_page")) {
    safeSessionSet("landing_page", window.location.href);
  }
  if (!safeSessionGet("landing_referrer")) {
    safeSessionSet("landing_referrer", document.referrer || "");
  }

  if (persistAllowed) {
    if (hasCampaignValue) writeStoredAttribution();
    else hydrateStoredAttribution();
  }

  return {
    hasCampaignValue,
    source:
      params.get("utm_source") ||
      safeSessionGet("utm_source") ||
      "direct",
  };
}

export function getAttributionSnapshot() {
  if (typeof window === "undefined") {
    return {
      source: "direct",
      medium: "",
      campaign: "",
      content: "",
      term: "",
      gclid: "",
      fbclid: "",
      landingPage: "",
      landingReferrer: "",
    };
  }

  const params = new URLSearchParams(window.location.search);
  const persistentAllowed = (() => {
    try {
      return window.localStorage.getItem(ANALYTICS_CONSENT_KEY) === "accepted";
    } catch {
      return false;
    }
  })();
  const stored = persistentAllowed ? readStoredAttribution() : null;
  const read = (key: AttributionKey) =>
    params.get(key) ||
    safeSessionGet(key) ||
    stored?.values[key] ||
    "";

  return {
    source: read("utm_source") || "direct",
    medium: read("utm_medium"),
    campaign: read("utm_campaign"),
    content: read("utm_content"),
    term: read("utm_term"),
    gclid: read("gclid"),
    fbclid: read("fbclid"),
    landingPage:
      safeSessionGet("landing_page") || stored?.landingPage || window.location.href,
    landingReferrer:
      safeSessionGet("landing_referrer") || stored?.landingReferrer || "",
  };
}
