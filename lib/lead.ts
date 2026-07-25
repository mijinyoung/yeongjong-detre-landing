export type LeadPayload = {
  name: string;
  phone: string;
  consent: boolean;
  source?: string;
  campaign?: string;
  content?: string;
  referrer?: string;
  pageUrl?: string;
  submittedAt?: string;
  website?: string;
  placement?: string;
};

export function normalizePhone(value: string) {
  const digits = value.replace(/\D/g, "");
  if (digits.length === 11) return digits.replace(/(\d{3})(\d{4})(\d{4})/, "$1-$2-$3");
  if (digits.length === 10) return digits.replace(/(\d{3})(\d{3})(\d{4})/, "$1-$2-$3");
  return value.trim();
}

export function validateLead(input: LeadPayload) {
  const name = input.name?.trim();
  const phone = normalizePhone(input.phone ?? "");
  const validPhone = /^01[016789]-\d{3,4}-\d{4}$/.test(phone);

  if (input.website) return { ok: false as const, message: "잘못된 요청입니다." };
  if (!name || name.length < 2 || name.length > 30) return { ok: false as const, message: "이름을 확인해 주세요." };
  if (!validPhone) return { ok: false as const, message: "휴대폰 번호를 확인해 주세요." };
  if (!input.consent) return { ok: false as const, message: "개인정보 수집 및 상담 연락 동의가 필요합니다." };

  return {
    ok: true as const,
    data: {
      ...input,
      name,
      phone,
      submittedAt: input.submittedAt || new Date().toISOString(),
    },
  };
}
