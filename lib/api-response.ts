import { NextResponse } from "next/server";

export function apiJson(
  body: Record<string, unknown>,
  requestId: string,
  init: ResponseInit = {},
) {
  const headers = new Headers(init.headers);
  headers.set("Cache-Control", "no-store");
  headers.set("X-Request-ID", requestId);

  return NextResponse.json(
    { ...body, requestId },
    { ...init, headers },
  );
}
