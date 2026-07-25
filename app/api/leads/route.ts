import { NextRequest, NextResponse } from "next/server";
import { validateLead, type LeadPayload } from "@/lib/lead";

export const runtime = "nodejs";

async function postWebhook(url: string, payload: unknown, secret?: string) {
  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(secret ? { "x-webhook-secret": secret } : {}),
    },
    body: JSON.stringify(payload),
    cache: "no-store",
  });

  if (!response.ok) throw new Error(`Webhook failed: ${response.status}`);
}

export async function POST(request: NextRequest) {
  try {
    const input = (await request.json()) as LeadPayload;
    const result = validateLead(input);

    if (!result.ok) {
      return NextResponse.json({ ok: false, message: result.message }, { status: 400 });
    }

    const lead = {
      ...result.data,
      ip: request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "",
      userAgent: request.headers.get("user-agent") || "",
    };

    const jobs: Promise<void>[] = [];
    const sheetWebhook = process.env.GOOGLE_SHEET_WEBHOOK_URL;
    const smsWebhook = process.env.SMS_WEBHOOK_URL;
    const secret = process.env.WEBHOOK_SECRET;

    if (sheetWebhook) jobs.push(postWebhook(sheetWebhook, lead, secret));
    if (smsWebhook) jobs.push(postWebhook(smsWebhook, lead, secret));

    if (jobs.length === 0) {
      console.info("[LEAD:TEST_MODE]", lead);
    } else {
      const settled = await Promise.allSettled(jobs);
      const failed = settled.filter((item) => item.status === "rejected");
      if (failed.length) console.error("Lead integration error", failed);
      if (failed.length === settled.length) {
        return NextResponse.json(
          { ok: false, message: "접수 중 오류가 발생했습니다. 1833-8384로 연락해 주세요." },
          { status: 502 },
        );
      }
    }

    return NextResponse.json({ ok: true, message: "관심고객 등록이 완료되었습니다." });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { ok: false, message: "접수 중 오류가 발생했습니다. 잠시 후 다시 시도해 주세요." },
      { status: 500 },
    );
  }
}
