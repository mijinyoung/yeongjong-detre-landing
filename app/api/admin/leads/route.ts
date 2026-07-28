import { timingSafeEqual } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

const FETCH_TIMEOUT_MS = 8000;
const NO_STORE_HEADERS = { "Cache-Control": "no-store" };
const AUTH_WINDOW_MS = 15 * 60 * 1000;
const AUTH_LIMIT = 10;
const authFailures = new Map<string, number[]>();

function safeEqual(input: string, expected: string) {
  const a = Buffer.from(input);
  const b = Buffer.from(expected);
  return a.length === b.length && timingSafeEqual(a, b);
}

function getClientIp(request: NextRequest) {
  return request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
}

function isAuthBlocked(ip: string) {
  const now = Date.now();
  const recent = (authFailures.get(ip) || []).filter(
    (time) => now - time < AUTH_WINDOW_MS,
  );
  if (recent.length) authFailures.set(ip, recent);
  else authFailures.delete(ip);
  return recent.length >= AUTH_LIMIT;
}

function recordAuthFailure(ip: string) {
  const recent = authFailures.get(ip) || [];
  recent.push(Date.now());
  authFailures.set(ip, recent.slice(-AUTH_LIMIT));
}

export async function POST(request: NextRequest) {
  try {
    const ip = getClientIp(request);
    if (isAuthBlocked(ip)) {
      return NextResponse.json(
        { ok: false, message: "로그인 시도가 너무 많습니다. 15분 후 다시 시도해 주세요." },
        {
          status: 429,
          headers: { ...NO_STORE_HEADERS, "Retry-After": "900" },
        },
      );
    }

    if (!request.headers.get("content-type")?.includes("application/json")) {
      return NextResponse.json(
        { ok: false, message: "잘못된 요청 형식입니다." },
        { status: 415, headers: NO_STORE_HEADERS },
      );
    }

    let body: { token?: unknown };
    try {
      body = (await request.json()) as { token?: unknown };
    } catch {
      return NextResponse.json(
        { ok: false, message: "요청 내용을 확인해 주세요." },
        { status: 400, headers: NO_STORE_HEADERS },
      );
    }

    const token = typeof body.token === "string" ? body.token.slice(0, 200) : "";
    const expectedToken = process.env.ADMIN_DASHBOARD_TOKEN || "";

    if (!expectedToken || !token || !safeEqual(token, expectedToken)) {
      recordAuthFailure(ip);
      return NextResponse.json(
        { ok: false, message: "관리자 비밀번호를 확인해 주세요." },
        { status: 401, headers: NO_STORE_HEADERS },
      );
    }
    authFailures.delete(ip);

    const sheetWebhook = process.env.GOOGLE_SHEET_WEBHOOK_URL;
    if (!sheetWebhook) {
      return NextResponse.json(
        { ok: false, message: "Google Sheets 연동이 설정되지 않았습니다." },
        { status: 503, headers: NO_STORE_HEADERS },
      );
    }

    const url = new URL(sheetWebhook);
    url.searchParams.set("action", "list");
    url.searchParams.set("limit", "200");
    url.searchParams.set("_webhookSecret", process.env.WEBHOOK_SECRET || "");

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

    try {
      const response = await fetch(url, {
        cache: "no-store",
        signal: controller.signal,
      });
      const text = await response.text();

      if (!response.ok) {
        throw new Error(`Google Sheets 응답 오류: ${response.status}`);
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

      return NextResponse.json(
        {
          ok: true,
          leads: Array.isArray(result.leads) ? result.leads : [],
          total: Number(result.total || 0),
          updatedAt: result.updatedAt || new Date().toISOString(),
        },
        { headers: NO_STORE_HEADERS },
      );
    } finally {
      clearTimeout(timer);
    }
  } catch (error) {
    console.error("Admin dashboard error", error);
    return NextResponse.json(
      { ok: false, message: "접수 현황을 불러오는 중 오류가 발생했습니다." },
      { status: 500, headers: NO_STORE_HEADERS },
    );
  }
}
