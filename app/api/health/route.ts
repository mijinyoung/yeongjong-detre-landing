import { NextResponse } from "next/server";
import { isSolapiConfigured } from "@/lib/solapi";

export const runtime = "nodejs";

export function GET() {
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

  return NextResponse.json({
    ok: true,
    version: "7.4.0",
    productionReady: integrations.googleSheets && integrations.sms,
    integrations,
    checkedAt: new Date().toISOString(),
  });
}
