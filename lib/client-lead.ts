export type LeadApiResponse = {
  ok: boolean;
  leadId?: string;
  smsStatus?: string;
  requestId?: string;
  message: string;
};

const LEAD_REQUEST_TIMEOUT_MS = 15000;

export function formatPhoneInput(value: string) {
  const digits = value.replace(/\D/g, "").slice(0, 11);
  if (digits.length <= 3) return digits;
  if (digits.length <= 7) return `${digits.slice(0, 3)}-${digits.slice(3)}`;
  return `${digits.slice(0, 3)}-${digits.slice(3, 7)}-${digits.slice(7)}`;
}

export async function submitLead(payload: Record<string, unknown>): Promise<LeadApiResponse> {
  if (typeof navigator !== "undefined" && !navigator.onLine) {
    throw new Error("인터넷 연결이 끊겨 있습니다. 연결 상태를 확인한 뒤 다시 시도해 주세요.");
  }

  const controller = new AbortController();
  const timer = window.setTimeout(() => controller.abort(), LEAD_REQUEST_TIMEOUT_MS);

  try {
    const response = await fetch("/api/leads", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
      cache: "no-store",
      credentials: "same-origin",
      signal: controller.signal,
    });

    const raw = await response.text();
    let data: Partial<LeadApiResponse> = {};

    if (raw) {
      try {
        data = JSON.parse(raw) as Partial<LeadApiResponse>;
      } catch {
        throw new Error("서버 응답을 확인할 수 없습니다. 잠시 후 다시 시도해 주세요.");
      }
    }

    if (!response.ok || data.ok !== true) {
      throw new Error(data.message || "등록에 실패했습니다. 잠시 후 다시 시도해 주세요.");
    }

    return {
      ok: true,
      leadId: data.leadId || "",
      smsStatus: data.smsStatus || "",
      requestId: data.requestId || response.headers.get("x-request-id") || "",
      message: data.message || "관심고객 등록이 완료되었습니다.",
    };
  } catch (error) {
    if (error instanceof DOMException && error.name === "AbortError") {
      throw new Error("접수 요청 시간이 초과되었습니다. 인터넷 연결을 확인한 뒤 다시 시도해 주세요.");
    }
    if (error instanceof TypeError) {
      throw new Error("서버에 연결할 수 없습니다. 인터넷 연결을 확인한 뒤 다시 시도해 주세요.");
    }
    throw error;
  } finally {
    window.clearTimeout(timer);
  }
}

export function getLeadAttribution() {
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
  const read = (key: string) => params.get(key) || window.sessionStorage.getItem(key) || "";

  return {
    source: read("utm_source") || "direct",
    medium: read("utm_medium"),
    campaign: read("utm_campaign"),
    content: read("utm_content"),
    term: read("utm_term"),
    gclid: read("gclid"),
    fbclid: read("fbclid"),
    landingPage: window.sessionStorage.getItem("landing_page") || "",
    landingReferrer: window.sessionStorage.getItem("landing_referrer") || "",
  };
}

export function openPrivacyPolicy() {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent("open-privacy-policy"));
}

export function goToThankYou(leadId: string, placement: string) {
  if (typeof window === "undefined") return;
  const params = new URLSearchParams();
  if (leadId) params.set("receipt", leadId);
  if (placement) params.set("placement", placement);
  window.location.assign(`/thank-you?${params.toString()}`);
}

function readCookie(name: string) {
  if (typeof document === "undefined") return "";
  const escaped = name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const match = document.cookie.match(new RegExp(`(?:^|; )${escaped}=([^;]*)`));
  return match ? decodeURIComponent(match[1]) : "";
}

export function createLeadEventId() {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return `lead-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

export function getMetaLeadContext(eventId: string) {
  if (typeof window === "undefined") {
    return { eventId, analyticsConsent: false, fbp: "", fbc: "" };
  }

  return {
    eventId,
    analyticsConsent: window.localStorage.getItem("yd_analytics_consent") === "accepted",
    fbp: readCookie("_fbp"),
    fbc: readCookie("_fbc"),
  };
}
