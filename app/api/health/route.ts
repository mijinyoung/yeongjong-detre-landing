import { randomUUID, timingSafeEqual } from "node:crypto";
import { NextRequest } from "next/server";
import { apiJson } from "@/lib/api-response";
import { isAdminSessionConfigured } from "@/lib/admin-session";
import { isSolapiConfigured } from "@/lib/solapi";
import { getSheetWebhookSecret } from "@/lib/webhook-secrets";
import { projectConfig } from "@/data/project-config";

export const runtime = "nodejs";

function safeEqual(value: string, expected: string) {
  const valueBuffer = Buffer.from(value);
  const expectedBuffer = Buffer.from(expected);
  return (
    valueBuffer.length === expectedBuffer.length &&
    timingSafeEqual(valueBuffer, expectedBuffer)
  );
}

export function GET(request: NextRequest) {
  const requestId = randomUUID();
  const configuredToken = process.env.SYSTEM_CHECK_TOKEN?.trim() || "";
  const providedToken = request.headers.get("x-system-check-token")?.trim() || "";

  if (!providedToken) {
    return apiJson(
      {
        ok: true,
        version: projectConfig.version,
        authenticated: false,
        checkedAt: new Date().toISOString(),
      },
      requestId,
    );
  }

  if (
    !configuredToken ||
    !safeEqual(providedToken.slice(0, 200), configuredToken)
  ) {
    return apiJson(
      {
        ok: false,
        authenticated: false,
        message: "운영 점검 비밀번호를 확인해 주세요.",
      },
      requestId,
      { status: 401 },
    );
  }

  const integrations = {
    googleSheets: Boolean(
      process.env.GOOGLE_SHEET_WEBHOOK_URL && getSheetWebhookSecret(),
    ),
    sms: Boolean(process.env.SMS_WEBHOOK_URL) || isSolapiConfigured(),
    metaPixel: Boolean(process.env.NEXT_PUBLIC_META_PIXEL_ID),
    googleAnalytics: Boolean(process.env.NEXT_PUBLIC_GA_ID),
    googleAds: Boolean(
      process.env.NEXT_PUBLIC_GOOGLE_ADS_ID &&
      process.env.NEXT_PUBLIC_GOOGLE_ADS_LEAD_LABEL,
    ),
    metaConversionsApi: Boolean(
      (process.env.META_PIXEL_ID || process.env.NEXT_PUBLIC_META_PIXEL_ID) &&
      process.env.META_CAPI_ACCESS_TOKEN,
    ),
    adminSession: Boolean(
      process.env.ADMIN_DASHBOARD_TOKEN &&
      isAdminSessionConfigured() &&
      (process.env.ADMIN_ALLOWED_ORIGINS || process.env.NEXT_PUBLIC_SITE_URL),
    ),
  };

  return apiJson(
    {
      ok: true,
      version: projectConfig.version,
      authenticated: true,
      productionReady: integrations.googleSheets && integrations.sms,
      integrations,
      checkedAt: new Date().toISOString(),
    },
    requestId,
  );
}
