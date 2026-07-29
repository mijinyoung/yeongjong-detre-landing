import { randomUUID } from "node:crypto";
import { after, NextRequest, NextResponse } from "next/server";
import { validateLead } from "@/lib/lead";
import { sendMetaLeadEvent } from "@/lib/meta-capi";
import { sendSolapiLeadNotification } from "@/lib/solapi";
import { getSheetWebhookSecret, getSmsWebhookSecret } from "@/lib/webhook-secrets";
import { projectConfig } from "@/data/project-config";

export const runtime = "nodejs";

const RATE_WINDOW_MS = 10 * 60 * 1000;
const RATE_LIMIT = 5;
const WEBHOOK_TIMEOUT_MS = 7000;
const MAX_BODY_BYTES = 16 * 1024;

const rateStore = new Map<string, number[]>();

function pruneStores(now: number) {
  for (const [ip, attempts] of rateStore) {
    const recent = attempts.filter((time) => now - time < RATE_WINDOW_MS);
    if (recent.length) rateStore.set(ip, recent);
    else rateStore.delete(ip);
  }
}

function getClientIp(request: NextRequest) {
  return request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
}

function isRateLimited(ip: string) {
  const now = Date.now();
  pruneStores(now);
  const recent = (rateStore.get(ip) || []).filter((time) => now - time < RATE_WINDOW_MS);
  if (recent.length >= RATE_LIMIT) return true;
  recent.push(now);
  rateStore.set(ip, recent);
  return false;
}

function createLeadId() {
  const now = new Date();
  const date = now.toISOString().slice(0, 10).replaceAll("-", "");
  const random = randomUUID().replaceAll("-", "").slice(0, 6).toUpperCase();
  return `${projectConfig.conversion.leadIdPrefix}-${date}-${random}`;
}

type WebhookResult = {
  ok?: boolean;
  message?: string;
  code?: string;
  duplicate?: boolean;
  leadId?: string;
  eventId?: string;
  smsStatus?: string;
};

class WebhookError extends Error {
  code: string;

  constructor(message: string, code = "") {
    super(message);
    this.name = "WebhookError";
    this.code = code;
  }
}

async function postWebhook(url: string, payload: unknown, secret?: string) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), WEBHOOK_TIMEOUT_MS);

  try {
    const body =
      payload && typeof payload === "object"
        ? { ...(payload as Record<string, unknown>), _webhookSecret: secret || "" }
        : payload;

    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(secret ? { "x-webhook-secret": secret } : {}),
      },
      body: JSON.stringify(body),
      cache: "no-store",
      signal: controller.signal,
    });

    const detail = await response.text();
    if (!response.ok) {
      throw new Error(`Webhook failed: ${response.status} ${detail.slice(0, 200)}`);
    }

    if (detail) {
      try {
        const parsed = JSON.parse(detail) as WebhookResult;
        if (parsed.ok === false) {
          throw new WebhookError(
            parsed.message || "Webhook rejected the request.",
            parsed.code,
          );
        }
        return parsed;
      } catch (error) {
        if (error instanceof SyntaxError) return undefined;
        throw error;
      }
    }
    return undefined;
  } finally {
    clearTimeout(timer);
  }
}

