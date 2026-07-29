import "server-only";

import {
  createHmac,
  randomBytes,
  timingSafeEqual,
} from "node:crypto";
import type { NextRequest, NextResponse } from "next/server";

export const ADMIN_IDLE_TTL_SECONDS = 15 * 60;
export const ADMIN_ABSOLUTE_TTL_SECONDS = 8 * 60 * 60;

type AdminSession = {
  v: 1;
  role: "admin";
  sid: string;
  csrf: string;
  iat: number;
  exp: number;
  absoluteExp: number;
};

type AdminAuthorization =
  | { ok: true; session: AdminSession }
  | { ok: false; status: 401 | 403 | 503; message: string };

const PRODUCTION_COOKIE_NAME = "__Host-yd_admin_session";
const DEVELOPMENT_COOKIE_NAME = "yd_admin_session_dev";
const TOKEN_PATTERN = /^[A-Za-z0-9_-]{20,100}$/;

function nowInSeconds() {
  return Math.floor(Date.now() / 1000);
}

function getCookieName() {
  return process.env.NODE_ENV === "production"
    ? PRODUCTION_COOKIE_NAME
    : DEVELOPMENT_COOKIE_NAME;
}

function getSessionSecret() {
  const secret = process.env.ADMIN_SESSION_SECRET?.trim() || "";
  return secret.length >= 32 ? secret : "";
}

function signPayload(payload: string, secret: string) {
  return createHmac("sha256", secret).update(payload).digest("base64url");
}

function encodeSession(session: AdminSession) {
  const secret = getSessionSecret();
  if (!secret) return "";

  const payload = Buffer.from(JSON.stringify(session)).toString("base64url");
  return `${payload}.${signPayload(payload, secret)}`;
}

function safeEqual(value: string, expected: string) {
  const valueBuffer = Buffer.from(value);
  const expectedBuffer = Buffer.from(expected);
  return (
    valueBuffer.length === expectedBuffer.length &&
    timingSafeEqual(valueBuffer, expectedBuffer)
  );
}

function parseAllowedOrigin(value: string) {
  try {
    const url = new URL(value.trim());
    return url.protocol === "https:" || url.protocol === "http:"
      ? url.origin
      : "";
  } catch {
    return "";
  }
}

function getAllowedOrigins(request: NextRequest) {
  const configured =
    process.env.ADMIN_ALLOWED_ORIGINS?.trim() ||
    process.env.NEXT_PUBLIC_SITE_URL?.trim() ||
    "";
  const origins = new Set(
    configured
      .split(",")
      .map(parseAllowedOrigin)
      .filter(Boolean),
  );

  if (process.env.NODE_ENV !== "production") {
    origins.add(request.nextUrl.origin);
  }
  return origins;
}

function validateSessionShape(value: unknown): value is AdminSession {
  if (!value || typeof value !== "object" || Array.isArray(value)) return false;
  const session = value as Partial<AdminSession>;
  const now = nowInSeconds();

  return (
    session.v === 1 &&
    session.role === "admin" &&
    typeof session.sid === "string" &&
    TOKEN_PATTERN.test(session.sid) &&
    typeof session.csrf === "string" &&
    TOKEN_PATTERN.test(session.csrf) &&
    Number.isInteger(session.iat) &&
    Number.isInteger(session.exp) &&
    Number.isInteger(session.absoluteExp) &&
    Number(session.iat) <= now + 60 &&
    Number(session.exp) > now &&
    Number(session.absoluteExp) > now &&
    Number(session.exp) <= Number(session.absoluteExp)
  );
}

function setCookie(response: NextResponse, session: AdminSession) {
  const value = encodeSession(session);
  if (!value) return response;

  const now = nowInSeconds();
  const maxAge = Math.max(0, session.exp - now);
  response.cookies.set(getCookieName(), value, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    path: "/",
    maxAge,
    expires: new Date(session.exp * 1000),
    priority: "high",
  });
  return response;
}

export function isAdminSessionConfigured() {
  return Boolean(getSessionSecret());
}

export function isAdminPasswordConfigured() {
  return Boolean(process.env.ADMIN_DASHBOARD_TOKEN?.trim());
}

