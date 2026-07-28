export type LeadPayload = {
  name: string;
  phone: string;
  consent: boolean;
  source?: string;
  medium?: string;
  campaign?: string;
  content?: string;
  term?: string;
  gclid?: string;
  fbclid?: string;
  landingPage?: string;
  landingReferrer?: string;
  referrer?: string;
  pageUrl?: string;
  website?: string;
  placement?: string;
  eventId?: string;
  analyticsConsent?: boolean;
  fbp?: string;
  fbc?: string;
};

function cleanText(value: unknown, maxLength: number) {
  if (typeof value !== "string") return "";
  return value
    .replace(/[\u0000-\u001f\u007f]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, maxLength);
}

function cleanUrl(value: unknown) {
  const text = cleanText(value, 500);
  if (!text) return "";

  try {
    const url = new URL(text);
    return url.protocol === "https:" || url.protocol === "http:" ? url.toString() : "";
  } catch {
    return "";
  }
}

export function normalizePhone(value: string) {
  const digits = value.replace(/\D/g, "");
  if (digits.length === 11) return digits.replace(/(\d{3})(\d{4})(\d{4})/, "$1-$2-$3");
  if (digits.length === 10) return digits.replace(/(\d{3})(\d{3})(\d{4})/, "$1-$2-$3");
  return value.trim();
}

export function validateLead(input: unknown) {
  if (!input || typeof input !== "object" || Array.isArray(input)) {
    return { ok: false as const, message: "입력 내용을 확인해 주세요." };
  }

  const raw = input as Partial<LeadPayload>;
  const name = cleanText(raw.name, 30);
  const phone = normalizePhone(cleanText(raw.phone, 20));
  const validPhone = /^01[016789]-\d{3,4}-\d{4}$/.test(phone);

  if (cleanText(raw.website, 200)) {
    return { ok: false as const, message: "잘못된 요청입니다." };
  }
  if (name.length < 2) {
    return { ok: false as const, message: "이름을 확인해 주세요." };
  }
  if (!validPhone) {
    return { ok: false as const, message: "휴대폰 번호를 확인해 주세요." };
  }
  if (raw.consent !== true) {
    return {
      ok: false as const,
      message: "개인정보 수집 및 상담 연락 동의가 필요합니다.",
    };
  }

  return {
    ok: true as const,
    data: {
      name,
      phone,
      consent: true,
      source: cleanText(raw.source, 100) || "direct",
      medium: cleanText(raw.medium, 100),
      campaign: cleanText(raw.campaign, 150),
      content: cleanText(raw.content, 150),
      term: cleanText(raw.term, 150),
      gclid: cleanText(raw.gclid, 200),
      fbclid: cleanText(raw.fbclid, 200),
      landingPage: cleanUrl(raw.landingPage),
      landingReferrer: cleanUrl(raw.landingReferrer),
      referrer: cleanUrl(raw.referrer),
      pageUrl: cleanUrl(raw.pageUrl),
      placement: cleanText(raw.placement, 80),
      eventId: cleanText(raw.eventId, 100),
      analyticsConsent: raw.analyticsConsent === true,
      fbp: cleanText(raw.fbp, 200),
      fbc: cleanText(raw.fbc, 200),
      submittedAt: new Date().toISOString(),
    },
  };
}