export async function POST(request: NextRequest) {
  try {
    if (!request.headers.get("content-type")?.includes("application/json")) {
      return NextResponse.json(
        { ok: false, message: "JSON 형식의 요청만 지원합니다." },
        { status: 415 },
      );
    }

    const declaredLength = Number(request.headers.get("content-length") || 0);
    if (declaredLength > MAX_BODY_BYTES) {
      return NextResponse.json(
        { ok: false, message: "요청 데이터가 너무 큽니다." },
        { status: 413 },
      );
    }

    const ip = getClientIp(request);
    if (isRateLimited(ip)) {
      return NextResponse.json(
        { ok: false, message: "등록 요청이 너무 많습니다. 잠시 후 다시 시도해 주세요." },
        { status: 429 },
      );
    }

    const rawBody = await request.text();
    if (new TextEncoder().encode(rawBody).byteLength > MAX_BODY_BYTES) {
      return NextResponse.json(
        { ok: false, message: "요청 데이터가 너무 큽니다." },
        { status: 413 },
      );
    }

    let input: unknown;
    try {
      input = JSON.parse(rawBody);
    } catch {
      return NextResponse.json(
        { ok: false, message: "요청 내용을 확인해 주세요." },
        { status: 400 },
      );
    }
    const result = validateLead(input);

    if (!result.ok) {
      return NextResponse.json({ ok: false, message: result.message }, { status: 400 });
    }

    const sheetWebhook = process.env.GOOGLE_SHEET_WEBHOOK_URL?.trim();
    const sheetSecret = getSheetWebhookSecret();
    const smsSecret = getSmsWebhookSecret();
    const testMode = process.env.LEAD_TEST_MODE === "true";

    if (!sheetWebhook && !testMode) {
      console.error("Lead storage is not configured.");
      return NextResponse.json(
        { ok: false, message: `현재 온라인 접수를 저장할 수 없습니다. ${projectConfig.contact.displayPhone}로 연락해 주세요.` },
        { status: 503 },
      );
    }

    if (sheetWebhook && !sheetSecret) {
      console.error("Google Sheets webhook secret is not configured.");
      return NextResponse.json(
        { ok: false, message: `접수 저장 설정을 확인 중입니다. ${projectConfig.contact.displayPhone}로 연락해 주세요.` },
        { status: 503 },
      );
    }

    const candidateLeadId = createLeadId();
    const smsConfigured = Boolean(
      process.env.SMS_WEBHOOK_URL ||
      (
        process.env.SOLAPI_API_KEY &&
        process.env.SOLAPI_API_SECRET &&
        process.env.SOLAPI_SENDER_NUMBER &&
        process.env.SMS_RECIPIENT_NUMBER
      )
    );

    const candidateLead = {
      ...result.data,
      leadId: candidateLeadId,
      projectCode: projectConfig.projectCode,
      projectName: projectConfig.identity.name,
      consentAt: new Date().toISOString(),
      ip,
      userAgent: request.headers.get("user-agent") || "",
      smsConfigured,
    };

    // Store the lead first. When storage fails, do not send a notification.
    let leadId = candidateLeadId;
    let lead = candidateLead;
    if (sheetWebhook) {
      try {
        const stored = await postWebhook(
          sheetWebhook,
          { ...candidateLead, action: "appendLead" },
          sheetSecret,
        );
        if (stored?.duplicate) {
          if (!stored.leadId) {
            throw new WebhookError(
              "Stored duplicate did not include its lead ID.",
              "INVALID_DUPLICATE_RESPONSE",
            );
          }
          return NextResponse.json({
            ok: true,
            leadId: stored.leadId,
            smsStatus: stored.smsStatus || "대기",
            message: "이미 정상적으로 접수되었습니다.",
          });
        }
        leadId = stored?.leadId || candidateLeadId;
        lead = { ...candidateLead, leadId };
      } catch (error) {
        console.error("Google Sheets integration error", error);
        if (error instanceof WebhookError) {
          if (error.code === "IDEMPOTENCY_CONFLICT") {
            return NextResponse.json(
              { ok: false, message: "접수 확인값이 일치하지 않습니다. 페이지를 새로고침한 뒤 다시 시도해 주세요." },
              { status: 409 },
            );
          }
          if (error.code === "INVALID_EVENT_ID") {
            return NextResponse.json(
              { ok: false, message: "접수 확인값이 올바르지 않습니다. 페이지를 새로고침한 뒤 다시 시도해 주세요." },
              { status: 400 },
            );
          }
          if (error.code === "BUSY") {
            return NextResponse.json(
              { ok: false, message: "접수가 몰리고 있습니다. 잠시 후 같은 화면에서 다시 시도해 주세요." },
              { status: 503, headers: { "Retry-After": "3" } },
            );
          }
        }
        return NextResponse.json(
          { ok: false, message: `접수 저장 중 오류가 발생했습니다. ${projectConfig.contact.displayPhone}로 연락해 주세요.` },
          { status: 502 },
        );
      }
    }

    const smsStatus = sheetWebhook
      ? (smsConfigured ? "대기" : "미설정")
      : "테스트";

    // The durable Google Sheets write is the success boundary. Notifications and
    // ad measurement continue after the response so a slow provider cannot make
    // the customer retry an already-saved registration.
    after(async () => {
      if (sheetWebhook && smsConfigured) {
        let finalSmsStatus = "성공";
        let smsDetail = "";

        try {
          if (process.env.SMS_WEBHOOK_URL) {
            await postWebhook(process.env.SMS_WEBHOOK_URL, lead, smsSecret);
            smsDetail = "SMS webhook delivered";
          } else {
            const smsResult = await sendSolapiLeadNotification(lead);
            finalSmsStatus = smsResult.sent ? "성공" : "미설정";
            smsDetail = smsResult.groupId
              ? `SOLAPI group ${smsResult.groupId}`
              : "SOLAPI accepted";
          }
        } catch (error) {
          finalSmsStatus = "실패";
          smsDetail =
            error instanceof Error
              ? error.message.slice(0, 240)
              : "문자 발송 중 알 수 없는 오류";
          console.error("Lead SMS error", error);
        }

        if (sheetWebhook) {
          try {
            await postWebhook(
              sheetWebhook,
              {
                action: "updateDelivery",
                leadId,
                smsStatus: finalSmsStatus,
                smsProcessedAt: new Date().toISOString(),
                smsDetail,
              },
              sheetSecret,
            );
          } catch (error) {
            console.error("Google Sheets SMS status update error", error);
          }
        }
      }

      if (sheetWebhook && result.data.analyticsConsent && result.data.eventId) {
        try {
          await sendMetaLeadEvent({
            eventId: result.data.eventId,
            eventSourceUrl: result.data.pageUrl,
            name: result.data.name,
            phone: result.data.phone,
            ip,
            userAgent: request.headers.get("user-agent") || "",
            fbp: result.data.fbp,
            fbc: result.data.fbc,
            leadId,
            placement: result.data.placement,
            source: result.data.source,
            campaign: result.data.campaign,
          });
        } catch (error) {
          console.error("Meta conversion error", error);
        }
      }
    });

    if (!sheetWebhook && testMode) {
      console.info("[LEAD:TEST_MODE]", {
        leadId,
        placement: lead.placement,
        source: lead.source,
        phoneLast4: lead.phone.slice(-4),
      });
    }

    return NextResponse.json({
      ok: true,
      leadId,
      smsStatus,
      message: projectConfig.conversion.successMessage,
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { ok: false, message: "접수 중 오류가 발생했습니다. 잠시 후 다시 시도해 주세요." },
      { status: 500 },
    );
  }
}
