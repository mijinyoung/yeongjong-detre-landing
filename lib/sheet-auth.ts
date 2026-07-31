import "server-only";

import { createHash } from "node:crypto";
import { projectConfig } from "@/data/project-config";
import { getSheetWebhookSecret } from "@/lib/webhook-secrets";

const SHEET_CONNECTION_VERSION = "YD_SHEET_CAPABILITY_V1";

function normalizeWebhookUrl(value: string) {
  const url = new URL(value.trim());
  return `${url.origin}${url.pathname}`.replace(/\/+$/, "");
}

export function createSheetWebhookPayload(
  webhookUrl: string,
  payload: Record<string, unknown>,
) {
  const normalizedUrl = normalizeWebhookUrl(webhookUrl);
  const connectionKey = createHash("sha256")
    .update(
      `${normalizedUrl}|${projectConfig.projectCode}|${SHEET_CONNECTION_VERSION}`,
      "utf8",
    )
    .digest("hex");
  const legacySecret = getSheetWebhookSecret();

  return {
    ...payload,
    _sheetConnectionKey: connectionKey,
    ...(legacySecret ? { _webhookSecret: legacySecret } : {}),
  };
}
