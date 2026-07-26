import { randomUUID } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { validateLead, type LeadPayload } from "@/lib/lead";

export const runtime = "nodejs";

const RATE_WINDOW_MS = 10 * 60 * 1000;
const RATE_LIMIT = 5;
const DUPLICATE_WINDOW_MS = 60 * 1000;
const WEBHOOK_TIMEOUT_MS = 7000;

const rateStore = new Map<string, number[]>();
const duplicateStore = new Map<string, number>();

function getClientIp(request: NextRequest) {
  return request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
}

function isRateLimited(ip: string) {
  const now = Date.now();
  const recent = (rateStore.get(ip) || []).filter((time) => now - time < RATE_WINDOW_MS);
  if (recent.length >= RATE_LIMIT) return true;
  recent.push(now);
  rateStore.set(ip, recent);
  return false;
}

function isDuplicate(phone: string) {
  const now = Date.now();
  const last = duplicateStore.get(phone);
  duplicateStore.set(phone, now);
  return typeof last === "number" && now - last < DUPLICATE_WINDOW_MS;
}

function createLeadId() {
  const now = new Date();
  const date = now.toISOString().slice(0, 10).replaceAll("-", "");
  const random = randomUUID().replaceAll("-", "").slice(0, 6).toUpperCase();
  return `YD-${date}-${random}`;
}

async function postWebhook(url: string, payload: unknown, secret?: string) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), WEBHOOK_TIMEOUT_MS);

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(secret ? { "x-webhook-secret": secret } : {}),
      },
      body: JSON.stringify(payload),
      cache: "no-store",
      signal: controller.signal,
    });

    if (!response.ok) throw new Error(`Webhook failed: ${response.status}`);
  } finally {
    clearTimeout(timer);
  }
}

export async function POST(request: NextRequest) {
  try {
    const ip = getClientIp(request);
    if (isRateLimited(ip)) {
      return NextResponse.json(
        { ok: false, message: "등록 요청이 너무 많습니다. 잠시 후 다시 시도해 주세요." },
        { status: 429 },
      );
    }

    const input = (await request.json()) as LeadPayload;
    const result = validateLead(input);

    if (!result.ok) {
      return NextResponse.json({ ok: false, message: result.message }, { status: 400 });
    }

    if (isDuplicate(result.data.phone)) {
      return NextResponse.json(
        { ok: false, message: "이미 접수된 번호입니다. 잠시 후 다시 시도해 주세요." },
        { status: 409 },
      );
    }

    const leadId = createLeadId();
    const lead = {
      ...result.data,
      leadId,
      consentAt: new Date().toISOString(),
      ip,
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

    return NextResponse.json({
      ok: true,
      leadId,
      message: "관심고객 등록이 완료되었습니다.",
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { ok: false, message: "접수 중 오류가 발생했습니다. 잠시 후 다시 시도해 주세요." },
      { status: 500 },
    );
  }
}
