import { createHash } from "node:crypto";

const META_TIMEOUT_MS = 8000;

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

export async function sendMetaLeadEvent(event: MetaLeadEvent) {
  const pixelId = process.env.META_PIXEL_ID || process.env.NEXT_PUBLIC_META_PIXEL_ID;
  const accessToken = process.env.META_CAPI_ACCESS_TOKEN;
  const apiVersion = process.env.META_GRAPH_API_VERSION || "v24.0";

  if (!pixelId || !accessToken) {
    return { configured: false, sent: false };
  }

  const userData: Record<string, unknown> = {
    ph: [sha256(normalizePhoneForMeta(event.phone))],
    fn: [sha256(normalizeName(event.name))],
    client_ip_address: event.ip,
    client_user_agent: event.userAgent,
  };

  if (event.fbp) userData.fbp = event.fbp;
  if (event.fbc) userData.fbc = event.fbc;

  const payload = {
    data: [
      {
        event_name: "Lead",
        event_time: Math.floor(Date.now() / 1000),
        event_id: event.eventId,
        action_source: "website",
        event_source_url: event.eventSourceUrl,
        user_data: userData,
        custom_data: {
          lead_id: event.leadId,
          placement: event.placement || "",
          source: event.source || "",
          campaign: event.campaign || "",
        },
      },
    ],
    ...(process.env.META_TEST_EVENT_CODE
      ? { test_event_code: process.env.META_TEST_EVENT_CODE }
      : {}),
  };

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), META_TIMEOUT_MS);

  try {
    const response = await fetch(
      `https://graph.facebook.com/${apiVersion}/${pixelId}/events?access_token=${encodeURIComponent(accessToken)}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
        cache: "no-store",
        signal: controller.signal,
      },
    );

    if (!response.ok) {
      const detail = await response.text();
      throw new Error(`Meta CAPI failed: ${response.status} ${detail.slice(0, 300)}`);
    }

    return { configured: true, sent: true };
  } finally {
    clearTimeout(timer);
  }
}
