export type LeadFieldErrors = {
  name?: string;
  phone?: string;
  consent?: string;
};

const PHONE_PATTERN = /^01[016789]-\d{3,4}-\d{4}$/;

export function validateLeadFields(
  name: string,
  phone: string,
  consent: boolean,
): LeadFieldErrors {
  const errors: LeadFieldErrors = {};

  if (name.trim().length < 2) {
    errors.name = "이름을 두 글자 이상 입력해 주세요.";
  }
  if (!PHONE_PATTERN.test(phone)) {
    errors.phone = "휴대폰 번호를 정확히 입력해 주세요.";
  }
  if (!consent) {
    errors.consent = "개인정보 수집 및 상담 연락에 동의해 주세요.";
  }

  return errors;
}
