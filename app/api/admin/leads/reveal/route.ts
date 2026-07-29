import { randomUUID, timingSafeEqual } from "node:crypto";
import { NextRequest } from "next/server";
import { apiJson } from "@/lib/api-response";
import { getSheetWebhookSecret } from "@/lib/webhook-secrets";

export const runtime = "nodejs";

const FETCH_TIMEOUT_MS = 8000;

function safeEqual(input: string, expected: string) {
  const a = Buffer.from(input);
  const b = Buffer.from(expected);
  return a.length === b.length && timingSafeEqual(a, b);
}

function cleanText(value: unknown, maxLength: number) {
  if (typeof value !== "string") return "";
  return value
    .replace(/[\u0000-\u001f\u007f]/g, " ")
    .trim()
    .slice(0, maxLength);
}

export async function POST(request: NextRequest) {
  const requestId = randomUUID();

  try {
    if (!request.headers.get("content-type")?.includes("application/json")) {
      return apiJson(
        { ok: false, message: "잘못된 요청 형식입니다." },
        requestId,
        { status: 415 },
      );
    }

    let body: { token?: unknown; leadId?: unknown };
    try {
      body = (await request.json()) as { token?: unknown; leadId?: unknown };
    } catch {
      return apiJson(
        { ok: false, message: "요청 내용을 확인해 주세요." },
        requestId,
        { status: 400 },
      );
    }

    const token = cleanText(body.token, 200);
    const leadId = cleanText(body.leadId, 60);
    const expectedToken = process.env.ADMIN_DASHBOARD_TOKEN || "";

    if (!expectedToken || !token || !safeEqual(token, expectedToken)) {
      return apiJson(
        { ok: false, message: "관리자 비밀번호를 확인해 주세요." },
        requestId,
        { status: 401 },
      );
    }
    if (!leadId) {
      return apiJson(
        { ok: false, message: "접수번호를 확인해 주세요." },
        requestId,
        { status: 400 },
      );
    }

    const sheetWebhook = process.env.GOOGLE_SHEET_WEBHOOK_URL;
    const sheetSecret = getSheetWebhookSecret();
    if (!sheetWebhook || !sheetSecret) {
      return apiJson(
        { ok: false, message: "Google Sheets 연동이 설정되지 않았습니다." },
        requestId,
        { status: 503 },
      );
    }

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

    try {
      const response = await fetch(sheetWebhook, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "getLead",
          leadId,
          _webhookSecret: sheetSecret,
        }),
        cache: "no-store",
        signal: controller.signal,
      });
      const raw = await response.text();
      if (!response.ok) {
        throw new Error(`Google Sheets response error: ${response.status}`);
      }

      const result = JSON.parse(raw) as {
        ok?: boolean;
        message?: string;
        phone?: string;
      };
      if (!result.ok || !result.phone) {
        throw new Error(result.message || "전화번호를 확인하지 못했습니다.");
      }

      console.info("Admin phone revealed", { requestId, leadId });
      return apiJson({ ok: true, leadId, phone: result.phone }, requestId);
    } finally {
      clearTimeout(timer);
    }
  } catch (error) {
    console.error("Admin phone reveal error", { requestId, error });
    return apiJson(
      { ok: false, message: "전화번호를 불러오는 중 오류가 발생했습니다." },
      requestId,
      { status: 502 },
    );
  }
}
