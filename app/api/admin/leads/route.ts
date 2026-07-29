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

function maskPhone(value: unknown) {
  const phone = String(value || "");
  const digits = phone.replace(/\D/g, "");
  if (digits.length < 7) return phone ? "***-****" : "";
  return `${digits.slice(0, 3)}-****-${digits.slice(-4)}`;
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
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "list",
          limit: 200,
          projectCode: projectConfig.projectCode,
          _webhookSecret: sheetSecret,
        }),
        cache: "no-store",
        signal: controller.signal,
      });
      const text = await response.text();

      if (!response.ok) {
        throw new Error(`Google Sheets response error: ${response.status}`);
      }

      const result = JSON.parse(text) as {
        ok?: boolean;
        message?: string;
        leads?: unknown[];
        total?: number;
        updatedAt?: string;
      };

      if (!result.ok) {
        throw new Error(result.message || "접수 목록을 불러오지 못했습니다.");
      }

      const leads = Array.isArray(result.leads)
        ? result.leads.map((item) => {
            if (!item || typeof item !== "object" || Array.isArray(item)) return item;
            const lead = item as Record<string, unknown>;
            return { ...lead, phone: maskPhone(lead.phone) };
          })
        : [];

      return respond(
        {
          ok: true,
          leads,
          total: Number(result.total || 0),
          updatedAt: result.updatedAt || new Date().toISOString(),
        },
      );
    } finally {
      clearTimeout(timer);
    }
  } catch (error) {
    console.error("Admin dashboard error", { requestId, error });
    return respond(
      { ok: false, message: "접수 현황을 불러오는 중 오류가 발생했습니다." },
      { status: 500 },
    );
  }
}
