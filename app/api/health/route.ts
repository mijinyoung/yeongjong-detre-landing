import { NextResponse } from "next/server";

export const runtime = "nodejs";

export function GET() {
  const integrations = {
    googleSheets: Boolean(process.env.GOOGLE_SHEET_WEBHOOK_URL),
    sms: Boolean(process.env.SMS_WEBHOOK_URL),
    metaPixel: Boolean(process.env.NEXT_PUBLIC_META_PIXEL_ID),
    googleAnalytics: Boolean(process.env.NEXT_PUBLIC_GA_ID),
    metaConversionsApi: Boolean(
      (process.env.META_PIXEL_ID || process.env.NEXT_PUBLIC_META_PIXEL_ID) &&
      process.env.META_CAPI_ACCESS_TOKEN,
    ),
  };

  return NextResponse.json({
    ok: true,
    version: "6.7.0",
    productionReady: integrations.googleSheets && integrations.sms,
    integrations,
    checkedAt: new Date().toISOString(),
  });
}
