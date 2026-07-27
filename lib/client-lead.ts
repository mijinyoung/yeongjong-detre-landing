export function formatPhoneInput(value: string) {
  const digits = value.replace(/\D/g, "").slice(0, 11);
  if (digits.length <= 3) return digits;
  if (digits.length <= 7) return `${digits.slice(0, 3)}-${digits.slice(3)}`;
  return `${digits.slice(0, 3)}-${digits.slice(3, 7)}-${digits.slice(7)}`;
}

export function getLeadAttribution() {
  if (typeof window === "undefined") {
    return { source: "direct", campaign: "", content: "" };
  }

  const params = new URLSearchParams(window.location.search);
  return {
    source: params.get("utm_source") || sessionStorage.getItem("utm_source") || "direct",
    campaign: params.get("utm_campaign") || sessionStorage.getItem("utm_campaign") || "",
    content: params.get("utm_content") || sessionStorage.getItem("utm_content") || "",
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
    return {
      eventId,
      analyticsConsent: false,
      fbp: "",
      fbc: "",
    };
  }

  return {
    eventId,
    analyticsConsent:
      window.localStorage.getItem("yd_analytics_consent") === "accepted",
    fbp: readCookie("_fbp"),
    fbc: readCookie("_fbc"),
  };
}
