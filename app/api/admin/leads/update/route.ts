import { randomUUID } from "node:crypto";
import { NextRequest } from "next/server";
import {
  authorizeAdminMutation,
  refreshAdminSession,
} from "@/lib/admin-session";
import { apiJson } from "@/lib/api-response";
import { getSheetWebhookSecret } from "@/lib/webhook-secrets";
import { projectConfig } from "@/data/project-config";

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
  const authorization = authorizeAdminMutation(request);
  if (!authorization.ok) {
    return apiJson(
      { ok: false, message: authorization.message },
      requestId,
      { status: authorization.status },
    );
  }
  const respond = (
    body: Record<string, unknown>,
    init: ResponseInit = {},
  ) => refreshAdminSession(
    apiJson(body, requestId, init),
    authorization.session,
  );

  try {
    if (!request.headers.get("content-type")?.includes("application/json")) {
      return respond(
        { ok: false, message: "잘못된 요청 형식입니다." },
        { status: 415 },
      );
    }

    let body: {
      leadId?: unknown;
      status?: unknown;
      memo?: unknown;
    };
    try {
      body = (await request.json()) as typeof body;
    } catch {
      return respond(
        { ok: false, message: "요청 내용을 확인해 주세요." },
        { status: 400 },
      );
    }

    const leadId = cleanText(body.leadId, 60);
    const status = cleanText(body.status, 20);
    const memo = cleanText(body.memo, 1000);

    if (!leadId || !ALLOWED_STATUSES.has(status)) {
      return respond(
        { ok: false, message: "접수번호와 처리 상태를 확인해 주세요." },
        { status: 400 },
      );
    }

    const sheetWebhook = process.env.GOOGLE_SHEET_WEBHOOK_URL;
    if (!sheetWebhook) {
      return respond(
        { ok: false, message: "Google Sheets 연동이 설정되지 않았습니다." },
        { status: 503 },
      );
    }
    const sheetSecret = getSheetWebhookSecret();
    if (!sheetSecret) {
      return respond(
        { ok: false, message: "Google Sheets 인증값이 설정되지 않았습니다." },
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
          "x-webhook-secret": sheetSecret,
        },
        body: JSON.stringify({
          action: "updateLead",
          leadId,
          projectCode: projectConfig.projectCode,
          status,
          memo,
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
      };
      if (!result.ok) {
        throw new Error(result.message || "상담 정보를 저장하지 못했습니다.");
      }

      return respond(
        {
          ok: true,
          leadId,
          status,
          memo,
          message: "상담 상태와 메모를 저장했습니다.",
        },
      );
    } finally {
      clearTimeout(timer);
    }
  } catch (error) {
    console.error("Admin lead update error", { requestId, error });
    return respond(
      { ok: false, message: "상담 정보를 저장하는 중 오류가 발생했습니다." },
      { status: 500 },
    );
  }
}
