import { randomUUID, timingSafeEqual } from "node:crypto";
import { NextRequest } from "next/server";
import { apiJson } from "@/lib/api-response";
import { isAdminSessionConfigured } from "@/lib/admin-session";
import { isSolapiConfigured } from "@/lib/solapi";
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

function getConfiguredSiteUrl() {
  const value = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  if (!value) return null;

  try {
    const url = new URL(value);
    const valid =
      url.protocol === "https:" &&
      url.hostname !== "localhost" &&
      !url.hostname.endsWith(".example") &&
      url.pathname === "/" &&
      !url.search &&
      !url.hash;
    return valid ? url : null;
  } catch {
    return null;
  }
}

function normalizeHost(value: string) {
  return value
    .split(",")[0]
    .trim()
    .toLowerCase()
    .replace(/:\d+$/, "")
    .replace(/\.$/, "");
}

function getDomainStatus(request: NextRequest) {
  const configuredUrl = getConfiguredSiteUrl();
  const forwardedHost = request.headers.get("x-forwarded-host") || request.nextUrl.host;
  const forwardedProtocol =
    request.headers.get("x-forwarded-proto")?.split(",")[0].trim() ||
    request.nextUrl.protocol.replace(":", "");
  const currentHost = normalizeHost(forwardedHost);
  const configuredHost = configuredUrl?.hostname.toLowerCase() || "";
  const customDomain = Boolean(
    configuredHost &&
    !configuredHost.endsWith(".vercel.app") &&
    configuredHost !== "localhost" &&
    !configuredHost.endsWith(".example"),
  );
  const https = forwardedProtocol === "https";
  const hostMatches = Boolean(configuredHost && currentHost === configuredHost);
  const connected = Boolean(configuredUrl && customDomain && https && hostMatches);
  const origin = configuredUrl?.origin || "";

  return {
    configuredUrl: origin,
    configuredHost,
    currentUrl: currentHost ? `${forwardedProtocol}://${currentHost}` : "",
    currentHost,
    customDomain,
    https,
    hostMatches,
    connected,
    canonicalUrl: origin,
    sitemapUrl: origin ? `${origin}/sitemap.xml` : "",
    robotsUrl: origin ? `${origin}/robots.txt` : "",
  };
}

function isAdminOriginAligned(siteOrigin: string) {
  if (!siteOrigin) return false;
  const configured = process.env.ADMIN_ALLOWED_ORIGINS?.trim();
  if (!configured) return true;

  return configured
    .split(",")
    .map((value) => value.trim().replace(/\/$/, ""))
    .filter(Boolean)
    .includes(siteOrigin);
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

  const domain = getDomainStatus(request);
  const integrations = {
    siteUrl: Boolean(domain.configuredUrl),
    customDomain: domain.customDomain,
    domainConnection: domain.connected,
    googleSheets: Boolean(process.env.GOOGLE_SHEET_WEBHOOK_URL),
    sms: Boolean(process.env.SMS_WEBHOOK_URL) || isSolapiConfigured(),
    metaPixel: Boolean(process.env.NEXT_PUBLIC_META_PIXEL_ID),
    googleAnalytics: Boolean(process.env.NEXT_PUBLIC_GA_ID),
    googleSearchConsole: Boolean(process.env.GOOGLE_SITE_VERIFICATION?.trim()),
    naverSearchAdvisor: Boolean(process.env.NAVER_SITE_VERIFICATION?.trim()),
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
      isAdminOriginAligned(domain.configuredUrl),
    ),
    liveLeadMode: process.env.LEAD_TEST_MODE !== "true",
    liveTrackingMode: !(
      process.env.META_CAPI_ACCESS_TOKEN &&
      process.env.META_TEST_EVENT_CODE?.trim()
    ),
  };

  const launchChecks = [
    {
      key: "siteUrl",
      label: "대표주소 환경변수",
      description: "NEXT_PUBLIC_SITE_URL이 경로 없는 실제 HTTPS 주소로 설정되어야 합니다.",
      ready: integrations.siteUrl,
      required: true,
    },
    {
      key: "customDomain",
      label: "광고용 자체 도메인",
      description: "Vercel 기본 주소가 아닌 구매한 도메인이 대표주소로 설정되어야 합니다.",
      ready: integrations.customDomain,
      required: true,
    },
    {
      key: "domainConnection",
      label: "도메인·HTTPS 실제 연결",
      description: "구매한 도메인으로 접속했을 때 대표주소와 일치하고 HTTPS가 적용되어야 합니다.",
      ready: integrations.domainConnection,
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
      key: "liveTrackingMode",
      label: "실제 광고 전환 모드",
      description: "Meta 테스트 이벤트 코드가 제거되어 실제 광고 성과로 집계되는지 확인합니다.",
      ready: integrations.liveTrackingMode,
      required: true,
    },
    {
      key: "serverTracking",
      label: "Meta 서버 전환 측정",
      description: "선택 사항이며 Meta 광고 운영 시 측정 누락을 줄여 줍니다.",
      ready: integrations.metaConversionsApi,
      required: false,
    },
    {
      key: "googleSearchConsole",
      label: "Google 검색 소유확인",
      description: "기존 검색 결과를 현재 홈페이지 정보로 교체하고 색인 상태를 관리합니다.",
      ready: integrations.googleSearchConsole,
      required: false,
    },
    {
      key: "naverSearchAdvisor",
      label: "네이버 검색 소유확인",
      description: "네이버 검색로봇에 현재 홈페이지와 사이트맵을 직접 등록할 수 있게 합니다.",
      ready: integrations.naverSearchAdvisor,
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
      domain,
      launchChecks,
      checkedAt: new Date().toISOString(),
    },
    requestId,
  );
}
