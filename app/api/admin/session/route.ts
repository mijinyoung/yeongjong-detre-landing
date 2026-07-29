import { randomUUID } from "node:crypto";
import { NextRequest } from "next/server";
import {
  attachNewAdminSession,
  authorizeAdminMutation,
  clearAdminSession,
  createAdminSession,
  isAdminPasswordConfigured,
  isAdminPasswordValid,
  isAdminSessionConfigured,
  readAdminSession,
  refreshAdminSession,
  validateAdminMutation,
  validateAdminOrigin,
} from "@/lib/admin-session";
import { apiJson } from "@/lib/api-response";

export const runtime = "nodejs";

const MAX_BODY_BYTES = 16 * 1024;
const AUTH_WINDOW_MS = 15 * 60 * 1000;
const AUTH_LIMIT = 10;
const authFailures = new Map<string, number[]>();

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

function hasJsonContentType(request: NextRequest) {
  return request.headers.get("content-type")?.includes("application/json");
}

export function GET(request: NextRequest) {
  const requestId = randomUUID();
  if (!isAdminSessionConfigured()) {
    return apiJson(
      { ok: false, message: "ADMIN_SESSION_SECRET 환경변수가 설정되지 않았습니다." },
      requestId,
      { status: 503 },
    );
  }

  const session = readAdminSession(request);
  if (!session) {
    return clearAdminSession(
      apiJson(
        { ok: false, authenticated: false, message: "관리자 로그인이 필요합니다." },
        requestId,
        { status: 401 },
      ),
    );
  }

  return refreshAdminSession(
    apiJson(
      {
        ok: true,
        authenticated: true,
        csrfToken: session.csrf,
        expiresAt: new Date(session.exp * 1000).toISOString(),
        absoluteExpiresAt: new Date(session.absoluteExp * 1000).toISOString(),
      },
      requestId,
    ),
    session,
  );
}

export async function POST(request: NextRequest) {
  const requestId = randomUUID();
  const ip = getClientIp(request);

  if (isAuthBlocked(ip)) {
    return apiJson(
      { ok: false, message: "로그인 시도가 너무 많습니다. 15분 후 다시 시도해 주세요." },
      requestId,
      { status: 429, headers: { "Retry-After": "900" } },
    );
  }
  if (!isAdminSessionConfigured()) {
    return apiJson(
      { ok: false, message: "ADMIN_SESSION_SECRET 환경변수가 설정되지 않았습니다." },
      requestId,
      { status: 503 },
    );
  }
  if (!isAdminPasswordConfigured()) {
    return apiJson(
      { ok: false, message: "ADMIN_DASHBOARD_TOKEN 환경변수가 설정되지 않았습니다." },
      requestId,
      { status: 503 },
    );
  }

  const origin = validateAdminOrigin(request);
  if (!origin.ok) {
    return apiJson(
      { ok: false, message: origin.message },
      requestId,
      { status: origin.status },
    );
  }

  if (!hasJsonContentType(request)) {
    return apiJson(
      { ok: false, message: "잘못된 요청 형식입니다." },
      requestId,
      { status: 415 },
    );
  }

  const declaredLength = Number(request.headers.get("content-length") || 0);
  if (declaredLength > MAX_BODY_BYTES) {
    return apiJson(
      { ok: false, message: "요청 데이터가 너무 큽니다." },
      requestId,
      { status: 413 },
    );
  }

  let body: { token?: unknown };
  try {
    const raw = await request.text();
    if (new TextEncoder().encode(raw).byteLength > MAX_BODY_BYTES) {
      return apiJson(
        { ok: false, message: "요청 데이터가 너무 큽니다." },
        requestId,
        { status: 413 },
      );
    }
    body = JSON.parse(raw) as { token?: unknown };
  } catch {
    return apiJson(
      { ok: false, message: "요청 내용을 확인해 주세요." },
      requestId,
      { status: 400 },
    );
  }

  const token = typeof body.token === "string" ? body.token.trim().slice(0, 200) : "";
  if (!isAdminPasswordValid(token)) {
    recordAuthFailure(ip);
    return apiJson(
      { ok: false, message: "관리자 비밀번호를 확인해 주세요." },
      requestId,
      { status: 401 },
    );
  }
  authFailures.delete(ip);

  const session = createAdminSession();
  return attachNewAdminSession(
    apiJson(
      {
        ok: true,
        authenticated: true,
        csrfToken: session.csrf,
        expiresAt: new Date(session.exp * 1000).toISOString(),
        absoluteExpiresAt: new Date(session.absoluteExp * 1000).toISOString(),
      },
      requestId,
    ),
    session,
  );
}

export function PATCH(request: NextRequest) {
  const requestId = randomUUID();
  const authorization = authorizeAdminMutation(request);
  if (!authorization.ok) {
    return apiJson(
      { ok: false, message: authorization.message },
      requestId,
      { status: authorization.status },
    );
  }

  return refreshAdminSession(
    apiJson(
      {
        ok: true,
        authenticated: true,
        csrfToken: authorization.session.csrf,
      },
      requestId,
    ),
    authorization.session,
  );
}

export function DELETE(request: NextRequest) {
  const requestId = randomUUID();
  const session = readAdminSession(request);

  if (session) {
    const mutation = validateAdminMutation(request, session);
    if (!mutation.ok) {
      return apiJson(
        { ok: false, message: mutation.message },
        requestId,
        { status: mutation.status },
      );
    }
  } else {
    const origin = validateAdminOrigin(request);
    if (!origin.ok) {
      return apiJson(
        { ok: false, message: origin.message },
        requestId,
        { status: origin.status },
      );
    }
  }

  return clearAdminSession(
    apiJson(
      { ok: true, authenticated: false, message: "관리자 화면을 잠갔습니다." },
      requestId,
    ),
  );
}
