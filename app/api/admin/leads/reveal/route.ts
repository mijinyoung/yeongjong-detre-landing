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

function cleanText(value: unknown, maxLength: number) {
  if (typeof value !== "string") return "";
  return value
    .replace(/[\u0000-\u001f\u007f]/g, " ")
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

    let body: { leadId?: unknown };
    try {
      body = (await request.json()) as { leadId?: unknown };
    } catch {
      return respond(
        { ok: false, message: "요청 내용을 확인해 주세요." },
        { status: 400 },
      );
    }

    const leadId = cleanText(body.leadId, 60);
    if (!leadId) {
      return respond(
        { ok: false, message: "접수번호를 확인해 주세요." },
        { status: 400 },
      );
    }

    const sheetWebhook = process.env.GOOGLE_SHEET_WEBHOOK_URL;
    const sheetSecret = getSheetWebhookSecret();
    if (!sheetWebhook || !sheetSecret) {
      return respond(
        { ok: false, message: "Google Sheets 연동이 설정되지 않았습니다." },
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
          projectCode: projectConfig.projectCode,
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
      return respond({ ok: true, leadId, phone: result.phone });
    } finally {
      clearTimeout(timer);
    }
  } catch (error) {
    console.error("Admin phone reveal error", { requestId, error });
    return respond(
      { ok: false, message: "전화번호를 불러오는 중 오류가 발생했습니다." },
      { status: 502 },
    );
  }
}
