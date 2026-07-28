import { randomUUID, timingSafeEqual } from "node:crypto";
import { NextRequest } from "next/server";
import { apiJson } from "@/lib/api-response";
import { isSolapiConfigured, sendSolapiLeadNotification } from "@/lib/solapi";

export const runtime = "nodejs";

const WEBHOOK_TIMEOUT_MS = 7000;

type IntegrationTarget = "googleSheets" | "sms";

function safeEqual(value: string, expected: string) {
  const valueBuffer = Buffer.from(value);
  const expectedBuffer = Buffer.from(expected);

  if (valueBuffer.length !== expectedBuffer.length) return false;
  return timingSafeEqual(valueBuffer, expectedBuffer);
}

async function postWebhook(
  url: string,
  payload: Record<string, unknown>,
  secret?: string,
) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), WEBHOOK_TIMEOUT_MS);

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(secret ? { "x-webhook-secret": secret } : {}),
      },
      body: JSON.stringify({
        ...payload,
        _webhookSecret: secret || "",
      }),
      cache: "no-store",
      signal: controller.signal,
    });

    const detail = await response.text();

    if (!response.ok) {
      throw new Error(
        `Webhook failed: ${response.status} ${detail.slice(0, 200)}`,
      );
    }

    return detail.slice(0, 300);
  } finally {
    clearTimeout(timer);
  }
}

function createTestLead() {
  const now = new Date();
  const date = now.toISOString().slice(0, 10).replaceAll("-", "");
  const random = randomUUID().replaceAll("-", "").slice(0, 6).toUpperCase();

  return {
    leadId: `TEST-${date}-${random}`,
    submittedAt: now.toISOString(),
    name: "연동 테스트",
    phone: "010-0000-0000",
    source: "system-check",
    medium: "internal",
    campaign: "integration-test",
    content: "",
    term: "",
    placement: "system-check",
    pageUrl: "",
    referrer: "",
    consentAt: now.toISOString(),
    analyticsConsent: false,
    ip: "system-check",
    userAgent: "Vercel integration test",
  };
}

export async function POST(request: NextRequest) {
  const requestId = randomUUID();
  const respond = (
    body: Record<string, unknown>,
    init: ResponseInit = {},
  ) => apiJson(body, requestId, init);

  try {
    const configuredToken = process.env.SYSTEM_CHECK_TOKEN;

    if (!configuredToken) {
      return respond(
        {
          ok: false,
          message:
            "SYSTEM_CHECK_TOKEN 환경변수가 설정되지 않았습니다.",
        },
        { status: 503 },
      );
    }

    const input = (await request.json()) as {
      target?: IntegrationTarget;
      token?: string;
    };

    if (
      !input.token ||
      !safeEqual(input.token.trim(), configuredToken.trim())
    ) {
      return respond(
        { ok: false, message: "점검용 비밀번호가 올바르지 않습니다." },
        { status: 401 },
      );
    }

    if (input.target !== "googleSheets" && input.target !== "sms") {
      return respond(
        { ok: false, message: "점검 대상을 선택해 주세요." },
        { status: 400 },
      );
    }

    const lead = createTestLead();
    let responsePreview = "";

    if (input.target === "googleSheets") {
      const url = process.env.GOOGLE_SHEET_WEBHOOK_URL;
      if (!url) {
        return respond(
          { ok: false, message: "GOOGLE_SHEET_WEBHOOK_URL이 설정되지 않았습니다." },
          { status: 503 },
        );
      }
      responsePreview = await postWebhook(url, lead, process.env.WEBHOOK_SECRET);
    } else if (process.env.SMS_WEBHOOK_URL) {
      responsePreview = await postWebhook(
        process.env.SMS_WEBHOOK_URL,
        lead,
        process.env.WEBHOOK_SECRET,
      );
    } else if (isSolapiConfigured()) {
      const result = await sendSolapiLeadNotification(lead);
      responsePreview = result.sent ? `SOLAPI group: ${result.groupId || "registered"}` : "";
    } else {
      return respond(
        { ok: false, message: "SOLAPI 문자 환경변수가 설정되지 않았습니다." },
        { status: 503 },
      );
    }

    return respond({
      ok: true,
      target: input.target,
      leadId: lead.leadId,
      message:
        input.target === "googleSheets"
          ? "Google Sheets 테스트 전송이 완료되었습니다."
          : "문자 알림 테스트 전송이 완료되었습니다.",
      responsePreview,
    });
  } catch (error) {
    console.error("Integration test failed", { requestId, error });

    return respond(
      {
        ok: false,
        message: "연동 테스트 중 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.",
      },
      { status: 502 },
    );
  }
}
