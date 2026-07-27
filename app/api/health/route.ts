import { NextResponse } from "next/server";

export const runtime = "nodejs";

export function GET() {
  return NextResponse.json({
    ok: true,
    version: "4.5.0",
    integrations: {
      googleSheets: Boolean(process.env.GOOGLE_SHEET_WEBHOOK_URL),
      sms: Boolean(process.env.SMS_WEBHOOK_URL),
      metaPixel: Boolean(process.env.NEXT_PUBLIC_META_PIXEL_ID),
      googleAnalytics: Boolean(process.env.NEXT_PUBLIC_GA_ID),
    },
    checkedAt: new Date().toISOString(),
  });
}
