import { randomUUID, timingSafeEqual } from "node:crypto";
import { NextRequest } from "next/server";
import { apiJson } from "@/lib/api-response";
import { isSolapiConfigured } from "@/lib/solapi";

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
        version: "9.8.0",
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
    googleSheets: Boolean(process.env.GOOGLE_SHEET_WEBHOOK_URL),
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
  };

  return apiJson(
    {
      ok: true,
      version: "9.8.0",
      authenticated: true,
      productionReady: integrations.googleSheets && integrations.sms,
      integrations,
      checkedAt: new Date().toISOString(),
    },
    requestId,
  );
}
