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

function isProductionSiteUrlConfigured() {
  const value = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  if (!value) return false;

  try {
    const url = new URL(value);
    return (
      url.protocol === "https:" &&
      url.hostname !== "localhost" &&
      !url.hostname.endsWith(".example")
    );
  } catch {
    return false;
  }
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
    siteUrl: isProductionSiteUrlConfigured(),
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
    liveLeadMode: process.env.LEAD_TEST_MODE !== "true",
  };

  const launchChecks = [
    {
      key: "siteUrl",
      label: "실제 HTTPS 홈페이지 주소",
      description: "검색·공유·광고의 대표 주소가 실제 운영 도메인으로 설정되어야 합니다.",
      ready: integrations.siteUrl,
      required: true,
    },
    {
      key: "leadStorage",
      label: "Google Sheets 상담 저장",
      description: "광고 문의가 유실되지 않도록 고객 정보 저장 연결을 확인합니다.",
      ready: integrations.googleSheets,
      required: true,
    },
    {
      key: "staffNotification",
      label: "담당자 문자 알림",
      description: "신규 문의를 담당자가 빠르게 확인할 수 있는지 점검합니다.",
      ready: integrations.sms,
      required: true,
    },
    {
      key: "adminSecurity",
      label: "관리자 보안 세션",
      description: "고객정보를 비밀번호와 보안 세션으로 보호합니다.",
      ready: integrations.adminSession,
      required: true,
    },
    {
      key: "liveLeadMode",
      label: "실제 문의 접수 모드",
      description: "개발용 테스트 모드가 꺼져 있어야 실제 연동으로 접수됩니다.",
      ready: integrations.liveLeadMode,
      required: true,
    },
    {
      key: "browserTracking",
      label: "브라우저 광고 측정",
      description: "Meta Pixel, GA4 또는 Google Ads 중 사용하는 광고 측정을 확인합니다.",
      ready:
        integrations.metaPixel ||
        integrations.googleAnalytics ||
        integrations.googleAds,
      required: false,
    },
    {
      key: "serverTracking",
      label: "Meta 서버 전환 측정",
      description: "선택 사항이며 Meta 광고 운영 시 측정 누락을 줄여 줍니다.",
      ready: integrations.metaConversionsApi,
      required: false,
    },
  ];
  const productionReady = launchChecks
    .filter((check) => check.required)
    .every((check) => check.ready);
  const advertisingReady =
    productionReady &&
    launchChecks.find((check) => check.key === "browserTracking")?.ready;

  return apiJson(
    {
      ok: true,
      version: projectConfig.version,
      authenticated: true,
      productionReady,
      advertisingReady: Boolean(advertisingReady),
      integrations,
      launchChecks,
      checkedAt: new Date().toISOString(),
    },
    requestId,
  );
}
