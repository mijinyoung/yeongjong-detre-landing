export function getSheetWebhookSecret() {
  return (
    process.env.GOOGLE_SHEET_WEBHOOK_SECRET?.trim() ||
    process.env.WEBHOOK_SECRET?.trim() ||
    ""
  );
}

export function getSmsWebhookSecret() {
  return (
    process.env.SMS_WEBHOOK_SECRET?.trim() ||
    process.env.WEBHOOK_SECRET?.trim() ||
    ""
  );
}
