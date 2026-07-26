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