export function isAdminPasswordValid(input: string) {
  const expected = process.env.ADMIN_DASHBOARD_TOKEN?.trim() || "";
  return Boolean(expected && input && safeEqual(input, expected));
}

export function createAdminSession() {
  const now = nowInSeconds();
  const absoluteExp = now + ADMIN_ABSOLUTE_TTL_SECONDS;
  return {
    v: 1,
    role: "admin",
    sid: randomBytes(24).toString("base64url"),
    csrf: randomBytes(24).toString("base64url"),
    iat: now,
    exp: Math.min(now + ADMIN_IDLE_TTL_SECONDS, absoluteExp),
    absoluteExp,
  } satisfies AdminSession;
}

export function readAdminSession(request: NextRequest) {
  const secret = getSessionSecret();
  const token = request.cookies.get(getCookieName())?.value || "";
  if (!secret || !token || token.length > 1200) return null;

  const parts = token.split(".");
  if (parts.length !== 2 || !parts[0] || !parts[1]) return null;
  const [payload, signature] = parts;
  const expectedSignature = signPayload(payload, secret);
  if (!safeEqual(signature, expectedSignature)) return null;

  try {
    const parsed = JSON.parse(
      Buffer.from(payload, "base64url").toString("utf8"),
    ) as unknown;
    return validateSessionShape(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

export function validateAdminOrigin(request: NextRequest) {
  const origin = request.headers.get("origin") || "";
  const allowedOrigins = getAllowedOrigins(request);

  if (!allowedOrigins.size) {
    return {
      ok: false as const,
      status: 503 as const,
      message: "관리자 허용 주소가 설정되지 않았습니다.",
    };
  }
  if (!origin || !allowedOrigins.has(parseAllowedOrigin(origin))) {
    return {
      ok: false as const,
      status: 403 as const,
      message: "허용되지 않은 관리자 요청입니다.",
    };
  }

  const fetchSite = request.headers.get("sec-fetch-site");
  if (fetchSite && fetchSite !== "same-origin" && fetchSite !== "none") {
    return {
      ok: false as const,
      status: 403 as const,
      message: "허용되지 않은 관리자 요청입니다.",
    };
  }
  return { ok: true as const };
}

export function validateAdminMutation(
  request: NextRequest,
  session: AdminSession,
) {
  const origin = validateAdminOrigin(request);
  if (!origin.ok) return origin;

  const csrf = request.headers.get("x-admin-csrf") || "";
  if (!csrf || !safeEqual(csrf, session.csrf)) {
    return {
      ok: false as const,
      status: 403 as const,
      message: "관리자 요청 확인값이 올바르지 않습니다.",
    };
  }
  return { ok: true as const };
}

export function authorizeAdminMutation(
  request: NextRequest,
): AdminAuthorization {
  if (!isAdminSessionConfigured()) {
    return {
      ok: false,
      status: 503,
      message: "관리자 세션 환경변수가 설정되지 않았습니다.",
    };
  }

  const session = readAdminSession(request);
  if (!session) {
    return {
      ok: false,
      status: 401,
      message: "관리자 로그인이 만료되었습니다.",
    };
  }

  const mutation = validateAdminMutation(request, session);
  return mutation.ok
    ? { ok: true, session }
    : mutation;
}

export function refreshAdminSession(
  response: NextResponse,
  session: AdminSession,
) {
  const now = nowInSeconds();
  if (session.absoluteExp <= now) return response;

  return setCookie(response, {
    ...session,
    iat: now,
    exp: Math.min(now + ADMIN_IDLE_TTL_SECONDS, session.absoluteExp),
  });
}

export function attachNewAdminSession(
  response: NextResponse,
  session: AdminSession,
) {
  return setCookie(response, session);
}

export function clearAdminSession(response: NextResponse) {
  const expire = (
    name: string,
    secure: boolean,
  ) => {
    response.cookies.set(name, "", {
      httpOnly: true,
      secure,
      sameSite: "strict",
      path: "/",
      maxAge: 0,
      expires: new Date(0),
      priority: "high",
    });
  };

  expire(DEVELOPMENT_COOKIE_NAME, false);
  expire(PRODUCTION_COOKIE_NAME, true);
  return response;
}

export type { AdminSession };
