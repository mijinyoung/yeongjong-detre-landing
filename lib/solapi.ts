import { createHmac, randomBytes } from "node:crypto";

type SolapiLeadNotification = {
  leadId: string;
  name: string;
  phone: string;
  submittedAt?: string;
  source?: string;
  campaign?: string;
  placement?: string;
};

type SolapiResponse = {
  failedMessageList?: Array<{
    statusCode?: string;
    statusMessage?: string;
    to?: string;
  }>;
  groupInfo?: {
    groupId?: string;
    count?: {
      registeredSuccess?: number;
      registeredFailed?: number;
    };
  };
};

function digitsOnly(value: string) {
  return value.replace(/\D/g, "");
}

function createAuthorization(apiKey: string, apiSecret: string) {
  const date = new Date().toISOString();
  const salt = randomBytes(16).toString("hex");
  const signature = createHmac("sha256", apiSecret)
    .update(date + salt)
    .digest("hex");

  return `HMAC-SHA256 apiKey=${apiKey}, date=${date}, salt=${salt}, signature=${signature}`;
}

function formatKoreanDate(value?: string) {
  const date = value ? new Date(value) : new Date();
  if (Number.isNaN(date.getTime())) return "확인 필요";

  return new Intl.DateTimeFormat("ko-KR", {
    timeZone: "Asia/Seoul",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(date);
}

function buildLeadText(lead: SolapiLeadNotification) {
  return [
    "[영종 디에트르 신규문의]",
    `고객명: ${lead.name}`,
    `연락처: ${lead.phone}`,
    `접수시간: ${formatKoreanDate(lead.submittedAt)}`,
    `유입: ${lead.source || "direct"}${lead.campaign ? ` / ${lead.campaign}` : ""}`,
    `신청위치: ${lead.placement || "homepage"}`,
    `접수번호: ${lead.leadId}`,
  ].join("\n");
}

export function isSolapiConfigured() {
  return Boolean(
    process.env.SOLAPI_API_KEY &&
      process.env.SOLAPI_API_SECRET &&
      process.env.SOLAPI_SENDER_NUMBER &&
      process.env.SMS_RECIPIENT_NUMBER,
  );
}

export async function sendSolapiLeadNotification(
  lead: SolapiLeadNotification,
) {
  const apiKey = process.env.SOLAPI_API_KEY;
  const apiSecret = process.env.SOLAPI_API_SECRET;
  const from = digitsOnly(process.env.SOLAPI_SENDER_NUMBER || "");
  const to = digitsOnly(process.env.SMS_RECIPIENT_NUMBER || "");

  if (!apiKey || !apiSecret || !from || !to) {
    return { configured: false, sent: false } as const;
  }

  const response = await fetch(
    "https://api.solapi.com/messages/v4/send-many/detail",
    {
      method: "POST",
      headers: {
        Authorization: createAuthorization(apiKey, apiSecret),
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        messages: [
          {
            to,
            from,
            text: buildLeadText(lead),
            autoTypeDetect: true,
            customFields: {
              leadId: lead.leadId,
              placement: lead.placement || "",
            },
          },
        ],
        showMessageList: true,
      }),
      cache: "no-store",
    },
  );

  const raw = await response.text();
  let data: SolapiResponse = {};

  try {
    data = raw ? (JSON.parse(raw) as SolapiResponse) : {};
  } catch {
    // Keep the raw response for the error below.
  }

  if (!response.ok) {
    throw new Error(`SOLAPI ${response.status}: ${raw.slice(0, 300)}`);
  }

  const failed = data.failedMessageList || [];
  const registeredFailed = data.groupInfo?.count?.registeredFailed || 0;

  if (failed.length > 0 || registeredFailed > 0) {
    const reason = failed
      .map((item) => item.statusMessage || item.statusCode || "등록 실패")
      .join(", ");
    throw new Error(`SOLAPI message registration failed: ${reason}`);
  }

  return {
    configured: true,
    sent: true,
    groupId: data.groupInfo?.groupId || "",
  } as const;
}
