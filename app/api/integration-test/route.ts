import { randomUUID, timingSafeEqual } from "node:crypto";
import { NextRequest } from "next/server";
import { apiJson } from "@/lib/api-response";
import { isSolapiConfigured, sendSolapiLeadNotification } from "@/lib/solapi";
import { getSheetWebhookSecret, getSmsWebhookSecret } from "@/lib/webhook-secrets";

export const runtime = "nodejs";

const WEBHOOK_TIMEOUT_MS = 15000;

type IntegrationTarget = "googleSheets" | "sms";

class IntegrationTestError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "IntegrationTestError";
  }
}

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
  expectJson = false,
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
      throw new IntegrationTestError(
        `연동 서버가 HTTP ${response.status} 응답을 반환했습니다. 웹 앱 배포 권한과 주소를 확인해 주세요.`,
      );
    }

    if (detail) {
      try {
        const parsed = JSON.parse(detail) as { ok?: boolean; message?: string };
        if (parsed.ok === false) {
          const providerMessage = String(parsed.message || "").trim();
          if (/unauthorized/i.test(providerMessage)) {
            throw new IntegrationTestError(
              "Google Sheets 인증값이 일치하지 않습니다. Apps Script의 WEBHOOK_SECRET과 Vercel의 GOOGLE_SHEET_WEBHOOK_SECRET을 동일하게 설정해 주세요.",
            );
          }
          throw new IntegrationTestError(
            providerMessage
              ? `Google Sheets 오류: ${providerMessage.slice(0, 160)}`
              : "Google Sheets가 테스트 요청을 거부했습니다.",
          );
        }
      } catch (error) {
        if (!(error instanceof SyntaxError)) throw error;
        if (expectJson) {
          throw new IntegrationTestError(
            "Google Sheets 웹 앱이 올바른 응답을 반환하지 않았습니다. 웹 앱 실행 사용자를 본인으로, 접근 권한을 배포 가능한 범위로 다시 확인해 주세요.",
          );
        }
      }
    } else if (expectJson) {
      throw new IntegrationTestError(
        "Google Sheets 웹 앱의 응답이 비어 있습니다. Apps Script 배포 상태를 확인해 주세요.",
      );
    }
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
    eventId: randomUUID(),
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
    if (input.target === "googleSheets") {
      const url = process.env.GOOGLE_SHEET_WEBHOOK_URL;
      if (!url) {
        return respond(
          { ok: false, message: "GOOGLE_SHEET_WEBHOOK_URL이 설정되지 않았습니다." },
          { status: 503 },
        );
      }
      const secret = getSheetWebhookSecret();
      if (!secret) {
        return respond(
          { ok: false, message: "Google Sheets 인증값이 설정되지 않았습니다." },
          { status: 503 },
        );
      }
      await postWebhook(url, { ...lead, action: "appendLead" }, secret, true);
    } else if (process.env.SMS_WEBHOOK_URL) {
      await postWebhook(
        process.env.SMS_WEBHOOK_URL,
        lead,
        getSmsWebhookSecret(),
      );
    } else if (isSolapiConfigured()) {
      await sendSolapiLeadNotification(lead);
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
    });
  } catch (error) {
    console.error("Integration test failed", { requestId, error });

    const message =
      error instanceof IntegrationTestError
        ? error.message
        : error instanceof DOMException && error.name === "AbortError"
          ? "Google Sheets 응답 시간이 초과되었습니다. 잠시 후 다시 시도해 주세요."
          : error instanceof TypeError
            ? "연동 서버에 연결할 수 없습니다. Vercel에 등록한 웹 앱 주소를 확인해 주세요."
            : "연동 테스트 중 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.";

    return respond(
      {
        ok: false,
        message,
      },
      { status: 502 },
    );
  }
}
