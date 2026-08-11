import { createHash } from "node:crypto";
import { projectConfig } from "@/data/project-config";

const META_TIMEOUT_MS = 8000;
const META_PIXEL_ID_PATTERN = /^\d{10,25}$/;
const META_API_VERSION_PATTERN = /^v\d+\.\d+$/;

type MetaLeadEvent = {
  eventId: string;
  eventSourceUrl?: string;
  name: string;
  phone: string;
  ip: string;
  userAgent: string;
  fbp?: string;
  fbc?: string;
  leadId: string;
  placement?: string;
  source?: string;
  campaign?: string;
};

type MetaApiResponse = {
  events_received?: number;
  fbtrace_id?: string;
  error?: {
    message?: string;
    type?: string;
    code?: number;
    error_subcode?: number;
    fbtrace_id?: string;
  };
};

function sha256(value: string) {
  return createHash("sha256").update(value).digest("hex");
}

function normalizePhoneForMeta(phone: string) {
  const digits = phone.replace(/\D/g, "");
  if (digits.startsWith("0")) return `82${digits.slice(1)}`;
  return digits;
}

function normalizeName(value: string) {
  return value.trim().toLowerCase().replace(/\s+/g, "");
}

function optionalString(value: string | undefined, maxLength: number) {
  const normalized = value?.trim();
  return normalized ? normalized.slice(0, maxLength) : undefined;
}

function normalizeEventSourceUrl(value?: string) {
  const candidates = [
    value,
    process.env.NEXT_PUBLIC_SITE_URL,
    "https://exio.kr",
  ];

  for (const candidate of candidates) {
    if (!candidate) continue;

    try {
      const url = new URL(candidate);
      if (url.protocol === "https:" || url.protocol === "http:") {
        return url.toString();
      }
    } catch {
      // 다음 후보 주소를 사용합니다.
    }
  }

  return "https://exio.kr/";
}

export function isMetaCapiConfigured() {
  const pixelId = process.env.META_PIXEL_ID?.trim() || "";
  const accessToken = process.env.META_CAPI_ACCESS_TOKEN?.trim() || "";

  return META_PIXEL_ID_PATTERN.test(pixelId) && Boolean(accessToken);
}

export async function sendMetaLeadEvent(event: MetaLeadEvent) {
  const pixelId = process.env.META_PIXEL_ID?.trim() || "";
  const accessToken = process.env.META_CAPI_ACCESS_TOKEN?.trim() || "";
  const configuredApiVersion = process.env.META_GRAPH_API_VERSION?.trim() || "";
  const apiVersion = META_API_VERSION_PATTERN.test(configuredApiVersion)
    ? configuredApiVersion
    : "v24.0";

  if (!pixelId || !accessToken) {
    return { configured: false, sent: false, detail: "Meta CAPI not configured" };
  }

  if (!META_PIXEL_ID_PATTERN.test(pixelId)) {
    throw new Error("Meta CAPI pixel ID is invalid");
  }

  const eventId = optionalString(event.eventId, 100);
  const leadId = optionalString(event.leadId, 100);
  const normalizedPhone = normalizePhoneForMeta(event.phone);
  const normalizedName = normalizeName(event.name);

  if (!eventId || !leadId || !normalizedPhone || !normalizedName) {
    throw new Error("Meta CAPI event is missing required identifiers");
  }

  const userData: Record<string, unknown> = {
    ph: [sha256(normalizedPhone)],
    fn: [sha256(normalizedName)],
  };

  const clientIp = optionalString(event.ip, 64);
  const userAgent = optionalString(event.userAgent, 500);
  const fbp = optionalString(event.fbp, 255);
  const fbc = optionalString(event.fbc, 255);

  if (clientIp && clientIp !== "unknown") userData.client_ip_address = clientIp;
  if (userAgent) userData.client_user_agent = userAgent;
  if (fbp) userData.fbp = fbp;
  if (fbc) userData.fbc = fbc;

  const payload = {
    data: [
      {
        event_name: "Lead",
        event_time: Math.floor(Date.now() / 1000),
        event_id: eventId,
        action_source: "website",
        event_source_url: normalizeEventSourceUrl(event.eventSourceUrl),
        user_data: userData,
        custom_data: {
          project_code: projectConfig.projectCode,
          project_name: projectConfig.identity.name,
          lead_id: leadId,
          placement: optionalString(event.placement, 120) || "",
          source: optionalString(event.source, 120) || "",
          campaign: optionalString(event.campaign, 160) || "",
        },
      },
    ],
    ...(process.env.META_TEST_EVENT_CODE?.trim()
      ? { test_event_code: process.env.META_TEST_EVENT_CODE.trim() }
      : {}),
  };

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), META_TIMEOUT_MS);

  try {
    const response = await fetch(
      `https://graph.facebook.com/${apiVersion}/${pixelId}/events`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
        cache: "no-store",
        signal: controller.signal,
      },
    );

    const result = (await response.json().catch(() => ({}))) as MetaApiResponse;

    if (!response.ok) {
      const error = result.error;
      const safeDetail = [
        error?.message,
        error?.type,
        typeof error?.code === "number" ? `code ${error.code}` : "",
        typeof error?.error_subcode === "number"
          ? `subcode ${error.error_subcode}`
          : "",
        error?.fbtrace_id ? `trace ${error.fbtrace_id}` : "",
      ]
        .filter(Boolean)
        .join(" / ")
        .slice(0, 500);

      throw new Error(
        `Meta CAPI failed: ${response.status}${safeDetail ? ` / ${safeDetail}` : ""}`,
      );
    }

    const received = Number(result.events_received);
    if (!Number.isFinite(received) || received < 1) {
      throw new Error("Meta CAPI response did not accept the Lead event");
    }
    const trace = optionalString(result.fbtrace_id, 80);

    return {
      configured: true,
      sent: true,
      detail: [
        `Meta CAPI accepted ${received} event${received === 1 ? "" : "s"}`,
        trace ? `trace ${trace}` : "",
      ]
        .filter(Boolean)
        .join(" / "),
    };
  } finally {
    clearTimeout(timer);
  }
}
