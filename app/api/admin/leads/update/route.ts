import { randomUUID, timingSafeEqual } from "node:crypto";
import { NextRequest } from "next/server";
import { apiJson } from "@/lib/api-response";

export const runtime = "nodejs";

const FETCH_TIMEOUT_MS = 8000;
const ALLOWED_STATUSES = new Set([
  "신규",
  "연락완료",
  "상담중",
  "방문예약",
  "계약",
  "보류",
]);

function safeEqual(input: string, expected: string) {
  const a = Buffer.from(input);
  const b = Buffer.from(expected);
  return a.length === b.length && timingSafeEqual(a, b);
}

function cleanText(value: unknown, maxLength: number) {
  if (typeof value !== "string") return "";
  return value
    .replace(/[\u0000-\u001f\u007f]/g, " ")
    .replace(/\s+/g, " ")
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

    const body = (await request.json()) as {
      token?: unknown;
      leadId?: unknown;
      status?: unknown;
      memo?: unknown;
    };

    const token = cleanText(body.token, 200);
    const expectedToken = process.env.ADMIN_DASHBOARD_TOKEN || "";
    if (!expectedToken || !token || !safeEqual(token, expectedToken)) {
      return apiJson(
        { ok: false, message: "관리자 비밀번호를 확인해 주세요." },
        requestId,
        { status: 401 },
      );
    }

    const leadId = cleanText(body.leadId, 60);
    const status = cleanText(body.status, 20);
    const memo = cleanText(body.memo, 1000);

    if (!leadId || !ALLOWED_STATUSES.has(status)) {
      return apiJson(
        { ok: false, message: "접수번호와 처리 상태를 확인해 주세요." },
        requestId,
        { status: 400 },
      );
    }

    const sheetWebhook = process.env.GOOGLE_SHEET_WEBHOOK_URL;
    if (!sheetWebhook) {
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
        headers: {
          "Content-Type": "application/json",
          ...(process.env.WEBHOOK_SECRET
            ? { "x-webhook-secret": process.env.WEBHOOK_SECRET }
            : {}),
        },
        body: JSON.stringify({
          action: "updateLead",
          leadId,
          status,
          memo,
          _webhookSecret: process.env.WEBHOOK_SECRET || "",
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
      };
      if (!result.ok) {
        throw new Error(result.message || "상담 정보를 저장하지 못했습니다.");
      }

      return apiJson(
        {
          ok: true,
          leadId,
          status,
          memo,
          message: "상담 상태와 메모를 저장했습니다.",
        },
        requestId,
      );
    } finally {
      clearTimeout(timer);
    }
  } catch (error) {
    console.error("Admin lead update error", { requestId, error });
    return apiJson(
      { ok: false, message: "상담 정보를 저장하는 중 오류가 발생했습니다." },
      requestId,
      { status: 500 },
    );
  }
}
